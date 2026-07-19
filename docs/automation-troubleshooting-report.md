# 自动化规则功能系统性排查报告

> 排查对象：OpenHarmony Control 智能家居控制中心自动化规则子系统
> 排查日期：2026-07-12
> 排查方法：源码静态分析 + 数据流链路追踪 + 已确认缺陷定位

---

## 0. 总览：自动化规则执行链路

自动化规则从「配置」到「生效」需要经过 4 个阶段，任何一个阶段断裂都会导致"规则无法执行"。先用下图建立全局认知：

```
[SQLite automations 表]
        │  loadEnabledAutomations()           ← 阶段 0：规则加载
        ▼
[内存 loadedRules Map + TimeTriggerAdapter]    ← 阶段 1：触发器注册
        │  时间到 / 设备状态变化 / 传感器事件
        ▼
[AutomationEvent 事件]                          ← 阶段 2：事件触发
        │  dispatch(event) 遍历所有规则
        ▼
[RuleEvaluator.shouldExecute]                   ← 阶段 3：条件评估
        │  ok?
        ▼
[ActionExecutor.execute]                        ← 阶段 4：动作执行
        │  scene_run / device_command
        ▼
[ExecutionLog 记录 + WebSocket 通知]
```

**核心结论：本次源码核查共确认 4 个会导致"规则无法正常执行"的真实缺陷，另发现 3 个设计隐患。** 其中最致命的是 **故障 A（静默降级）** 和 **故障 B+C（时间规则跨规则误触发 + 冷却失效）**。下面按用户要求的两个阶段展开。

---

## 第一部分：规则触发阶段排查

触发阶段要回答的核心问题是：**规则有没有被正确加载，事件有没有被正确产生并送达评估器？**

### 1.1 检查规则是否被加载到运行时内存

**排查思路**：规则即使在前端显示"已启用"，也不代表后端运行时已加载。加载链路是：

```
SQLite(automations) → AutomationRepository.listEnabledRules() → AutomationRuntime.loadedRules
```

**关键代码位置**：
- `services/control-center/src/automation/automation-repository.ts` 行 17-26：`listEnabledRules()` 的 SQL 过滤条件是 `WHERE enabled = 1 AND is_deleted = 0`。
- `services/control-center/src/automation/automation-runtime.ts` 行 24-31：`loadEnabledAutomations()` 把规则写入 `loadedRules` Map 并注册定时器。

**诊断步骤**：
1. **查数据库实际状态**——直接查询 SQLite，确认规则确实满足加载条件：
   ```sql
   SELECT id, name, enabled, is_deleted, trigger_type FROM automations;
   ```
   重点看 `enabled=1` 且 `is_deleted=0`。前端"启用"按钮写入的也是这两列，但若存在前后端字段不同步（例如前端只改了本地缓存没同步到远程），数据库里可能仍是 `enabled=0`。

2. **确认运行时是否真的加载了规则**——后端目前没有暴露"列出已加载规则"的诊断接口（这是一个可观测性缺口，见修复建议）。临时验证方法：在 `automation-runtime.ts` 的 `loadEnabledAutomations()` 末尾加日志：
   ```ts
   console.log(`[automation] loaded ${this.loadedRules.size} rules:`, [...this.loadedRules.keys()]);
   ```
   重启服务后查看是否打印出预期规则 ID。若打印 0 条或缺少目标规则，问题在加载阶段。

### 1.2 检查条件配置是否正确

**排查思路**：规则的条件配置要经过「前端编辑器 → API 规范化 → 运行时模型」三道转换，任一环节数据格式不对都会让条件无法匹配。

**关键代码位置**：
- `services/control-center/src/automation/automation-normalization.ts`：
  - `toRuntimeTrigger()` 行 124——把 `trigger_type` + `trigger_json` 转成运行时触发器
  - `toRuntimeConditionGroup()` 行 163——把条件 JSON 转成 `AutomationConditionGroup`
  - `isValidAutomationConditionGroup()` 行 143——校验条件组，**注意它禁止 time 与 device 混合**
- `services/control-center/src/automation/types.ts` 行 16-29：`AutomationCondition` 字段含 `type/deviceId/time/at/property/operator/threshold`

**诊断步骤**：
1. **导出规则的原始 JSON**——查数据库看 `trigger_json` 和 `action_json` 的实际内容：
   ```sql
   SELECT id, trigger_type, trigger_json, action_json FROM automations WHERE id = '<规则ID>';
   ```
