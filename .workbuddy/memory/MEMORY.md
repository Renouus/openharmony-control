# OpenHarmony Control 项目长期记忆

## 关键架构约束

### 自动化运行时初始化顺序（重要）
`server.ts` 必须在 `initDatabase()` **之后**调用 `buildApp()`。原因：buildApp 内部 try 块调用 `getDb()` 构造 AutomationRuntime，若数据库未初始化，会静默降级为 noop 运行时，导致所有自动化规则在真实服务器上从不触发（2026-07-12 修复，曾导致"自动化不工作"的表象）。

### 后端验证命令
- `npm.cmd run typecheck`（根目录，跨 workspace）
- `npm.cmd test`（根目录，等价于 control-center 的 vitest）
- ArkTS/.ets 改动需额外跑 hvigor UnitTestBuild

### 后端 dev 服务器
- 启动：`npm.cmd run dev:control-center`（= `tsx watch src/server.ts`）
- 端口 3443，DB 文件 `services/control-center/smarthome.db`
- tsx watch 改文件自动重载，但会断开 WebSocket；App 需重连/重启
- App 连 `http://10.0.2.2:3443`（模拟器地址，真机不通）

## 自动化子系统要点
- 触发链路：命令执行 → DeviceCommandService 分发 device_state_changed → AutomationRuntime.dispatch 遍历规则 → RuleEvaluator 评估 → ActionExecutor 执行
- scene_run 动作现在也分发状态变化事件（曾断链），并传递 chainDepth/automationId 防止 scene→automation→scene 无限递归
- cooldown_ms 列（schema v8）支持按规则冷却
- 时间事件携带 time 值，评估器比较时间值（曾只比较类型导致跨规则误触发）
- 执行日志表 automation_execution_logs 是诊断自动化是否触发的首要手段
