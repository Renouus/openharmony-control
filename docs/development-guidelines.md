# 开发规范指导方针

本文件约定 OmniHome ArkTS 控制端（`apps/openharmony-control/entry`）的代码组织、状态管理、导航、依赖注入与扩展流程。

后端 API、设备契约、安全模型见 `architecture.md`，本文不重复。

---

## 1. 分层架构

代码严格分层，依赖方向自上而下，禁止反向依赖。

```
pages/         入口与全局装配（@Entry，@Provide 注入点）
  └─ views/    页面级 UI（@Consume 注入，组合 components）
       └─ components/   纯展示组件（@Prop 输入 + 回调输出）
controllers/   AppController：编排 ViewModel + 触发状态刷新
viewmodel/     单领域用例：调用 repository，返回 *Data 或 feedback 字符串
model/         视图状态类型、纯映射函数、导航纯函数
services/      repository 端口 + DeviceApi（HTTP）
theme/         颜色 token 与排序常量
```

各层职责红线：

- `model`、`viewmodel`、`services` 是纯逻辑层，**不得 import 任何 ArkUI 组件或装饰器**（无 `@Component`、无 `$r`、无 `Color`）。保证可单测。
- `views`/`components` **不得直接调用 `services` 或 `DeviceApi`**，必须经 `controller`。
- `components` 不得 `@Consume` 全局状态，只通过 `@Prop` 接收数据、通过回调上报事件，保持可复用、可独立测试。
- 跨领域编排只能发生在 `AppController`，单个 `ViewModel` 不感知其他领域。

---

## 2. 状态管理

### 2.1 视图状态用 `@Observed` 类，不用 plain interface

每个领域有两个产物：

- `*ViewState`（`@Observed class`）—— UI 消费的响应式实例，定义在 `model/page-view-state.ets`。
- `*ViewStateData`（`interface`）—— 纯数据形状，由 `viewmodel`/`mappers` 返回，可单测。

ViewModel 与 mapper 永远返回 `*Data`；`@Observed` 实例只活在 `AppStateSnapshot` 里。

### 2.2 原地更新，不要整体替换

`AppStateSnapshot`（`@Observed`）持有八个领域实例。刷新数据时调用 `assign*()` 把 `*Data` 写回**已存在的实例字段**，从而触发子视图 `@ObjectLink` 的精确更新：

```typescript
// 正确：原地写回，触发响应式更新
snapshot.assignLighting(await this.fetchLighting(feedback));

// 错误：整体 new 会断开 @ObjectLink 引用，且丢失增量更新语义
snapshot.lighting = new LightingViewState();
```

新增领域字段时，必须同步在 `AppStateSnapshot` 补一个 `assignXxx()` 方法，逐字段拷贝。

### 2.3 View 通过 getter 读状态

View 用 `@Consume('appState')` 拿到快照，再用私有 getter 暴露本页状态，保持 `build()` 简洁：

```typescript
@Consume('appState') appState: AppStateSnapshot;
private get state(): LightingViewState { return this.appState.lighting; }
```

---

## 3. 导航

### 3.1 统一用 `Navigation` + `NavPathStack`

- **Tab 页**（`home`、`automation`、`notifications`、`family`）：留在 `Navigation` 内容区，由 `Index` 的 `@State currentTab` 切换。
- **Sub 页**（`lighting`、`access`、`camera`、`climate`、`sceneEditor`、`routineEditor`、`familySettings`）：是 `NavDestination`，通过 `navStack.pushPathByName(name, null)` 入栈、`navStack.pop()` 返回。

新增页面分类规则见 `model/index-page-state.ets` 的 `isSubPageId()`，新增 sub 页必须在此登记，并在 `Index.pageMap()` 增加分支。

### 3.2 Sub 页组件自带 `NavDestination` 外壳

每个 sub 页 view 导出的根组件 wrap `NavDestination().hideTitleBar(true)`，内部用独立的 `XxxContent` struct 承载真实 UI 与 `@Consume`：

```typescript
@Component
export struct LightingView {
  build() {
    NavDestination() {
      Scroll() { LightingContent().padding({ left: 20, right: 20, top: 16, bottom: 32 }) }
        .scrollBar(BarState.Off).width('100%').height('100%')
    }.hideTitleBar(true)
  }
}
```

### 3.3 返回按钮与栈深度

- 全局 `AppHeader` 的返回按钮可见性由 `Index.subPageDepth > 0` 驱动。
- `subPageDepth` 通过 `Navigation.onNavBarStateChange` 与 push/pop 操作同步，**不要**在 `build()` 里直接读 `navStack.size()`（非响应式）。

---

## 4. 依赖注入（消灭 prop-drilling）

`Index` 在子树根注入三项，禁止再用逐层回调透传：

```typescript
@Provide('controller') controller: AppController = new AppController();
@Provide('appState') appState: AppStateSnapshot = new AppStateSnapshot();
@Provide('navStack') navStack: NavPathStack = new NavPathStack();
```

View 直接消费并自行触发动作：

