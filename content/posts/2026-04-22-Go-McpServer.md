---
title: "Go + MCP Server 架构与开发指南"
date: "2026-04-22"
category: "技术"
tags: ["Go", "MCP"]
excerpt: "GO + MCP Server 开发指南"
featured: true
---

> 本文档是一份**项目无关的通用指南**，面向：
>
> - 想从零搭建一个 MCP Server 的 Go 开发者
> - 想了解 Go 后端项目如何合理分层的开发者
> - 想把 HTTP API 与 MCP Server 一体化实现的开发者
>
> 读完本文，你应该能独立：
>
> 1. 规划一个可持续扩张的 Go 项目目录结构
> 2. 从零实现一个符合协议规范的 MCP Server
> 3. 设计一套优雅的工具自注册机制，让新增业务不动核心代码

---

## 目录

- [1. 背景与目标](#1-背景与目标)
- [2. MCP 协议基础](#2-mcp-协议基础)
- [3. Go 项目目录规划](#3-go-项目目录规划)
- [4. MCP Server 实现](#4-mcp-server-实现)
- [5. 工具模块自注册机制](#5-工具模块自注册机制)
- [6. 端到端示例：新增一个业务 + 一个工具](#6-端到端示例新增一个业务--一个工具)
- [7. 关键设计原则](#7-关键设计原则)
- [8. 常见问题 FAQ](#8-常见问题-faq)

---

## 1. 背景与目标

**MCP（Model Context Protocol）** 是一种开放协议，用于打通 LLM 客户端（Cursor、Claude Desktop 等）与外部工具/数据源之间的连接。开发者实现一个 MCP Server，即可让 AI 直接调用你的能力（查询数据库、调用 API、执行计算等）。

本文提倡的架构模式：

```
   ┌──────────────────────┐
   │  LLM 客户端 (MCP)    │◀──┐
   └──────────────────────┘   │ 同一套业务能力，
                              │ 双协议对外暴露
   ┌──────────────────────┐   │
   │  Web 前端 (HTTP)     │◀──┘
   └──────────────────────┘
            │
            ▼
   ┌──────────────────────┐
   │  适配层（协议转换）    │   HTTP Router / MCP Tool
   └──────────────────────┘
            │
            ▼
   ┌──────────────────────┐
   │  业务逻辑层（共用）   │   一次实现，两边复用
   └──────────────────────┘
            │
            ▼
   ┌──────────────────────┐
   │  下游服务 / 数据层    │
   └──────────────────────┘
```

**核心收益**：业务代码零重复、协议切换零成本、单元测试一次覆盖。

---

## 2. MCP 协议基础

### 2.1 协议本质

MCP 基于 **JSON-RPC 2.0**。所有消息都是以下三种结构之一：

```json
// Request
{ "jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": { ... } }

// Success Response
{ "jsonrpc": "2.0", "id": 1, "result": { ... } }

// Error Response
{ "jsonrpc": "2.0", "id": 1, "error": { "code": -32601, "message": "..." } }
```

### 2.2 服务端需要实现的 Method

| Method | 作用 | 必要性 |
|---|---|---|
| `initialize` | 客户端握手、版本协商、声明能力 | 必须 |
| `notifications/initialized` | 客户端通知握手完成 | 必须 |
| `tools/list` | 列出所有可用工具 | 必须（若提供工具） |
| `tools/call` | 实际调用某个工具 | 必须（若提供工具） |
| `ping` | 心跳 | 推荐 |
| `resources/list`、`resources/read` | 资源列表 / 读取资源 | 可选 |
| `prompts/list`、`prompts/get` | Prompt 模板列表 / 获取 | 可选 |
| `logging/setLevel` | 动态调整日志级别 | 可选 |
| `notifications/cancelled` | 客户端取消通知 | 可选（推荐提供空实现占位）|

### 2.3 标准 JSON-RPC 错误码

| Code | 含义 | 典型场景 |
|---|---|---|
| `-32700` | Parse error | body 不是合法 JSON |
| `-32600` | Invalid Request | 缺少 `jsonrpc` 字段或格式不对 |
| `-32601` | Method not found | 未知 method |
| `-32602` | Invalid params | 参数结构不符 |
| `-32603` | Internal error | 服务端内部异常 |

### 2.4 协议版本与协商

MCP 协议会按日期发布新版本（如 `2025-03-26`、`2025-06-18`、`2025-11-25`）。服务端应：

1. 维护一个**支持版本列表**
2. `initialize` 阶段检查客户端声明的 `protocolVersion`
3. 若客户端版本在支持列表里 → 回传客户端版本（保持兼容）
4. 否则 → 回传服务端最新默认版本，由客户端决定是否继续

这样一套服务端可以**同时**对接新老客户端，升级无破坏性。

### 2.5 工具定义结构

工具 = **JSON Schema 描述** + **实际处理函数**。

```json
{
  "name": "weather_query",
  "description": "根据城市名查询实时天气",
  "inputSchema": {
    "type": "object",
    "properties": {
      "city": { "type": "string", "description": "城市名称" }
    },
    "required": ["city"]
  }
}
```

`inputSchema` 让 LLM 知道参数约束，描述清晰度直接影响 AI 调用准确性。

---

## 3. Go 项目目录规划

### 3.1 推荐结构

```
your-project/
├── cmd/                              # 应用入口 + 路由装配（薄）
│   ├── main.go                       # main 函数，启动入口
│   └── http/
│       ├── service.go                # HTTP Server 初始化、全局中间件、路由注册
│       ├── <业务A>/                  # 业务 A 的 HTTP 接口层
│       │   └── router.go
│       ├── <业务B>/
│       │   └── router.go
│       └── mcp/                      # MCP Server
│           ├── protocol.go           # 协议常量、DTO
│           ├── handler.go            # JSON-RPC 分发与 method 处理
│           ├── router.go             # Gin 路由绑定
│           ├── tools.go              # 工具注册表（核心）
│           └── tools/                # 按业务拆分的工具定义
│               ├── register.go       # blank import 聚合器
│               ├── <业务A>/
│               │   └── <业务A>.go
│               └── <业务B>/
│                   └── <业务B>.go
│
├── internal/                         # 项目私有包（外部不可 import）
│   ├── logic/                        # 业务逻辑（HTTP 与 MCP 共用）
│   │   ├── <业务A>/
│   │   │   ├── service.go            # 对外导出的业务函数
│   │   │   ├── params.go             # 参数结构体
│   │   │   ├── response.go           # 响应结构体
│   │   │   ├── validator.go          # 校验逻辑
│   │   │   └── constants.go          # 业务常量
│   │   └── <业务B>/
│   ├── config/                       # 配置加载
│   ├── logger/                       # 日志封装
│   ├── errors/                       # 统一错误码与封装
│   ├── middleware/                   # 通用中间件
│   └── util/                         # 通用工具函数
│
├── module/                           # 对下游的 RPC/HTTP client 封装
│   └── rpc/
│
├── model/                            # 数据模型
│   └── dao/                          # DB 访问层
│
├── conf/                             # 配置文件
├── docs/                             # 项目文档
├── go.mod
└── go.sum
```

### 3.2 分层职责

| 层级 | 目录 | 职责 | 厚/薄 |
|---|---|---|---|
| **入口层** | `cmd/main.go` | 启动进程、注册 signal handler | 极薄 |
| **装配层** | `cmd/http/service.go` | HTTP Server、中间件、路由挂载 | 薄 |
| **协议适配层（HTTP）** | `cmd/http/<业务>/router.go` | 路由绑定、参数 bind、错误映射 | 薄 |
| **协议适配层（MCP）** | `cmd/http/mcp/tools/<业务>/*.go` | 工具注册、参数解包 | 薄 |
| **业务逻辑层** | `internal/logic/<业务>/` | **核心业务，HTTP/MCP 共用** | **厚** |
| **下游调用层** | `module/rpc/` | 调下游服务的 client 封装 | 中 |
| **基础设施层** | `internal/{logger,config,...}` | 可跨业务复用的通用能力 | 中 |
| **数据层** | `model/dao/` | DB 查询 | 中 |

**铁律**：协议适配层（`cmd/`）**禁止**出现业务逻辑，只做"翻译"——把协议请求翻译为业务函数调用，把业务结果翻译回协议响应。

### 3.3 `internal` 的特殊性

Go 官方约定：`internal/` 下的包**只能被其父目录（及子目录）内的代码 import**。利用这一点：

- 所有不希望对外输出的代码都放 `internal/`
- 业务逻辑、工具函数、错误码全部锁在 `internal/` 内
- 强制约束项目边界，防止被外部误依赖

### 3.4 代码归属判定

新增代码前问自己三个问题：

1. **会被多协议调用吗？（HTTP 和 MCP 都要？）**
   - 是 → `internal/logic/<业务>/`
   - 只有 HTTP → `cmd/http/<业务>/`
   - 只有 MCP → `cmd/http/mcp/tools/<业务>/`

2. **会跨业务复用吗？**
   - 是 → `internal/` 下合适的基础设施包
   - 否 → 留在业务目录内

3. **涉及外部系统吗？**
   - 下游服务 → `module/rpc/`
   - 数据库 → `model/dao/`

---

## 4. MCP Server 实现

### 4.1 协议常量与 DTO

`cmd/http/mcp/protocol.go`：

```go
package mcp

const (
    ProtocolVersion = "2025-11-25"
    ServerName      = "your-mcp-server"
    ServerVersion   = "1.0.0"

    MethodInitialize             = "initialize"
    MethodNotificationsInit      = "notifications/initialized"
    MethodToolsList              = "tools/list"
    MethodToolsCall              = "tools/call"
    MethodPing                   = "ping"
    MethodResourcesList          = "resources/list"
    MethodPromptsList            = "prompts/list"
    MethodLoggingSetLevel        = "logging/setLevel"
    MethodNotificationsCancelled = "notifications/cancelled"
)

// 支持的协议版本列表（从新到旧）
var SupportedProtocolVersions = []string{
    "2025-11-25",
    "2025-06-18",
    "2025-03-26",
}

func IsProtocolVersionSupported(v string) bool {
    for _, x := range SupportedProtocolVersions {
        if x == v {
            return true
        }
    }
    return false
}

// ========== DTO ==========

type InitializeParams struct {
    ProtocolVersion string     `json:"protocolVersion"`
    Capabilities    any        `json:"capabilities,omitempty"`
    ClientInfo      ClientInfo `json:"clientInfo"`
}

type ClientInfo struct {
    Name    string `json:"name"`
    Version string `json:"version,omitempty"`
}

type InitializeResult struct {
    ProtocolVersion string           `json:"protocolVersion"`
    Capabilities    ServerCapability `json:"capabilities"`
    ServerInfo      ServerInfo       `json:"serverInfo"`
}

type ServerCapability struct {
    Tools *ToolsCapability `json:"tools,omitempty"`
}

type ToolsCapability struct {
    ListChanged bool `json:"listChanged,omitempty"`
}

type ServerInfo struct {
    Name    string `json:"name"`
    Version string `json:"version"`
}

type ToolsListResult struct {
    Tools []ToolDefinition `json:"tools"`
}

type ToolDefinition struct {
    Name        string `json:"name"`
    Description string `json:"description,omitempty"`
    InputSchema any    `json:"inputSchema"`
}

type ToolsCallParams struct {
    Name      string         `json:"name"`
    Arguments map[string]any `json:"arguments,omitempty"`
}

type ToolCallResult struct {
    Content []ContentItem `json:"content"`
    IsError bool          `json:"isError,omitempty"`
}

type ContentItem struct {
    Type string `json:"type"`
    Text string `json:"text,omitempty"`
}
```

### 4.2 JSON-RPC 分发器

`cmd/http/mcp/handler.go`：

```go
package mcp

import (
    "context"
    "encoding/json"
    "fmt"
    "net/http"

    "github.com/gin-gonic/gin"
)

type jsonRPCRequest struct {
    JsonRPC string          `json:"jsonrpc"`
    ID      any             `json:"id,omitempty"`
    Method  string          `json:"method"`
    Params  json.RawMessage `json:"params,omitempty"`
}

type jsonRPCResponse struct {
    JsonRPC string `json:"jsonrpc"`
    ID      any    `json:"id"`
    Result  any    `json:"result,omitempty"`
}

type jsonRPCErrorResponse struct {
    JsonRPC string       `json:"jsonrpc"`
    ID      any          `json:"id,omitempty"`
    Error   jsonRPCError `json:"error"`
}

type jsonRPCError struct {
    Code    int    `json:"code"`
    Message string `json:"message"`
    Data    any    `json:"data,omitempty"`
}

func HandlePost(c *gin.Context) {
    body, err := readBody(c)
    if err != nil {
        writeError(c, nil, -32700, "Parse error: failed to read request body")
        return
    }

    var req jsonRPCRequest
    if err := json.Unmarshal(body, &req); err != nil {
        writeError(c, nil, -32700, "Parse error: invalid JSON")
        return
    }

    if req.JsonRPC != "2.0" {
        writeError(c, req.ID, -32600, `Invalid Request: jsonrpc must be "2.0"`)
        return
    }

    switch req.Method {
    case MethodInitialize:
        handleInitialize(c, &req)
    case MethodNotificationsInit:
        c.Status(http.StatusOK)
    case MethodPing:
        writeSuccess(c, req.ID, map[string]any{})
    case MethodToolsList:
        handleToolsList(c, &req)
    case MethodToolsCall:
        handleToolsCall(c, &req)
    case MethodResourcesList:
        writeSuccess(c, req.ID, map[string]any{"resources": []any{}})
    case MethodPromptsList:
        writeSuccess(c, req.ID, map[string]any{"prompts": []any{}})
    case MethodLoggingSetLevel:
        writeSuccess(c, req.ID, map[string]any{})
    case MethodNotificationsCancelled:
        c.Status(http.StatusOK)
    default:
        writeError(c, req.ID, -32601, fmt.Sprintf("Method not found: %s", req.Method))
    }
}

func handleInitialize(c *gin.Context, req *jsonRPCRequest) {
    var params InitializeParams
    if req.Params != nil {
        _ = json.Unmarshal(req.Params, &params)
    }

    negotiated := ProtocolVersion
    if params.ProtocolVersion != "" && IsProtocolVersionSupported(params.ProtocolVersion) {
        negotiated = params.ProtocolVersion
    }

    writeSuccess(c, req.ID, InitializeResult{
        ProtocolVersion: negotiated,
        Capabilities:    ServerCapability{Tools: &ToolsCapability{ListChanged: false}},
        ServerInfo:      ServerInfo{Name: ServerName, Version: ServerVersion},
    })
}

func handleToolsList(c *gin.Context, req *jsonRPCRequest) {
    writeSuccess(c, req.ID, ToolsListResult{Tools: GetAllToolDefinitions()})
}

func handleToolsCall(c *gin.Context, req *jsonRPCRequest) {
    var params ToolsCallParams
    if req.Params != nil {
        if err := json.Unmarshal(req.Params, &params); err != nil {
            writeError(c, req.ID, -32602, "Invalid params: "+err.Error())
            return
        }
    }

    tool := FindTool(params.Name)
    if tool == nil {
        writeToolError(c, req.ID, "Tool not found: "+params.Name)
        return
    }

    data, err := tool.Handler(c.Request.Context(), c, params.Arguments)
    if err != nil {
        writeToolError(c, req.ID, err.Error())
        return
    }

    text := ""
    switch v := data.(type) {
    case string:
        text = v
    default:
        bytes, err := json.Marshal(v)
        if err != nil {
            writeToolError(c, req.ID, "marshal error: "+err.Error())
            return
        }
        text = string(bytes)
    }

    writeSuccess(c, req.ID, ToolCallResult{
        Content: []ContentItem{{Type: "text", Text: text}},
    })
}

func writeSuccess(c *gin.Context, id any, result any) {
    c.PureJSON(http.StatusOK, jsonRPCResponse{JsonRPC: "2.0", ID: id, Result: result})
}

func writeError(c *gin.Context, id any, code int, msg string) {
    c.PureJSON(http.StatusOK, jsonRPCErrorResponse{
        JsonRPC: "2.0", ID: id,
        Error: jsonRPCError{Code: code, Message: msg},
    })
}

// 业务级错误走 success 通道 + isError: true
func writeToolError(c *gin.Context, id any, msg string) {
    writeSuccess(c, id, ToolCallResult{
        Content: []ContentItem{{Type: "text", Text: msg}},
        IsError: true,
    })
}
```

### 4.3 路由绑定

`cmd/http/mcp/router.go`：

```go
package mcp

import "github.com/gin-gonic/gin"

func RegisterRouter(group *gin.RouterGroup) {
    group.POST("/mcp", HandlePost)
    group.GET("/mcp", HandleGet)       // SSE 支持（可选）
    group.DELETE("/mcp", HandleDelete) // 连接关闭（可选）
}
```

---

## 5. 工具模块自注册机制

这是整个架构的精髓：**新增工具不动核心代码**。

### 5.1 四要素链路图

```
┌─────────────────────────────────────┐
│ ① 中心注册表                        │  mcp.RegisterTool / FindTool
│    cmd/http/mcp/tools.go            │
└─────────────┬───────────────────────┘
              ▲ 被业务子包的 init() 调用
┌─────────────┴───────────────────────┐
│ ② 业务子包                          │  tools/<业务>/<业务>.go
│    func init() { RegisterTool(...)} │    → 自注册工具定义 + handler
└─────────────┬───────────────────────┘
              ▲ 被聚合器 blank import
┌─────────────┴───────────────────────┐
│ ③ 聚合器                            │  tools/register.go
│    import _ "tools/<业务>"          │
└─────────────┬───────────────────────┘
              ▲ 被入口 blank import
┌─────────────┴───────────────────────┐
│ ④ 入口                              │  cmd/http/service.go
│    import _ "cmd/http/mcp/tools"    │
└─────────────────────────────────────┘
```

### 5.2 要素①：中心注册表

`cmd/http/mcp/tools.go`：

```go
package mcp

import (
    "context"
    "github.com/gin-gonic/gin"
)

type ToolHandler func(ctx context.Context, c *gin.Context, args map[string]any) (any, error)

type RegisteredTool struct {
    Definition ToolDefinition
    Handler    ToolHandler
}

var toolRegistry []RegisteredTool

// RegisterTool 注册一个 MCP 工具。
// 约定：只在业务子包的 init() 中调用，程序启动后不再变更。
func RegisterTool(def ToolDefinition, handler ToolHandler) {
    toolRegistry = append(toolRegistry, RegisteredTool{
        Definition: def,
        Handler:    handler,
    })
}

func GetAllToolDefinitions() []ToolDefinition {
    defs := make([]ToolDefinition, 0, len(toolRegistry))
    for _, t := range toolRegistry {
        defs = append(defs, t.Definition)
    }
    return defs
}

func FindTool(name string) *RegisteredTool {
    for i := range toolRegistry {
        if toolRegistry[i].Definition.Name == name {
            return &toolRegistry[i]
        }
    }
    return nil
}
```

> **为什么不用 `map` + 加锁？** 注册只在进程启动期（所有 `init()` 跑完之前）发生，运行期只读，slice 足够快且可预测。

### 5.3 要素②：业务子包 `init()`

`cmd/http/mcp/tools/weather/weather.go`：

```go
package weather

import (
    "context"
    "encoding/json"
    "fmt"

    "github.com/gin-gonic/gin"

    "your-project/cmd/http/mcp"
    logic "your-project/internal/logic/weather"
)

func init() {
    mcp.RegisterTool(mcp.ToolDefinition{
        Name:        "weather_query",
        Description: "根据城市名查询实时天气",
        InputSchema: map[string]any{
            "type": "object",
            "properties": map[string]any{
                "city": map[string]any{
                    "type":        "string",
                    "description": "城市名称，必填",
                },
            },
            "required": []string{"city"},
        },
    }, handleWeatherQuery)
}

func handleWeatherQuery(ctx context.Context, c *gin.Context, args map[string]any) (any, error) {
    city, _ := args["city"].(string)
    if city == "" {
        return nil, fmt.Errorf("city 为必填参数")
    }

    data, err := logic.Query(ctx, c, logic.QueryParams{City: city})
    if err != nil {
        return nil, err
    }
    b, err := json.Marshal(data)
    if err != nil {
        return nil, fmt.Errorf("结果序列化失败: %w", err)
    }
    return string(b), nil
}
```

### 5.4 要素③：聚合器

`cmd/http/mcp/tools/register.go`：

```go
package tools

// 各业务工具子包通过 blank import 触发 init() 自注册。
// 新增业务时，只需在此添加对应的 import 即可。
import (
    _ "your-project/cmd/http/mcp/tools/weather"
    // _ "your-project/cmd/http/mcp/tools/<新业务>"   ← 扩展点
)
```

### 5.5 要素④：入口触发

`cmd/http/service.go`：

```go
package http

import (
    "github.com/gin-gonic/gin"

    mcpserver "your-project/cmd/http/mcp"
    _ "your-project/cmd/http/mcp/tools"   // ★ 关键：触发所有 init()
)

func (s *Service) Start() {
    r := gin.New()
    // 全局中间件、日志等...

    root := r.Group("/")
    mcpserver.RegisterRouter(root)
    // 其他业务路由 root.Register(...)

    _ = r.Run(":8080")
}
```

### 5.6 执行时序

```
进程启动
  │
  ├─ Go runtime 初始化所有被 import 的包（深度优先）
  │   │
  │   ├─ cmd/http/mcp/tools/weather 包的 init() 执行
  │   │     └─ 调用 mcp.RegisterTool(...) 往 toolRegistry 追加
  │   │
  │   ├─ cmd/http/mcp/tools/<其他业务>.init() 执行
  │   │     └─ 同上
  │   │
  │   └─ cmd/http/mcp/tools 包本身（register.go）初始化完成
  │
  ├─ main() 开始执行
  │
  └─ HTTP Server 启动，接收第一个请求
       └─ tools/list 返回的就是 toolRegistry 中全部工具
```

### 5.7 为什么这么做

| 特性 | 收益 |
|---|---|
| **解耦** | 核心 `mcp` 包不认识任何业务，业务可独立演进 |
| **插件化** | 新增业务 = 新建目录 + 加一行 import，不改核心代码 |
| **编译期校验** | 未 import 的子包不会被打进二进制，避免"偷偷依赖" |
| **零反射** | 不依赖运行时反射或配置文件，启动即确定，可预测 |
| **IDE 友好** | 所有注册关系都是静态可追溯的，`Go to Definition` 即可 |

---

## 6. 端到端示例：新增一个业务 + 一个工具

目标：新增"天气查询"业务，同时对外开放 HTTP 接口和 MCP 工具。

### Step 1. 业务逻辑（HTTP/MCP 共用）

`internal/logic/weather/service.go`：

```go
package weather

import (
    "context"
    "github.com/gin-gonic/gin"
)

type QueryParams struct {
    City string `json:"city" validate:"required"`
}

type QueryResult struct {
    City        string  `json:"city"`
    Temperature float64 `json:"temperature"`
    Description string  `json:"description"`
}

func Query(ctx context.Context, c *gin.Context, p QueryParams) (*QueryResult, error) {
    // 校验 / 调下游 / 计算
    return &QueryResult{
        City:        p.City,
        Temperature: 23.5,
        Description: "Sunny",
    }, nil
}
```

### Step 2. HTTP 接口（可选，纯 MCP 项目可跳过）

`cmd/http/weather/router.go`：

```go
package weather

import (
    "context"
    "github.com/gin-gonic/gin"
    logic "your-project/internal/logic/weather"
)

func RegisterRouter(r *gin.RouterGroup) {
    r.POST("/weather/query", Query)
}

func Query(c *gin.Context) {
    var req logic.QueryParams
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    data, err := logic.Query(c.Request.Context(), c, req)
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }
    c.JSON(200, data)
}
```

在 `cmd/http/service.go` 的路由列表中挂载 `weather.RegisterRouter`。

### Step 3. MCP 工具

`cmd/http/mcp/tools/weather/weather.go`：

```go
package weather

import (
    "context"
    "encoding/json"
    "fmt"

    "github.com/gin-gonic/gin"

    "your-project/cmd/http/mcp"
    logic "your-project/internal/logic/weather"
)

func init() {
    mcp.RegisterTool(mcp.ToolDefinition{
        Name:        "weather_query",
        Description: "根据城市名查询实时天气",
        InputSchema: map[string]any{
            "type": "object",
            "properties": map[string]any{
                "city": map[string]any{"type": "string", "description": "城市名，必填"},
            },
            "required": []string{"city"},
        },
    }, handleWeatherQuery)
}

func handleWeatherQuery(ctx context.Context, c *gin.Context, args map[string]any) (any, error) {
    city, _ := args["city"].(string)
    if city == "" {
        return nil, fmt.Errorf("city 为必填参数")
    }
    data, err := logic.Query(ctx, c, logic.QueryParams{City: city})
    if err != nil {
        return nil, err
    }
    b, err := json.Marshal(data)
    if err != nil {
        return nil, fmt.Errorf("序列化失败: %w", err)
    }
    return string(b), nil
}
```

### Step 4. 接入聚合器

`cmd/http/mcp/tools/register.go`：

```go
import (
    _ "your-project/cmd/http/mcp/tools/weather"   // ← 新增这一行
)
```

### Step 5. 编译验证

```bash
go build ./...
```

启动后同时生效：

- HTTP：`POST /weather/query`
- MCP：`tools/list` 自动包含 `weather_query`，`tools/call {"name":"weather_query","arguments":{"city":"北京"}}` 直接可用

**总增量**：3 个新文件 + 1 行 import 变更，核心代码零改动。

---

## 7. 关键设计原则

### 7.1 Handler 薄、Logic 厚

协议适配层（HTTP Router / MCP Tool Handler）**只做**：
1. 参数解包（bind / map 取值）
2. 参数合法性前置检查（为空、类型转换）
3. 调用 `internal/logic/<业务>/` 的业务函数
4. 错误转换 + 序列化

业务逻辑、校验规则、下游调用、错误定义**一律**放 `internal/logic/<业务>/`。

### 7.2 HTTP 与 MCP 参数结构对齐

同一个业务的 HTTP 和 MCP 入参，应该映射到**同一个** `params` 结构体：

```go
// internal/logic/weather/params.go
type QueryParams struct {
    City string `json:"city" validate:"required"`
}
```

HTTP 通过 `ShouldBindJSON`、MCP 通过 `map → JSON → struct` 都能复用这一个结构体，保证字段定义唯一。

### 7.3 Raw Body 透传场景

对于"校验后透传下游"的场景（如提交大对象），优先保留 raw body 透传，避免反序列化-再序列化导致字段丢失或顺序变化：

```go
body, _ := io.ReadAll(c.Request.Body)
var req XxxParams
_ = json.Unmarshal(body, &req)              // 解析用于校验
return logic.Submit(ctx, c, &req, body)     // raw body 一起传下去
```

### 7.4 MCP 错误分层

| 类型 | 使用场景 | 返回方式 |
|---|---|---|
| **协议级错误** | parse 失败、method 不存在、参数结构不符 | `writeError` → JSON-RPC `error` 字段 |
| **业务级错误** | 工具内部异常（下游报错、校验失败） | `writeToolError` → JSON-RPC `result` + `isError: true` |

两者语义不同，**切勿混用**：协议错误让客户端知道"没法调用"，业务错误让 LLM 知道"调用了但失败了"，LLM 可据此向用户解释或重试。

### 7.5 `json.Marshal` 错误必须处理

禁止 `_, _ = json.Marshal(x)`。所有 marshal 都要检查 err 并映射到合适的错误码。虽然大多数 marshal 不会失败，但遇到自定义 `MarshalJSON` 或循环引用会异常，裸忽略会让问题难以定位。

### 7.6 Go 命名：首字母缩略词全大写

```go
// ✅
type jsonRPCRequest struct { ... }
const HTTPTimeout = 3
var URLPattern = ...

// ❌
type jsonrpcRequest struct { ... }
const HttpTimeout = 3
var UrlPattern = ...
```

### 7.7 `init()` 的克制使用

`init()` 强大但**仅用于自注册**。避免在 `init()` 中：

- 连接数据库 / 读取远程配置（启动失败难排查）
- 启动 goroutine（生命周期难管理）
- 执行可能 panic 的业务逻辑

`init()` 应该只做一件事：**把一个东西登记到一个表里**。

### 7.8 错误码统一

推荐做法：项目级统一的错误码包 `internal/errors/`，所有业务错误通过 `errors.WrapCode(codeX, rawErr)` 封装。协议适配层直接把带 code 的错误翻译成 HTTP status / MCP error。

---

## 8. 常见问题 FAQ

### Q1：`init()` 没有被调用？

检查链路：
1. 入口（`service.go`）是否 blank import 了 `.../tools`？
2. 聚合器（`tools/register.go`）是否 blank import 了你的业务子包？
3. 业务子包是否真的有 `func init()`？

任意一环缺失，Go 编译器会把未引用的包剔除。可以临时在 `init()` 里加 `fmt.Println("xxx init")` 验证。

### Q2：同名工具注册了两次会怎样？

默认实现是 `append` 不去重，`FindTool` 返回第一个匹配。**建议**：在 `RegisterTool` 里加 panic 防御：

```go
func RegisterTool(def ToolDefinition, handler ToolHandler) {
    if FindTool(def.Name) != nil {
        panic("duplicate tool name: " + def.Name)
    }
    toolRegistry = append(toolRegistry, RegisteredTool{def, handler})
}
```

启动期 panic 远好于运行期偶发错误。

### Q3：MCP 返回能否直接返回结构化对象？

MCP 2025-06-18 起支持 `structuredContent` 字段直接返回结构化对象，但多数客户端仍只认 `content[0].type=text + JSON 字符串`。**建议默认用 text**，对性能敏感或需要 Schema 约束的场景再升级：

```go
type ToolCallResult struct {
    Content           []ContentItem `json:"content"`
    StructuredContent any           `json:"structuredContent,omitempty"` // 新版增量字段
    IsError           bool          `json:"isError,omitempty"`
}
```

### Q4：如何新增一个非 tools 类的 MCP method？

步骤：
1. 在 `protocol.go` 的常量中加 method 名
2. 在 `handler.go` 的 `switch` 中加 case
3. 实现对应 handler

参考现有的 `MethodLoggingSetLevel` 空实现做最小改动。

### Q5：HTTP 和 MCP 的鉴权怎么做？

共用中间件即可：

- HTTP：Gin 中间件 `.Use(AuthMiddleware)`
- MCP：同一个 `/mcp` 路由经过同一套 Gin 中间件链，自动生效

如果 MCP 需要特殊鉴权（如 `Authorization: Bearer <token>`），可以在全局中间件中按 path 分支处理。

### Q6：工具太多导致 `tools/list` 响应过大？

MCP 目前没有分页标准。可选方案：
- 按客户端 ClientInfo 做粗过滤（不同客户端看到不同子集）
- 拆成多个 MCP Server 实例
- 等后续协议支持 `list` 分页

### Q7：能否把工具定义从 Go 代码抽到 JSON/YAML？

**可以但不推荐**。工具定义（schema + handler）强绑定，抽离后反而增加维护成本：改字段要同时改 JSON 和 Go 代码。用 Go 代码表达 schema，借助 IDE 补全和编译检查，开发效率更高。

---

## 附：关键文件速查

| 文件 | 作用 | 变更频率 |
|---|---|---|
| `cmd/main.go` | 进程入口 | 极低 |
| `cmd/http/service.go` | HTTP Server 装配 | 新增业务时 +1 行 |
| `cmd/http/mcp/protocol.go` | 协议常量、DTO | 协议升级时 |
| `cmd/http/mcp/handler.go` | JSON-RPC 分发 | 新增 method 时 |
| `cmd/http/mcp/tools.go` | 工具注册表 | 极低 |
| `cmd/http/mcp/tools/register.go` | 业务子包聚合器 | 新增业务时 +1 行 |
| `cmd/http/mcp/tools/<业务>/*.go` | 业务工具定义 | 高频 |
| `cmd/http/<业务>/router.go` | 业务 HTTP 路由 | 高频 |
| `internal/logic/<业务>/` | 业务核心逻辑 | 最高频 |

---

## 参考资料

- [MCP 官方规范](https://modelcontextprotocol.io/specification)
- [JSON-RPC 2.0 规范](https://www.jsonrpc.org/specification)
- [Go Project Layout](https://github.com/golang-standards/project-layout)
- [Go `init` 函数官方文档](https://go.dev/ref/spec#Package_initialization)

---

**最后的话**：架构的价值不在于"一开始就完美"，而在于"能平滑演进"。本指南提倡的"业务自注册 + 分层清晰 + 协议适配薄"模式，核心目的是让你在业务膨胀时，永远只需要在固定的地方加几行代码，而不需要重构核心链路。
