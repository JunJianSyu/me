---
title: "GHUB宏"
date: "2026-10-22"
category: "技术"
tags: ["GHUB"]
excerpt: "GHUB宏"
featured: true
---

## GHUB宏示例

```
--[[
  G HUB 网格点击宏   (2K / 2560x1440)

  按键:
    G6 (6号键) 取点 —— 按一下把当前鼠标位置的像素坐标打到日志，
                      依次提示填入 START / A / B / C，4 个一轮循环
    G4 (4号键) 运行 —— 按一次跑完 33 轮后自动停止
    G5 (5号键) 中止 —— 运行中按住立即停下

  每轮流程:
    1) 移动到网格点 (START_X + col*100, START_Y + row*100) -> 右键 -> 停 1s
    2) 移动到固定点 A -> 左键 -> 停 1s
       移动到固定点 B -> 左键 -> 停 1s
    3) 移动到固定点 C -> 左键 -> 停 1s

  网格 = 3 行 x 11 列，每行 11 个后 x 回到 START_X、y 下移 100px。
]]

--------------------------------------------------------------------
-- 配置区：只改这里
--------------------------------------------------------------------

-- 屏幕分辨率（主显示器）。MoveMouseTo 用的是 0~65535 归一化坐标，
-- 必须靠这个把像素换算过去，填错会导致所有点击位置整体偏移。
local SCREEN_W = 2560   -- 2K / QHD
local SCREEN_H = 1440

-- 第 1 步：网格起始点（像素，屏幕左上角为原点）
-- 33 轮会覆盖 x: START_X ~ START_X+1000, y: START_Y ~ START_Y+200
local START_X = 400
local START_Y = 400

-- 网格步进与规模
local STEP_X   = 100   -- 每次右移 100px
local STEP_Y   = 100   -- 每满一行下移 100px
local PER_ROW  = 11    -- 每行 11 个
local TOTAL    = 33    -- 总共 33 次 (= 3 行)

-- 第 2 步：两个固定点（像素）
local FIXED_A_X, FIXED_A_Y = 2000, 530
local FIXED_B_X, FIXED_B_Y = 2000, 670

-- 第 3 步：固定点（像素）
local FIXED_C_X, FIXED_C_Y = 2000, 400

-- 节奏
local STEP_DELAY_MS  = 1000  -- 每次点击后的停顿
local CLICK_HOLD_MS  = 30    -- 按键按下到松开的时长
local MOVE_SETTLE_MS = 60    -- 移动到位后、点击前的稳定时间
local POLL_MS        = 50    -- 中止键轮询粒度

-- 按键
local TRIGGER_BUTTON = 4     -- 触发键：鼠标 4 号键 (G4 侧键)
local ABORT_BUTTON   = 5     -- 中止键：鼠标 5 号键 (G5 侧键)，运行中按住即停
local PICK_BUTTON    = 6     -- 取点键：鼠标 6 号键，按一下记录当前鼠标像素坐标

local LEFT  = 1
local RIGHT = 3

--------------------------------------------------------------------
-- 实现
--------------------------------------------------------------------

local function toAbs(px, py)
  local nx = math.floor(px * 65535 / SCREEN_W + 0.5)
  local ny = math.floor(py * 65535 / SCREEN_H + 0.5)
  if nx < 0 then nx = 0 elseif nx > 65535 then nx = 65535 end
  if ny < 0 then ny = 0 elseif ny > 65535 then ny = 65535 end
  return nx, ny
end

-- 可被中止的等待。返回 false 表示用户要求停止。
local function wait(ms)
  local left = ms
  while left > 0 do
    if IsMouseButtonPressed(ABORT_BUTTON) then
      return false
    end
    local chunk = math.min(POLL_MS, left)
    Sleep(chunk)
    left = left - chunk
  end
  return true
end

-- 移动 + 点击 + 停顿，返回 false 表示被中止
local function clickAt(px, py, button)
  local ax, ay = toAbs(px, py)
  MoveMouseTo(ax, ay)
  if not wait(MOVE_SETTLE_MS) then return false end

  PressMouseButton(button)
  Sleep(CLICK_HOLD_MS)
  ReleaseMouseButton(button)

  return wait(STEP_DELAY_MS)
end

-- 取点工具：按 PICK_BUTTON 记录当前鼠标的像素坐标，
-- 依次对应 起始点 / A / B / C，记满 4 个后自动从头循环。
local PICK_LABELS = {
  "START_X, START_Y   (第1步 网格起始点)",
  "FIXED_A_X, FIXED_A_Y (第2步 第1个固定点)",
  "FIXED_B_X, FIXED_B_Y (第2步 第2个固定点)",
  "FIXED_C_X, FIXED_C_Y (第3步 固定点)",
}
local pickIndex = 0

local function pickPoint()
  local nx, ny = GetMousePosition()
  local px = math.floor(nx * SCREEN_W / 65535 + 0.5)
  local py = math.floor(ny * SCREEN_H / 65535 + 0.5)

  pickIndex = pickIndex + 1
  local label = PICK_LABELS[pickIndex] or ("额外取点 #" .. pickIndex)

  OutputLogMessage("取点 %d -> %d, %d    填入: %s\n", pickIndex, px, py, label)

  if pickIndex >= #PICK_LABELS then
    pickIndex = 0
    OutputLogMessage("-- 4 个点已取完，再按从 START 重新开始 --\n")
  end
end

local function runMacro()
  OutputLogMessage("网格宏开始: %d 轮, %d x %d, 分辨率 %dx%d\n",
                   TOTAL, PER_ROW, math.floor(TOTAL / PER_ROW), SCREEN_W, SCREEN_H)

  for i = 0, TOTAL - 1 do
    local row = math.floor(i / PER_ROW)
    local col = i % PER_ROW
    local gx  = START_X + col * STEP_X
    local gy  = START_Y + row * STEP_Y

    OutputLogMessage("[%02d/%02d] row=%d col=%d grid=(%d,%d)\n", i + 1, TOTAL, row, col, gx, gy)

    -- 1) 网格点右键
    if not clickAt(gx, gy, RIGHT) then break end

    -- 2) 固定点 A 左键，再固定点 B 左键
    if not clickAt(FIXED_A_X, FIXED_A_Y, LEFT) then break end
    if not clickAt(FIXED_B_X, FIXED_B_Y, LEFT) then break end

    -- 3) 固定点 C 左键
    if not clickAt(FIXED_C_X, FIXED_C_Y, LEFT) then break end

    if IsMouseButtonPressed(ABORT_BUTTON) then break end
  end

  -- 兜底：确保按键不会卡住
  ReleaseMouseButton(LEFT)
  ReleaseMouseButton(RIGHT)
  OutputLogMessage("网格宏结束\n")
end

function OnEvent(event, arg, family)
  if event == "PROFILE_ACTIVATED" then
    EnablePrimaryMouseButtonEvents(true)
    OutputLogMessage("脚本已加载。G%d=取点  G%d=运行  G%d=中止\n",
                     PICK_BUTTON, TRIGGER_BUTTON, ABORT_BUTTON)
  elseif event == "MOUSE_BUTTON_PRESSED" and arg == PICK_BUTTON then
    pickPoint()
  elseif event == "MOUSE_BUTTON_PRESSED" and arg == TRIGGER_BUTTON then
    runMacro()
  end
end
```
