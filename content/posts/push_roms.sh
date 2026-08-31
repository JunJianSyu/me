#!/bin/bash
# ============================================================
#  Lemuroid ROM 批量推送脚本
#  用法：修改变量区后直接运行 ./push_roms.sh
#  平台：macOS / Linux（Windows 用户见文末说明）
# ============================================================

# ====== 变量区（改成你的实际值）======
TV_IP="192.168.1.100"                                    # 电视的局域网IP
ADB_PORT=5555                                              # ADB端口，一般不用改
LOCAL_ROM_DIR="$HOME/Downloads/roms"                       # 本地ROM目录（支持子文件夹按平台分类）
REMOTE_ROM_DIR="/storage/emulated/0/Lemuroid/roms"        # 电视上的目标目录
# =====================================

# 颜色定义
G="\033[0;32m"   # 绿色
Y="\033[1;33m"   # 黄色
R="\033[0;31m"   # 红色
C="\033[0;36m"   # 青色
D="\033[0;90m"   # 灰色
N="\033[0m"      # 重置

echo -e "${G}╔══════════════════════════════════════════╗${N}"
echo -e "${G}║     Lemuroid ROM 批量推送脚本 v1.0       ║${N}"
echo -e "${G}╚══════════════════════════════════════════╝${N}"
echo ""

# ---- 前置检查 ----

# 检查 adb 是否安装
if ! command -v adb &> /dev/null; then
    echo -e "${R}[错误] 未找到 adb 命令${N}"
    echo ""
    echo "请先安装 Android Platform Tools："
    echo "  macOS:  brew install --cask android-platform-tools"
    echo "  或下载:  https://developer.android.com/tools/releases/platform-tools"
    exit 1
fi

# 检查本地 ROM 目录
if [ ! -d "$LOCAL_ROM_DIR" ]; then
    echo -e "${R}[错误] 本地ROM目录不存在: $LOCAL_ROM_DIR${N}"
    echo "请在脚本顶部修改变量 LOCAL_ROM_DIR 为你的实际 ROM 路径"
    exit 1
fi

# 统计文件数
TOTAL=$(find "$LOCAL_ROM_DIR" -type f \( \
    -iname "*.nes"  -o -iname "*.smc" -o -iname "*.sfc" \
    -o -iname "*.gb"  -o -iname "*.gbc" -o -iname "*.gba" \
    -o -iname "*.n64" -o -iname "*.z64" -o -iname "*.nds" \
    -o -iname "*.3ds" -o -iname "*.sms" -o -iname "*.gen" \
    -o -iname "*.smd" -o -iname "*.md"  -o -iname "*.gg"  \
    -o -iname "*.iso" -o -iname "*.pbp" -o -iname "*.chd" \
    -o -iname "*.cue" -o -iname "*.cso" -o -iname "*.zip" \
    -o -iname "*.a26" -o -iname "*.a78" -o -iname "*.bin" \
    -o -iname "*.lnx" -o -iname "*.pce" -o -iname "*.ngp" \
    -o -iname "*.ws"  -o -iname "*.wsc" -o -iname "*.dosz" \
\) | wc -l | tr -d ' ')

if [ "$TOTAL" -eq 0 ]; then
    echo -e "${Y}[提示] 在 $LOCAL_ROM_DIR 中没有找到已识别的ROM文件${N}"
    echo "支持的格式: .nes .smc .gb .gba .n64 .iso .zip .pce 等"
    echo ""
    echo "是否仍然推送目录中所有文件？(y/N)"
    read -r CONFIRM
    if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
        echo "已取消。"
        exit 0
    fi
    TOTAL=$(find "$LOCAL_ROM_DIR" -type f | wc -l | tr -d ' ')
fi

echo -e "${C}本地ROM目录${N}: $LOCAL_ROM_DIR"
echo -e "${C}电视目标路径${N}: $REMOTE_ROM_DIR"
echo -e "${C}检测到ROM文件${N}: ${TOTAL} 个"
echo ""

# ---- 步骤1：连接电视 ----

echo -e "${Y}[1/4] 连接电视 ${TV_IP}:${ADB_PORT} ...${N}"
adb disconnect "${TV_IP}:${ADB_PORT}" &> /dev/null
adb connect "${TV_IP}:${ADB_PORT}"

# 等待设备响应（最多10秒）
WAIT=0
while [ $WAIT -lt 10 ]; do
    if adb devices | grep -q "${TV_IP}:${ADB_PORT}\s\+device"; then
        break
    fi
    sleep 1
    ((WAIT++))
