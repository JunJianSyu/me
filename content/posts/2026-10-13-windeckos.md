---

## WinDeckOS 25H2 完整安装指南

### 一、准备工作

**需要的设备：**
- 一台能上网的电脑（用于下载文件、制作启动盘）
- 一个 U 盘（建议 16GB 以上）
- Steam Deck（LCD 或 OLED 均可）
- USB-C 转接头（如果你的 U 盘不是 Type-C 接口）

**需要下载的文件：**

1. **系统镜像** — 在 GitHub Release 页面 v1.1.0 的 release 说明里，有 Google Drive 链接，点击下载系统镜像文件（可能是 `.img` 或 `.iso` 格式）
2. **Assets 里的全部 10 个文件** — 全部下载备用，装完系统后要用

GitHub 地址：`github.com/g7755726/WinDeckOS-OLED-and-LCD/releases`

### 二、制作 USB 启动盘

1. 在电脑上运行 Assets 里的 **rufus-4.11.exe**
2. 选择你的 U 盘设备
3. 选择下载好的 WinDeckOS 镜像文件（点击"选择"按钮）
4. 分区类型选 **GPT**，目标系统类型选 **UEFI (非 CSM)**
5. 点击"开始"，等待写入完成
6. 写完后把 Assets 里的其余 9 个文件全部拷贝到 U 盘根目录（建一个文件夹叫 `PostInstall` 方便管理）

### 三、更新 Steam Deck BIOS（重要！）

README 明确说：必须使用 Steam 推荐的最新 BIOS，否则蓝牙和内置扬声器无法工作。

1. 在 Steam Deck 上进入 SteamOS（如果还是双系统的话）
2. 设置 → 系统 → 系统更新，检查并安装最新 BIOS 更新
3. 如果已经是纯 Windows 没有 SteamOS 了，可以在 Valve 官网下载 BIOS 更新工具通过 U 盘执行

### 四、在 Steam Deck 上安装系统

1. 将 U 盘插入 Steam Deck
2. 按住 **音量减（Volume Down）** 不放，短按电源键开机
3. 出现启动菜单后，选择从 U 盘启动
4. 进入 WinDeckOS 安装环境后，按提示将镜像恢复/写入到内置硬盘
   - 如果镜像用 Rufus 写成可启动 U 盘，可能直接进入 Windows 安装界面
   - 如果是 Macrium Reflect 格式的镜像（`.mrimg`），需要用 Macrium Reflect 启动盘来恢复
5. 等待写入完成，重启 Steam Deck

> **注意：安装会擦除硬盘上所有数据！** 如果有重要文件务必提前备份。

### 五、首次进入系统后的配置

系统装好后，以下步骤按顺序执行，把 U 盘里 `PostInstall` 文件夹的文件依次安装：

**第 1 步：安装运行库（地基）**
1. 解压并安装 **Visual-C-Runtimes-All-in-One-Jul-2025.zip** — 安装里面全部 VC++ 运行库
2. 安装 **windowsdesktop-runtime-6.0.36-win-x64.exe** — .NET 6 运行时
3. 安装 **windowsdesktop-runtime-7.0.20-win-x64.exe** — .NET 7 运行时
4. 安装 **dxwebsetup.exe** — DirectX 运行库补全

**第 2 步：安装手柄驱动（让摇杆和按键正常工作）**
5. 安装 **ViGEmBus_1.22.0_x64_x86_arm64.exe** — 虚拟手柄总线驱动

**第 3 步：安装 Steam 和插件**
6. 安装 **SteamSetup.exe** — Steam 客户端
7. 解压并安装 **Decky.Loader.Installer.zip** — Decky 插件加载器

**第 4 步：按需安装**
8. **MicrosoftEdgeSetup.exe** — 浏览器（系统默认无浏览器，建议装）
9. **RTSSSetup736.exe** — 游戏内 FPS 显示（可选）

**第 5 步：激活系统**
10. 系统未预激活，需要自行购买 Windows 11 Home 密钥并在设置中激活

### 六、安装后验证

装完后检查以下几点确认一切正常：

- **睡眠测试**：短按电源键，确认屏幕关闭、风扇停转，再按一下能正常唤醒
- **手柄测试**：摇杆、ABXY 按键、触控板在 Steam 中是否正常响应
- **音频测试**：内置扬声器是否有声音（如果没声音，说明 BIOS 不是最新版）
- **WiFi/蓝牙**：能否正常连接 WiFi 和蓝牙设备
- **屏幕显示**：分辨率和刷新率是否正确（OLED 版应支持 90Hz）

---

整个流程大概需要 30-60 分钟，大部分时间花在下载镜像和写入 U 盘上。最关键的注意事项就是**一定要先更新 BIOS**，否则音频和蓝牙会出问题。

Assets 具体内容, 装完系统后需要手动安装的配套工具和运行库。系统镜像在 release 说明里的 Google Drive 链接下载。

Assets 里的 10 个文件分类如下：

**必装（系统运行基础）：**
- **Visual-C-Runtimes-All-in-One-Jul-2025.zip** — VC++ 运行库合集，大量游戏和软件依赖
- **windowsdesktop-runtime-6.0.36 / 7.0.20** — .NET 6 和 .NET 7 桌面运行时，部分工具依赖
- **dxwebsetup.exe** — DirectX Web 安装器，补全 DirectX 运行库

**必装（Steam Deck 功能相关）：**
- **ViGEmBus_1.22.0** — 虚拟手柄总线驱动，Steam Deck Tools 控制器映射依赖
- **SteamSetup.exe** — Steam 客户端安装包（系统本身不带）
- **Decky.Loader.Installer.zip** — Decky 插件加载器，用于 Steam Deck 插件系统

**推荐安装：**
- **MicrosoftEdgeSetup.exe** — Edge 浏览器（系统默认无浏览器，你需要的话装这个）
- **RTSSSetup736.exe** — RivaTuner 统计服务器，游戏内显示 FPS/帧率

**安装工具：**
- **rufus-4.11.exe** — 用于制作 USB 启动盘，在另一台电脑上用

**完整安装流程就是：**
1. 用另一台电脑下载 Google Drive 里的系统镜像
2. 用 Rufus 制作 Macrium Reflect 启动盘（或者用 Rufus 直接处理镜像）
3. 在 Steam Deck 上恢复镜像到硬盘
4. 进入系统后，把 Assets 里的文件依次安装

不过这里有个问题——release notes 说安装方式是 Macrium Reflect 磁盘镜像恢复，但 Assets 里提供的是 Rufus 而不是 Macrium Reflect。可能 25H2 版本改成了用 Rufus 直接写入，你下载镜像后看下文件格式：如果是 `.img` 或 `.iso` 就直接用 Rufus 写 U 盘，如果是 `.mrimg` 就需要 Macrium Reflect。