2. **核对字段名**——常见配置错误：
   - 时间条件：字段应是 `time` 或 `at`（两者都支持），值格式必须是 `HH:MM`（如 `"22:00"`），不能带秒。
   - 设备状态条件：必须有 `deviceId`、`property`、`operator`、`threshold` 四个字段。`property` 用 `power`/`brightness`/`targetTemperature` 等。
   - 条件组 `logic`：`"all"`（全部满足）或 `"any"`（任一满足）。
3. **检查是否触发了规范化静默丢弃**——`toRuntimeConditionGroup` 在条件组非法时会回退为单条件，且不报错。若你的规则本应有多个条件却只生效一个，大概率是这里被静默降级了。

### 1.3 检查触发条件是否被满足

这是"规则从未被触发"最常见的环节。按触发类型分别排查：

#### 1.3.1 时间触发（time）

**关键代码**：`services/control-center/src/automation/triggers/time-trigger-adapter.ts`
- 行 15-17：每条 time 规则注册一个 `setInterval`，**每 60 秒**检查一次当前分钟是否等于配置时间。
- 行 33-58：`maybeDispatch()` 比对 `currentMinute`（`HH:MM`）与 `rule.trigger.config.time`。

**诊断步骤**：
1. **确认服务器时区**——`maybeDispatch` 用 `new Date().getHours()`，依赖服务器本地时区。若服务器是 UTC 而规则按北京时间配置，22:00 的规则在 UTC 服务器上要到次日 06:00 才触发。这是定时规则"不触发"的高频原因。
   ```bash
   date    # 看服务器时间和时区
   ```
2. **确认定时器是否注册**——`TimeTriggerAdapter.register()` 只在 `rule.trigger.type === "time"` 时才注册（行 10-12）。若规则的 `trigger_type` 在库里存的是别的值（比如前端误存为 `schedule`），定时器根本不会注册。
3. **确认进程没被重启**——所有定时器都是进程内 `setInterval`，**服务重启后必须重新 `loadEnabledAutomations()`**。若服务频繁崩溃重启，且重启时间窗正好跨过目标时间点，规则会漏触发。

#### 1.3.2 设备状态触发（device_state_changed）

**关键代码**：
- `services/control-center/src/automation/triggers/device-state-trigger-adapter.ts` 行 14：`dispatchStateChange()` 构造事件。
- `services/control-center/src/services/device-command-service.ts` 行 277-289：**只有用户命令执行成功后**才会调用 `dispatchStateChange`。

**诊断步骤**：
1. **手动改设备状态触发规则**——通过 API 执行一条设备命令，观察规则是否联动：
   ```
   POST /api/commands  （执行一个设备控制命令）
   ```
   然后查 `automation_execution_logs` 表看是否有记录。
2. **确认设备命令走的是 `DeviceCommandService`**——见下方 **故障 B**，**场景执行（scene_run）改设备状态时不会发状态变化事件**，这是设备状态触发的规则"时灵时不灵"的根因。

#### 1.3.3 传感器触发（sensor_event）

**关键代码**：`services/control-center/src/automation/triggers/sensor-event-trigger-adapter.ts`
- 行 6：`dispatchMotion()` 是唯一入口。
- 行 10：`source` 硬编码为 `"demo"`。
- 仅被 `routes/demo.ts` 调用。

**结论**：传感器触发目前是**纯演示功能**，没有真实传感器数据接入。如果你的规则依赖传感器事件，它在生产环境下永远不会触发——这不是 bug，是功能未实现。

### 1.4 检查事件监听机制是否正常

**关键代码**：`services/control-center/src/app.ts` 行 115-146 的装配逻辑。

**诊断步骤**：
1. **确认运行时不是 noop 降级**——这是**最致命的隐患（故障 A）**。`app.ts` 行 132-146：
   ```ts
   try {
     const db = getDb();
     // ... 实例化真实运行时 ...
     void automationRuntime.loadEnabledAutomations();
   } catch {
     automationRuntime = createNoopAutomationRuntime();   // ← 静默降级！
   }
   ```
   如果 `getDb()` 抛错（数据库文件锁、路径错误、schema 迁移失败），或任何一个构造函数抛错，**整个自动化子系统会被替换成空实现，且没有任何日志输出**。此时所有规则都不会触发，但服务照常运行，API 照常响应，前端看起来一切正常。

   **如何确认**：临时在 catch 块加日志：
   ```ts
   } catch (e) {
     console.error('[automation] FATAL: runtime init failed, falling back to noop:', e);
     automationRuntime = createNoopAutomationRuntime();
   }
   ```
   重启服务，若看到这条错误，说明自动化根本没启动。