done

# 最终检查连接状态
if ! adb devices | grep -q "${TV_IP}:${ADB_PORT}\s\+device"; then
    echo ""
    echo -e "${R}[错误] 无法连接到电视${N}"
    echo ""
    echo "排查清单："
    echo "  1. 电视和电脑在同一局域网？"
    echo "  2. 电视已开启 ADB 调试？（设置 > 开发者选项）"
    echo "  3. 电视IP是否正确？当前设置: ${TV_IP}"
    echo "     查看方法: 电视 设置 > 网络 > 网络信息"
    echo "  4. 电视上是否弹出了授权确认？用遥控器选允许"
    echo ""
    echo -e "${D}提示: 如果开发者选项里没有 ADB 调试开关，${N}"
    echo -e "${D}      去 设置 > 关于 > 连续点击版本号7次 即可激活${N}"
    exit 1
fi

echo -e "${G}  ✓ 已连接${N}"
echo ""

# ---- 步骤2：确保远程目录存在 ----

echo -e "${Y}[2/4] 创建远程目录...${N}"
adb -s "${TV_IP}:${ADB_PORT}" shell "mkdir -p ${REMOTE_ROM_DIR}" 2>/dev/null
echo -e "${G}  ✓ 目录就绪${N}"
echo ""

# ---- 步骤3：推送ROM ----

echo -e "${Y}[3/4] 开始推送 ${TOTAL} 个ROM文件...${N}"
echo ""

SUCCESS=0
FAIL=0
COUNT=0

# 递归遍历本地ROM目录，逐文件推送
# 保留子目录结构（如 NES/、SNES/、GBA/ 等分类）
find "$LOCAL_ROM_DIR" -type f | while IFS= read -r FILE; do
    COUNT=$((COUNT + 1))

    # 计算相对路径（去掉本地根目录前缀）
    REL_PATH="${FILE#$LOCAL_ROM_DIR/}"
    REMOTE_PATH="${REMOTE_ROM_DIR}/${REL_PATH}"

    # 如果远程子目录不存在，先创建
    REMOTE_SUBDIR=$(dirname "$REMOTE_PATH")
    adb -s "${TV_IP}:${ADB_PORT}" shell "mkdir -p '${REMOTE_SUBDIR}'" 2>/dev/null

    # 显示进度
    FILE_NAME=$(basename "$FILE")
    printf "\r  [%d/%d] %s" "$COUNT" "$TOTAL" "$FILE_NAME"
    # 截断过长的文件名
    printf "%*s" $((50 - ${#FILE_NAME})) ""

    # 推送文件
    if adb -s "${TV_IP}:${ADB_PORT}" push "$FILE" "$REMOTE_PATH" &> /dev/null; then
        printf " ${G}✓${N}"
        # 不能在子shell中修改外部变量，用文件记录
        echo "ok" >> /tmp/rom_push_status
    else
        printf " ${R}✗${N}"
        echo "fail" >> /tmp/rom_push_status
    fi

    echo ""

done

# 统计结果
if [ -f /tmp/rom_push_status ]; then
    SUCCESS=$(grep -c "ok" /tmp/rom_push_status 2>/dev/null || echo 0)
    FAIL=$(grep -c "fail" /tmp/rom_push_status 2>/dev/null || echo 0)
    rm -f /tmp/rom_push_status
fi

echo ""

# ---- 步骤4：完成 ----

echo -e "${Y}[4/4] 推送完成${N}"
echo ""
echo -e "${G}╔══════════════════════════════════════════╗${N}"
echo -e "${G}║              推送结果                   ║${N}"
echo -e "${G}╠══════════════════════════════════════════╣${N}"
echo -e "${G}  成功: ${SUCCESS} 个${N}"
echo -e "${G}  失败: ${FAIL} 个${N}"
echo -e "${G}  总计: ${TOTAL} 个${N}"
echo -e "${G}╚══════════════════════════════════════════╝${N}"
echo ""
echo -e "${C}下一步：${N}"
echo "  1. 在电视上打开 Lemuroid"
echo "  2. 进入 设置 > 存储 > 重新扫描ROM"
echo "  3. 等待扫描完成后即可看到游戏"
echo ""
echo -e "${D}提示: 扫描时间取决于ROM数量，一般几秒到几十秒${N}"

# 断开连接
adb disconnect "${TV_IP}:${ADB_PORT}" &> /dev/null
