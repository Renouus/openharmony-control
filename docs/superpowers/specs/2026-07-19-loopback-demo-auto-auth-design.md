# 回环 Demo 自动认证设计

## 目标

无账户演示环境中，OpenHarmony App 不要求用户输入 API Token；生产模式仍保持 Bearer 认证。

## 配置与边界

- 新增 `CONTROL_CENTER_DEMO_AUTO_AUTH`，默认 `false`，只接受 `true` 或 `false`。
- 只有 `CONTROL_CENTER_MODE=demo` 且最终监听地址全部为回环地址时允许设为 `true`。
- 启用后，普通 `/api/*` 请求自动获得 `app/api` 主体；WebSocket ticket 仍通过普通 API 端点签发。
- `/api/demo/*` 继续要求独立 demo token，不继承自动认证权限。
- 生产模式或非回环监听启用该开关时拒绝启动。
- `CONTROL_CENTER_API_TOKEN` 仍为必填，确保关闭自动认证后立即恢复原认证边界。

## 验证

- 配置测试覆盖默认关闭、显式启用、非法布尔值、生产模式和非回环拒绝。
- API 集成测试覆盖 demo 自动认证可匿名读取设备、默认模式仍返回 401、demo 专用路由仍受保护。
- 本地 `.env` 启用开关后，匿名 `/api/devices` 必须返回设备；全量后端测试和类型检查必须通过。