```typescript
@Consume('controller') controller: AppController;
@Consume('appState') appState: AppStateSnapshot;
@Consume('navStack') navStack: NavPathStack;
// 事件直接打到 controller
onClick: () => this.controller.handleLightingPreset(this.appState, preset.label)
```

约定：

- 注入 key 用字符串字面量（`'controller'` 等），全项目保持一致。
- `@Provide`/`@Consume` 只注入这三类长生命周期对象，**不注入函数回调**（ArkTS 对函数型 Provide 支持不稳定，且会绕过分层）。
- `components`（叶子组件）不消费注入，仍走 `@Prop` + 回调，由其所属 view 适配。

---

## 5. 新增一个功能的标准流程

以"给灯增加一个新动作"为例，按顺序改动，通常只触及 2 个文件：

1. **services**：若需要新命令，在 `device-api.ets` 定义 payload interface 并扩展命令联合类型（见 §7），在 `SmartHomeRepositoryPort` 加方法。
2. **viewmodel**：在对应 `XxxViewModel` 加一个 `async action(): Promise<string>`，`try/catch` 包裹，失败返回 `normalizeRepositoryError(error)`。
3. **controller**：加 `handleXxx(snapshot, ...)`，调用 ViewModel 拿 feedback，再 `refreshPlannedTargets(snapshot, action, feedback)`。
4. **index-page-state**：在 `IndexPageAction` 加动作名，在 `createRefreshPlan()` 声明该动作刷新哪些页面。
5. **view**：UI 事件直接 `this.controller.handleXxx(this.appState, ...)`。
6. **测试**：为新增的 ViewModel 动作与 mapper 补单测（见 §8）。

不再需要改 `PageContent` / 透传链。`PageContent.ets` 已废弃为空壳，**不要往里加新逻辑**。

---

## 6. 命名约定

| 类别 | 规则 | 示例 |
|------|------|------|
| 文件（model/viewmodel/services） | kebab-case | `lighting-view-model.ets` |
| 文件（组件/页面 struct） | PascalCase | `LightingView.ets` |
| `@Observed` 视图状态类 | `XxxViewState` | `LightingViewState` |
| 纯数据接口 | `XxxViewStateData` | `LightingViewStateData` |
| 工厂函数 | `createEmptyXxxViewStateData()` | — |
| Controller 处理器 | `handleXxx(snapshot, ...)` | `handleLightingPreset` |
| ViewModel 用例 | 动词短语 | `applyPreset`、`toggleRoom` |
| mapper | `mapXxxViewState(...)` | `mapHomeViewState` |
| 回调 prop | `onXxx` | `onToggle`、`onBack` |
| 颜色常量 | `COLOR_*` 全大写 | `COLOR_PRIMARY` |

---

## 7. ArkTS 编码约定

- **对象字面量必须有显式类型目标。** 禁止 `Record<string, Object>` 之类宽泛别名承载命令 payload。每种 payload 先声明 interface，再用联合类型暴露给命令 API；新增命令时先补 payload interface 与联合类型，再接 UI。
- **异步处理器**：View 里的事件处理器可直接调用返回 `Promise` 的 controller 方法，无需 `await`（fire-and-forget），状态更新由响应式机制完成。
- **空值**：可选字段用 `?` 与 `=== undefined` 判定，避免依赖 falsy 语义（`0`、`''` 是合法值）。
- **错误反馈**：用户可见的失败统一走领域 `feedback: string` 字段渲染，禁止吞异常后静默。

---

## 8. 测试约定

- 测试位于 `entry/src/ohosTest/ets/test/`，每个 ViewModel / 关键 mapper 一份 `*.test.ets`。
- 用实现 `SmartHomeRepositoryPort` 的 Stub 注入 ViewModel，**不打真实网络**。新增 port 方法时，所有 Stub 必须同步实现，否则编译失败。
- 测试只断言纯数据（`*Data` 形状）与映射逻辑，不测 UI 渲染。
- 纯导航逻辑（`navigateToPage`、`createRefreshPlan` 等）保持为纯函数并单测，见 `index-page-state.test.ets`。
- 提交前确保新增/改动逻辑有对应测试，并跑通现有测试。

---

## 9. 主题与样式

- 所有颜色取自 `theme/smart-home-theme.ets` 的 `COLOR_*` 常量，**禁止在组件里硬编码十六进制色值**（半透明叠加如 `COLOR_BORDER + '66'` 是允许的既有写法）。
- 房间排序等业务常量集中在 theme 层（`ROOM_ORDER`），不要散落到 view。
- 新增设计 token 时先加到 theme 文件再引用，保持单一出处。

---

## 10. 提交前自检清单

- [ ] 分层依赖方向正确，`model`/`viewmodel`/`services` 无 ArkUI 依赖。
- [ ] 新领域字段已补 `AppStateSnapshot.assignXxx()`。
- [ ] 新 sub 页已在 `isSubPageId()` 与 `Index.pageMap()` 登记。
- [ ] 新动作已在 `IndexPageAction` 与 `createRefreshPlan()` 登记。
- [ ] 无硬编码颜色、无 prop-drilling、无 `PageContent` 新逻辑。
- [ ] 新增 payload 有显式 interface 并入联合类型。
- [ ] 相关单测已补充并全部通过。
