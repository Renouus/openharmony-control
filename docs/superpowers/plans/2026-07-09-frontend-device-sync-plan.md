# Frontend Device Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide an accessible UI option in the header dropdown menu that triggers API provider discovery so users can fetch unassigned devices.

**Architecture:** Append a menu item "同步设备" to the universal AppHeader inside `Index.ets` which activates when viewing the generic Home tab. 

**Tech Stack:** ArkTS, @ohos.promptAction, fetch (HTTP)

---

### Task 1: Expose Backend Sync Service

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/services/DeviceService.ets` (or `AppController.ets`)

- [ ] **Step 1: Add discover API wrapper**
Find the API client layer (typically `AppController.ets` or `DeviceService.ets`) where HTTP actions are registered and add the async discovery POST wrapper:

*(Assuming it goes into `AppController.ets`)*
```typescript
  async syncProviderDevices(): Promise<boolean> {
    try {
      // Typically via the established api client in your controller
      await this.api.post('/api/providers/tuya/discover', {});
      return true;
    } catch (error) {
      console.error('Sync failed', error);
      return false;
    }
  }
```

- [ ] **Step 2: Commit Backend Wrapper**
```bash
git add apps/openharmony-control/entry/src/main/ets/controllers/AppController.ets
git commit -m "feat(frontend): api wrapper for pushing provider discovery"
```

### Task 2: Insert Menu Item and Bind to Discovery

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/pages/Index.ets`

- [ ] **Step 1: Expand Menu Condition in Index.ets**
Right now `getAppHeaderMenuItems` only generates options if they are inside a subPage Room view. Modify it to return a payload when looking at the home dashboard as well (`this.currentTab === 0` && `!this.isOnSubPage()`).

```typescript
import promptAction from '@ohos.promptAction';

// ... Inside Index.ets
  private getAppHeaderMenuItems(): AppHeaderMenuItem[] {
    if (this.isOnSubPage() && this.currentSubPage === 'room') {
      // ... existing room edit/delete options
    }
    // ADD THIS BLOCK:
    if (!this.isOnSubPage() && this.currentTab === 0) {
      return [
        {
          value: '同步第三方设备',
          action: async () => {
            promptAction.showToast({ message: '开始同步设备...' });
            
            // Assume your AppController has this method from Task 1
            const ok = await this.controller.syncProviderDevices(this.appState);
            
            promptAction.showToast({ 
               message: ok ? '同步完成！请查看上方待审区域' : '同步失败，请检查网络与密钥',
               duration: 3000
            });
            // Depending on frontend architecture, you may want to call 
            // a data refresh here, e.g. this.controller.refreshData()
          }
        }
      ]
    }
    return [];
  }
```

- [ ] **Step 2: Commit Frontend UI Route**
```bash
git add apps/openharmony-control/entry/src/main/ets/pages/Index.ets
git commit -m "feat(frontend): trigger device discovery directly from home menu dropdown"
```