---

## 第二部分：触发后执行阶段排查

如果确认规则已被成功触发（事件已产生并送达 `dispatch`），但动作没有执行或执行错误，排查执行阶段。

### 2.1 动作执行逻辑

**关键代码**：`services/control-center/src/automation/action-executor.ts`
- 行 15-22：`execute()` **一开始就广播"已被触发"通知**，然后才开始执行动作。
- 行 24-64：遍历 `rule.actions`，按 `type` 分发：
  - `scene_run`（行 28-29）→ `sceneService.runScene()`
  - `device_command`（行 30-47）→ `deviceCommandService.executeAutomationCommand()`
  - 其他 → 抛 `UNSUPPORTED_ACTION`
- 行 51-63：**任一动作失败立即 return，中断后续动作**。

**诊断步骤**：
1. **查执行日志表**——`automation_execution_logs` 记录了每次执行的结果：
   ```sql
   SELECT automation_id, status, reason, action_index, action_type, created_at
   FROM automation_execution_logs
   ORDER BY created_at DESC LIMIT 20;
   ```
   - `status='success'` → 执行成功
   - `status='failed'` → 动作执行报错，看 `reason` 和 `action_index` 定位是第几个动作、什么错误
   - `status='skipped'` → 规则被评估为不执行（条件不满足等）
   - `status='invalid'` → 运行时未配置 actionExecutor（即降级为 noop）

2. **常见失败 reason 对照**：
   | reason | 含义 | 排查方向 |
   |--------|------|----------|
   | `DEVICE_NOT_FOUND` | 动作引用的设备不存在 | 检查 action 的 deviceId 是否在 device registry 中 |
   | `DEVICE_OFFLINE` | 设备离线 | 检查设备 online 状态 |
   | `COMMAND_INVALID` | 设备不支持该命令 | 检查命令名与设备类型是否匹配（见 2.4） |
   | `SCENE_NOT_FOUND` | 场景不存在 | 检查 action 的 sceneId |
   | `UNSUPPORTED_ACTION` | 动作类型不被识别 | action.type 必须是 `scene_run` 或 `device_command` |
   | `DEVICE_COMMAND_NOT_YET_WIRED` | deviceCommandService 未注入 | 检查 app.ts 装配（正常已注入，仅降级时缺失） |

### 2.2 依赖服务调用

**排查思路**：动作执行依赖 `SceneService` 和 `DeviceCommandService`，这两个服务的内部故障会导致动作失败。

**关键代码**：
- `services/control-center/src/services/device-command-service.ts` 行 192-300：`executeCommand` 内部流程是「查设备 → 查在线 → 查模拟器 → 执行 → 更新注册表 → 持久化 → 发状态变化事件」。
- `services/control-center/src/services/scene-service.ts` 行 211-310：`runScene` 遍历场景命令逐个执行。

**诊断步骤**：
1. **检查设备是否在线**——离线设备命令会被直接跳过并记录 `DEVICE_OFFLINE`。
2. **检查模拟器是否存在**——设备 ID 必须在 `app.ts` 行 89-105 注册的模拟器列表里。如果动作引用了一个未注册的 deviceId，会返回 `COMMAND_INVALID`（"设备不支持该命令"）。
3. **检查 Vendor 设备归属**——`device-command-service.ts` 行 203-205：如果 `vendorProvider.ownsDevice(deviceId)` 返回 true，命令会走厂商集成路径（如涂鸦）。若涂鸦配置错误，命令会失败。

### 2.3 权限校验

**排查思路**：自动化命令执行路径与用户命令的权限校验不同。

**关键代码**：
- `device-command-service.ts` 行 169-182：`executeAutomationCommand` 直接调用 `executeCommand`，**绕过了 `ReplayGuard` 签名校验**。这是设计上的合理简化——自动化是系统内部调用，不需要用户签名。
- `rule-evaluator.ts` 行 7-13：自我触发阻断 + 链式深度限制（>3 中断）是自动化的"权限/安全"边界。

**诊断步骤**：
1. **检查链式深度**——若规则 A 触发设备变化 → 规则 B 触发 → 规则 C……超过 3 层会被 `CHAIN_DEPTH_EXCEEDED` 阻断。查日志是否有这个 reason。
2. **检查自我触发**——若规则动作改的设备正是它自己的触发条件设备，且 `event.metadata.automationId === rule.id` 且 `source==='automation'`，会被 `SELF_TRIGGER_BLOCKED` 阻断。

