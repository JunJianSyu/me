@echo off
chcp 65001 >nul
REM ============================================================
REM  Lemuroid ROM 批量推送脚本 (Windows 版)
REM  用法：修改变量区后双击运行
REM ============================================================

REM ====== 变量区（改成你的实际值）======
set "TV_IP=192.168.1.100"
set "ADB_PORT=5555"
set "LOCAL_ROM_DIR=D:\roms"
set "REMOTE_ROM_DIR=/storage/emulated/0/Lemuroid/roms"
REM =====================================

echo.
echo ╔══════════════════════════════════════════╗
echo ║     Lemuroid ROM 批量推送脚本 v1.0       ║
echo ╚══════════════════════════════════════════╝
echo.

REM ---- 检查 adb ----
where adb >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到 adb 命令
    echo.
    echo 请下载 Android Platform Tools：
    echo   https://developer.android.com/tools/releases/platform-tools
    echo   解压后将目录路径添加到系统 PATH 环境变量
    echo   或把 adb.exe 放到本脚本同目录下
    pause
    exit /b 1
)

REM ---- 检查本地ROM目录 ----
if not exist "%LOCAL_ROM_DIR%" (
    echo [错误] 本地ROM目录不存在: %LOCAL_ROM_DIR%
    echo 请在脚本顶部修改变量 LOCAL_ROM_DIR 为你的实际 ROM 路径
    pause
    exit /b 1
)

echo 本地ROM目录: %LOCAL_ROM_DIR%
echo 电视目标路径: %REMOTE_ROM_DIR%
echo.

REM ---- 步骤1：连接电视 ----
echo [1/4] 连接电视 %TV_IP%:%ADB_PORT% ...
adb disconnect %TV_IP%:%ADB_PORT% >nul 2>nul
adb connect %TV_IP%:%ADB_PORT%

timeout /t 2 /nobreak >nul

adb devices | findstr "%TV_IP%:%ADB_PORT%.*device" >nul
if %errorlevel% neq 0 (
    echo.
    echo [错误] 无法连接到电视
    echo.
    echo 排查清单：
    echo   1. 电视和电脑在同一局域网？
    echo   2. 电视已开启 ADB 调试？
    echo   3. 电视IP是否正确？当前设置: %TV_IP%
    echo      查看: 电视 设置 ^> 网络 ^> 网络信息
    echo   4. 电视上是否弹出了授权确认？用遥控器选允许
    echo.
    echo 提示: 如果没有开发者选项，去 设置 ^> 关于 ^>
    echo       连续点击版本号7次 即可激活
    pause
    exit /b 1
)
echo   √ 已连接
echo.

REM ---- 步骤2：创建远程目录 ----
echo [2/4] 创建远程目录...
adb -s %TV_IP%:%ADB_PORT% shell "mkdir -p %REMOTE_ROM_DIR%" >nul 2>nul
echo   √ 目录就绪
echo.

REM ---- 步骤3：推送ROM ----
echo [3/4] 开始推送ROM文件...
echo.

set SUCCESS=0
set FAIL=0

REM 递归遍历本地ROM目录
for /r "%LOCAL_ROM_DIR%" %%F in (*) do (
    REM 计算相对路径
    set "FULL_PATH=%%F"
    set "FILE_NAME=%%~nxF"
    set "REL_PATH=%%~pF"
    REM 去掉驱动器号和根目录，得到相对路径
    call set "REL_PATH=%%REL_PATH:%LOCAL_ROM_DIR%=%%"
    set "REL_PATH=!REL_PATH:~1!"

    REM 构建远程路径
    set "REMOTE_PATH=%REMOTE_ROM_DIR%/!REL_PATH!/!FILE_NAME!"

    REM 创建远程子目录
    adb -s %TV_IP%:%ADB_PORT% shell "mkdir -p '%REMOTE_ROM_DIR%/!REL_PATH!'" >nul 2>nul

    echo   推送: !FILE_NAME!
    adb -s %TV_IP%:%ADB_PORT% push "%%F" "!REMOTE_PATH!" >nul 2>nul
    if !errorlevel! equ 0 (
        echo     √ 成功
        set /a SUCCESS+=1
    ) else (
        echo     ✗ 失败
        set /a FAIL+=1
    )
)

echo.

REM ---- 步骤4：完成 ----
echo [4/4] 推送完成
echo.
echo ╔══════════════════════════════════════════╗
echo ║              推送结果                   ║
echo ╠══════════════════════════════════════════╣
echo   成功: %SUCCESS% 个
echo   失败: %FAIL% 个
echo ╚══════════════════════════════════════════╝
echo.
echo 下一步：
echo   1. 在电视上打开 Lemuroid
echo   2. 进入 设置 > 存储 > 重新扫描ROM
echo   3. 等待扫描完成后即可看到游戏
echo.
adb disconnect %TV_IP%:%ADB_PORT% >nul 2>nul
pause