### 2.4 数据流传递

**排查思路**：动作配置到实际 `DeviceCommand` 的转换可能丢失字段。

**关键代码**：`services/control-center/src/automation/automation-normalization.ts` 行 210：`toAutomationDeviceCommand()` 把 action.config 转成 `DeviceCommand`，支持 `lock/power/brightness/targetTemperature` 命令。

**诊断步骤**：
1. **核对命令名与设备能力**——参考前端 `apps/openharmony-control/.../model/automation-capabilities.ets`：
   - `light` 设备支持 `power`/`brightness`
   - `air-conditioner` 设备支持 `power`/`targetTemperature`
   - `door-lock` 设备支持 `lock`
   若动作配置的命令名与设备类型不匹配，模拟器会拒绝执行。
2. **检查 property 别名**——`rule-evaluator.ts` 行 63-65：评估器会把条件属性 `power` 智能映射为设备的 `on` 字段。但**动作执行端没有这个别名逻辑**，动作命令用 `power` 是正确的（命令名层面），触发条件用 `power` 也会被自动转 `on`。这一块目前是通的。

---

## 第三部分：已确认缺陷清单与修复方案

以下是源码核查确认的真实缺陷，按严重程度排序。

### 故障 A（致命）：运行时初始化失败被静默吞掉

**位置**：`services/control-center/src/app.ts` 行 132-146

**问题**：自动化运行时的初始化被包在一个 `try/catch` 里，catch 块**直接降级为 `createNoopAutomationRuntime()` 且无任何日志**。一旦数据库连接失败、schema 迁移异常、或任一构造函数抛错，整个自动化子系统静默失效——服务正常运行、API 正常响应、前端显示规则"已启用"，但没有任何规则会被触发，也没有任何错误提示。

**为什么这是"规则无法执行"的头号嫌疑**：它完美符合"规则从未被触发"的所有表象，且完全没有可观测性，用户根本无从知晓。

**修复方案**：
```ts
// app.ts 行 132-146 改为：
try {
  const db = getDb();
  const realExecutionLogService = new ExecutionLogService(db);
  const realActionExecutor = new ActionExecutor(deviceCommandService, sceneService, realExecutionLogService);
  automationRuntime = new AutomationRuntime(
    new AutomationRepository(db),
    new RuleEvaluator(),
    realActionExecutor,
    realExecutionLogService,
    new RegistryDeviceStateReader(registry),
  );
  await automationRuntime.loadEnabledAutomations();  // 改为 await，确保加载完成
} catch (e) {
  app.log.error({ err: e }, '[automation] FATAL: runtime init failed, falling back to noop');
  automationRuntime = createNoopAutomationRuntime();
}
```
要点：① catch 中输出错误日志；② `loadEnabledAutomations` 改为 `await`（原为 `void`，错误被吞）。

### 故障 B（严重）：多条时间规则会相互错误触发

**位置**：
- `services/control-center/src/automation/triggers/time-trigger-adapter.ts` 行 66-75
- `services/control-center/src/automation/rule-evaluator.ts` 行 46-47
- `services/control-center/src/automation/automation-runtime.ts` 行 54-55

**问题**：
1. `TimeTriggerAdapter` 在某规则的时间到达时，分发的 `AutomationEvent` 只带 `type: "time"`，**不携带具体时间值**。
2. `RuleEvaluator.matchesCondition` 对 time 类型条件的判断是 `matches: condition.type === event.type`——**只比较类型，不比较时间值**。
3. `AutomationRuntime.dispatch` 对每个事件**遍历所有 loadedRules** 逐一评估。

三者叠加的结果：规则 A（22:00）的定时器在 22:00 触发，分发一个 `time` 事件后，规则 B（23:00）、规则 C（07:00）……**所有 time 类型规则都会在 22:00 一起执行**。这会导致用户看到"规则在错误的时间执行了"。

**修复方案**（推荐方案一，改动最小）：

方案一——让事件携带时间值，评估器比较时间值：
```ts
// time-trigger-adapter.ts maybeDispatch 分发时带上当前分钟
await this.dispatch({
  eventId: `${rule.id}-${Date.now()}`,
  type: "time",
  source: "system",
  timestamp: Date.now(),
  metadata: {
    chainDepth: 0,
    routeOrigin: "timer",
    time: currentMinute,        // ← 新增：携带触发时间
  },
});
```
```ts
// rule-evaluator.ts matchesCondition 的 time 分支改为比较时间值
if (condition.type === "time") {
  const expected = String(condition.time ?? condition.at ?? "");
  const actual = String(event.metadata.time ?? "");
  return { matches: expected !== "" && expected === actual, unavailable: false };
}
```

方案二——`dispatch` 对 time 事件只评估"拥有该定时器"的规则（需在事件里带上 `automationId`，dispatch 时按 ID 定向）。改动稍大但更彻底。

### 故障 C（中等）：冷却（cooldown）机制完全失效

**位置**：
- `services/control-center/src/automation/automation-repository.ts` 行 54：`cooldownMs: 0` 硬编码
- `services/control-center/src/automation/automation-runtime.ts` 行 91-99：`rememberExecution` 只做 LRU 淘汰

**问题**：规则的 `cooldownMs` 字段被硬编码为 0，数据库表也没有这一列。`AutomationRuntime` 维护了 `recentExecutions` Map，但 `dispatch()` **在执行前从未检查冷却**——`rememberExecution` 仅在执行后记录用于 LRU 淘汰。结果是：短时间内同一规则可能被反复触发（例如设备状态频繁变化时），没有任何节流。

**修复方案**：
```ts
// automation-runtime.ts dispatch() 中，在 actionExecutor.execute 之前加冷却判断
const now = Date.now();
const last = this.recentExecutions.get(rule.id);
if (rule.cooldownMs > 0 && last && now - last.timestamp < rule.cooldownMs) {
  if (this.logService) {
    this.logService.record({
      executionId: _event.metadata.executionId ?? `${rule.id}-${_event.eventId}`,
      automationId: rule.id,
      eventId: _event.eventId,
      status: "skipped",
      reason: "COOLDOWN_ACTIVE",
      timestamp: now,
    });
  }
  continue;
}
```
同时需要：① 在 `automations` 表加 `cooldown_ms` 列；② `AutomationRepository.toRule()` 读取该列而非硬编码 0；③ `rememberExecution` 改为按 `rule.id` 记录（当前按 executionId 记录，无法做按规则冷却）。

### 故障 D（中等）：场景执行不触发设备状态变化事件，断开自动化链

**位置**：`services/control-center/src/services/scene-service.ts` 行 261-296（`runScene`）

**问题**：`runScene` 直接调用 `simulator.execute()` 改变设备状态并更新注册表，但**没有调用 `deviceStateTriggerAdapter.dispatchStateChange()`**。对比 `DeviceCommandService.executeCommand()`（行 277-289）是有这个调用的。

后果：自动化 A 执行 `scene_run` 动作 → 场景改了灯的状态 → 监控该灯状态的自动化 B **永远不会被触发**。自动化链式联动在"场景"这条路径上断裂。

**修复方案**：给 `SceneService` 注入 `DeviceStateTriggerAdapter`，在 `runScene` 每条命令执行成功后分发状态变化事件：
```ts
// scene-service.ts runScene 内 simulator.execute 成功后
if (this.deviceStateTriggerAdapter) {
  try {
    await this.deviceStateTriggerAdapter.dispatchStateChange({
      deviceId: command.deviceId,
      source: "automation",
      before: beforeState,
      after: (updated?.state ?? result.state) as Record<string, unknown>,
      metadata: { executionId: `scene-${sceneId}`, chainDepth: 0, routeOrigin: "scene" },
    });
  } catch (e) { this.logger.error(`scene state dispatch failed: ${String(e)}`); }
}
```
需要修改 `SceneService` 构造函数增加 `deviceStateTriggerAdapter` 参数，并在 `app.ts` 装配时传入。

### 故障 E（轻微）：动作执行失败时仍广播"已触发"通知

**位置**：`services/control-center/src/automation/action-executor.ts` 行 17-22 vs 行 51-63

**问题**：`execute()` 一进来就 `broadcastEvent("family_activity", "自动化【X】已经被触发!")`，但随后若首个动作失败会中断。用户收到了"已触发"通知，实际却没执行成功，造成误解。

**修复方案**：把广播通知移到所有动作执行成功之后（行 66-73 的 success 日志之前），或改为"执行中"→"执行成功/失败"两阶段通知。

### 设计隐患

| 编号 | 位置 | 问题 | 建议 |
|------|------|------|------|
| H1 | `automation-event-dispatcher.ts` | 定义了 `AutomationEventDispatcher` 类但 `app.ts` 从未实例化，是死代码 | 删除或启用 |
| H2 | `sensor-event-trigger-adapter.ts` 行 10 | 传感器 `source` 硬编码 `"demo"`，仅 demo 路由调用，无真实传感器接入 | 接入真实数据源或文档标注为演示 |
| H3 | `packages/device-contract` | 自动化类型未提升到共享契约，前后端各自定义，存在类型漂移风险 | 将 `AutomationRule` 等类型提升到 device-contract |

---

## 第四部分：诊断方法与工具速查

### 4.1 按症状快速定位

| 症状 | 首先排查 | 次要排查 |
|------|----------|----------|
| 所有规则都不触发 | **故障 A**：服务日志是否有 init 失败；运行时是否降级为 noop | 数据库 `enabled`/`is_deleted` 字段 |
| 单条规则不触发 | 规则 `trigger_type` 与定时器注册；条件配置字段名 | 设备在线状态；`trigger_json` 格式 |
| 时间规则在错误时间触发 | **故障 B**：其他 time 规则的定时器是否连锁触发了它 | 服务器时区 |
| 规则频繁重复执行 | **故障 C**：cooldown 失效 | 设备状态是否在抖动 |
| 场景动作后联动规则不触发 | **故障 D**：scene_run 不发状态变化事件 | 联动规则的条件设备是否被场景修改 |
| 收到"已触发"通知但设备没动 | **故障 E**：动作实际失败但通知已发 | 查 `automation_execution_logs` 的 failed 记录 |
| 设备状态变化后规则不触发 | 触发来源是否走了 `DeviceCommandService`（场景路径不发事件） | 评估器条件匹配 |

### 4.2 SQL 诊断语句

```sql
-- 1. 查看所有规则的启用与删除状态
SELECT id, name, enabled, is_deleted, trigger_type, updated_at FROM automations;

-- 2. 查看某条规则的原始配置
SELECT id, trigger_type, trigger_json, action_json FROM automations WHERE id = '<ID>';

-- 3. 查看最近的执行日志（最有效的诊断手段）
SELECT automation_id, status, reason, action_index, action_type, created_at
FROM automation_execution_logs
ORDER BY created_at DESC LIMIT 30;

-- 4. 统计各规则的执行成功率
SELECT automation_id,
       SUM(CASE WHEN status='success' THEN 1 ELSE 0 END) AS ok,
       SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) AS fail,
       SUM(CASE WHEN status='skipped' THEN 1 ELSE 0 END) AS skip,
       COUNT(*) AS total
FROM automation_execution_logs
GROUP BY automation_id;
```

### 4.3 临时增强可观测性（推荐先做）

在排查前，建议先给运行时加诊断日志，这是定位"到底卡在哪一阶段"最快的方法：

```ts
// automation-runtime.ts dispatch() 开头加
console.log(`[automation] dispatch event: type=${_event.type} device=${_event.deviceId} loaded=${this.loadedRules.size}`);

// dispatch 循环内对每条规则的决策加
console.log(`[automation] rule=${rule.id} ok=${decision.ok} reason=${decision.reason ?? '-'}`);
```

重启服务后操作一次触发，即可在日志里看到：事件是否产生、规则是否被评估、评估结果是什么。这能在一分钟内锁定问题阶段。

### 4.4 验证边界说明

- 本报告基于源码静态分析，**结论为代码层面已确认的缺陷**，未在运行时复现。
- 后端逻辑可通过 `npm test`（含 `test/automation/` 下 8 个测试文件）验证；但现有测试**未覆盖**故障 A/B/C/D（time-trigger 测试只测单规则、runtime 测试未测冷却、无 scene 断链测试）。
- 前端 ArkTS 部分需通过 `hvigor UnitTestBuild` 验证（若要修改 `.ets`）。
- 修复后建议补充对应测试用例，防止回归。

---

## 修复优先级建议

1. **立即修**：故障 A（静默降级）——这是"规则不执行"的最可能根因，且修复成本极低（加日志 + await）。
2. **尽快修**：故障 B（时间规则误触发）——会导致错误执行，影响用户信任。
3. **计划修**：故障 D（场景断链）、故障 C（冷却失效）——影响联动和稳定性。
4. **顺手修**：故障 E（通知错位）、H1（删死代码）。

报告完。
