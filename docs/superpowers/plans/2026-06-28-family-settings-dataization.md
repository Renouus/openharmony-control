# Family Settings Dataization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Family Settings page from a static mock screen into a small but real settings flow backed by live data and editable forms.

**Architecture:** Keep scope intentionally small for the first iteration: wire two settings only, "home info" and "emergency contact". Add a new family settings API surface in the control-center, load it through the existing `DeviceApi` / repository / controller stack, and render dedicated edit subviews instead of clickable dead cards.

**Tech Stack:** ArkTS / OpenHarmony UI, Fastify, SQLite-backed control center patterns already used in the repo, existing controller-repository-viewmodel structure.

---

## File Map

**Backend**
- Modify: `services/control-center/src/routes/family.ts`
  Purpose: add `GET /api/family/settings` and `PUT /api/family/settings` with in-memory persistence for v1.

**Frontend data layer**
- Modify: `apps/openharmony-control/entry/src/main/ets/services/device-api.ets`
  Purpose: add request/response types and API methods for family settings fetch/update.
- Modify: `apps/openharmony-control/entry/src/main/ets/services/smart-home-repository.ets`
  Purpose: expose repository methods for reading/updating family settings.
- Modify: `apps/openharmony-control/entry/src/main/ets/controllers/AppController.ets`
  Purpose: add controller handlers for loading and saving family settings.

**Frontend state/model**
- Modify: `apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets`
  Purpose: add view-state types for family settings summary and edit drafts.
- Modify: `apps/openharmony-control/entry/src/main/ets/model/app-state-snapshot.ets`
  Purpose: store reactive family settings state.

**Frontend views/navigation**
- Modify: `apps/openharmony-control/entry/src/main/ets/views/FamilySettingsView.ets`
  Purpose: replace static cards with live settings list and navigation.
- Create: `apps/openharmony-control/entry/src/main/ets/views/HomeInfoEditorView.ets`
  Purpose: edit household name, address, timezone.
- Create: `apps/openharmony-control/entry/src/main/ets/views/EmergencyContactEditorView.ets`
  Purpose: edit contact name and phone number.
- Modify: `apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets`
  Purpose: add page IDs for new editor screens.
- Modify: `apps/openharmony-control/entry/src/main/ets/model/index-page-state.ets`
  Purpose: register new subpage IDs.
- Modify: `apps/openharmony-control/entry/src/main/ets/pages/Index.ets`
  Purpose: render the new editor subpages.

**Tests / verification**
- Modify: `services/control-center/test/routes` if family route tests already exist or create one adjacent to existing route tests.
  Purpose: prove settings fetch/update behavior.

---

### Task 1: Add Family Settings Backend Endpoints

**Files:**
- Modify: `services/control-center/src/routes/family.ts`
- Test: `services/control-center/test/routes/family-settings.test.ts`

- [ ] **Step 1: Write the failing backend test**

```ts
import { describe, expect, it } from 'vitest';
import Fastify from 'fastify';
import { registerFamilyRoutes } from '../../src/routes/family';

describe('family settings routes', () => {
  it('returns default family settings and updates them', async () => {
    const app = Fastify();
    await registerFamilyRoutes(app);

    const getBefore = await app.inject({
      method: 'GET',
      url: '/api/family/settings',
    });
    expect(getBefore.statusCode).toBe(200);
    expect(getBefore.json()).toMatchObject({
      homeName: expect.any(String),
      address: expect.any(String),
      timezone: expect.any(String),
      emergencyContactName: expect.any(String),
      emergencyContactPhone: expect.any(String),
    });

    const putResponse = await app.inject({
      method: 'PUT',
      url: '/api/family/settings',
      payload: {
        homeName: 'My Home',
        address: 'Shanghai Demo Road 88',
        timezone: 'Asia/Shanghai',
        emergencyContactName: 'Li Lei',
        emergencyContactPhone: '13800000000',
      },
    });
    expect(putResponse.statusCode).toBe(200);

    const getAfter = await app.inject({
      method: 'GET',
      url: '/api/family/settings',
    });
    expect(getAfter.json()).toMatchObject({
      homeName: 'My Home',
      address: 'Shanghai Demo Road 88',
      timezone: 'Asia/Shanghai',
      emergencyContactName: 'Li Lei',
      emergencyContactPhone: '13800000000',
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- family-settings.test.ts`
Expected: FAIL because `/api/family/settings` does not exist.

- [ ] **Step 3: Write minimal backend implementation**

```ts
type FamilySettings = {
  homeName: string;
  address: string;
  timezone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
};

const familySettings: FamilySettings = {
  homeName: 'My Home',
  address: '1428 Elm Street, Sunnyvale',
  timezone: 'Asia/Shanghai',
  emergencyContactName: 'Emergency Center',
  emergencyContactPhone: '110',
};

function isFamilySettingsPayload(body: unknown): body is Partial<FamilySettings> {
  if (body === null || typeof body !== 'object') {
    return false;
  }
  return true;
}

app.get('/api/family/settings', async () => familySettings);

app.put('/api/family/settings', async (request, reply) => {
  if (!isFamilySettingsPayload(request.body)) {
    return reply.code(400).send({ code: 'INVALID_SETTINGS_PAYLOAD' });
  }

  Object.assign(familySettings, request.body);
  return familySettings;
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- family-settings.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add services/control-center/src/routes/family.ts services/control-center/test/routes/family-settings.test.ts
git commit -m "feat: add family settings routes"
```

### Task 2: Add Frontend API and Repository Support

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/services/device-api.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/smart-home-repository.ets`

- [ ] **Step 1: Add request and response types in `device-api.ets`**

```ts
export interface FamilySettingsSnapshot {
  homeName: string;
  address: string;
  timezone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export interface FamilySettingsUpdateRequest {
  homeName?: string;
  address?: string;
  timezone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}
```

- [ ] **Step 2: Add API methods in `device-api.ets`**

```ts
async getFamilySettings(): Promise<FamilySettingsSnapshot> {
  const client = http.createHttp();
  try {
    const response = await client.request(`${this.baseUrl}/api/family/settings`, {
      method: http.RequestMethod.GET,
      expectDataType: http.HttpDataType.STRING,
    });
    return JSON.parse(response.result as string) as FamilySettingsSnapshot;
  } finally {
    client.destroy();
  }
}

async updateFamilySettings(payload: FamilySettingsUpdateRequest): Promise<FamilySettingsSnapshot> {
  const client = http.createHttp();
  try {
    const response = await client.request(`${this.baseUrl}/api/family/settings`, {
      method: http.RequestMethod.PUT,
      header: { 'content-type': 'application/json' },
      extraData: JSON.stringify(payload),
      expectDataType: http.HttpDataType.STRING,
    });
    return JSON.parse(response.result as string) as FamilySettingsSnapshot;
  } finally {
    client.destroy();
  }
}
```

- [ ] **Step 3: Expose repository methods**

```ts
getFamilySettings(): Promise<FamilySettingsSnapshot>;
updateFamilySettings(payload: FamilySettingsUpdateRequest): Promise<FamilySettingsSnapshot>;
```

```ts
async getFamilySettings(): Promise<FamilySettingsSnapshot> {
  return await this.api.getFamilySettings();
}

async updateFamilySettings(payload: FamilySettingsUpdateRequest): Promise<FamilySettingsSnapshot> {
  return await this.api.updateFamilySettings(payload);
}
```

- [ ] **Step 4: Verify compile-level integration**

Run: `npm run typecheck`
Expected: PASS or only unrelated pre-existing errors

- [ ] **Step 5: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/services/device-api.ets apps/openharmony-control/entry/src/main/ets/services/smart-home-repository.ets
git commit -m "feat: add family settings api client"
```

### Task 3: Add Reactive Frontend State and Controller Handlers

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/model/app-state-snapshot.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/controllers/AppController.ets`

- [ ] **Step 1: Add family settings state types**

```ts
export interface FamilySettingsStateData {
  homeName: string;
  address: string;
  timezone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  feedback: string;
}

@Observed
export class FamilySettingsState {
  homeName: string = 'My Home';
  address: string = '';
  timezone: string = 'Asia/Shanghai';
  emergencyContactName: string = '';
  emergencyContactPhone: string = '';
  feedback: string = '';
}

export function createEmptyFamilySettingsStateData(): FamilySettingsStateData {
  return {
    homeName: 'My Home',
    address: '',
    timezone: 'Asia/Shanghai',
    emergencyContactName: '',
    emergencyContactPhone: '',
    feedback: '',
  };
}
```

- [ ] **Step 2: Store the new state in `AppStateSnapshot`**

```ts
familySettings: FamilySettingsState = new FamilySettingsState();

assignFamilySettings(data: FamilySettingsStateData): void {
  this.familySettings.homeName = data.homeName;
  this.familySettings.address = data.address;
  this.familySettings.timezone = data.timezone;
  this.familySettings.emergencyContactName = data.emergencyContactName;
  this.familySettings.emergencyContactPhone = data.emergencyContactPhone;
  this.familySettings.feedback = data.feedback;
}
```

- [ ] **Step 3: Add controller load and save helpers**

```ts
private async fetchFamilySettings(feedback: string = ''): Promise<FamilySettingsStateData> {
  try {
    const settings = await this.repository.getFamilySettings();
    return {
      homeName: settings.homeName,
      address: settings.address,
      timezone: settings.timezone,
      emergencyContactName: settings.emergencyContactName,
      emergencyContactPhone: settings.emergencyContactPhone,
      feedback,
    };
  } catch {
    const next = createEmptyFamilySettingsStateData();
    next.feedback = 'Family settings unavailable';
    return next;
  }
}

async refreshFamilySettings(snapshot: AppStateSnapshot, feedback: string = ''): Promise<void> {
  snapshot.assignFamilySettings(await this.fetchFamilySettings(feedback));
}

async handleUpdateFamilySettings(snapshot: AppStateSnapshot, payload: FamilySettingsUpdateRequest): Promise<void> {
  try {
    await this.repository.updateFamilySettings(payload);
    snapshot.assignFamilySettings(await this.fetchFamilySettings('Family settings updated'));
  } catch {
    snapshot.assignFamilySettings(await this.fetchFamilySettings('Failed to update family settings'));
  }
}
```

- [ ] **Step 4: Load family settings when the settings page opens**

Implementation note:
Call `this.controller.refreshFamilySettings(this.appState)` from the settings entry path or `aboutToAppear()` of the settings view, but only if current state is empty to avoid noisy re-fetches.

- [ ] **Step 5: Verify type safety**

Run: `npm run typecheck`
Expected: PASS or only unrelated pre-existing errors

- [ ] **Step 6: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets apps/openharmony-control/entry/src/main/ets/model/app-state-snapshot.ets apps/openharmony-control/entry/src/main/ets/controllers/AppController.ets
git commit -m "feat: add family settings state"
```

### Task 4: Replace Static Family Settings Page with Live Entries

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/views/FamilySettingsView.ets`

- [ ] **Step 1: Replace hardcoded options with state-driven rows**

```ts
interface FamilySettingsRow {
  id: 'homeInfo' | 'emergency';
  icon: string;
  title: string;
  subtitle: string;
}

private buildRows(): FamilySettingsRow[] {
  return [
    {
      id: 'homeInfo',
      icon: 'house',
      title: '家庭信息',
      subtitle: `${this.appState.familySettings.homeName} · ${this.appState.familySettings.timezone}`,
    },
    {
      id: 'emergency',
      icon: 'contact_emergency',
      title: '紧急联系人',
      subtitle: `${this.appState.familySettings.emergencyContactName} · ${this.appState.familySettings.emergencyContactPhone}`,
    },
  ];
}
```

- [ ] **Step 2: Add row click behavior**

```ts
.onClick(() => {
  if (row.id === 'homeInfo') {
    this.navStack.pushPathByName('homeInfoEditor', null);
  } else {
    this.navStack.pushPathByName('emergencyContactEditor', null);
  }
})
```

- [ ] **Step 3: Render feedback banner**

```ts
if (this.appState.familySettings.feedback.length > 0) {
  Text(this.appState.familySettings.feedback)
    .fontSize(13)
    .fontColor(COLOR_PRIMARY)
    .padding(12)
    .borderRadius(12)
    .backgroundColor(COLOR_PRIMARY_SOFT)
    .width('100%')
}
```

- [ ] **Step 4: Verify visual behavior**

Run the OpenHarmony app and confirm:
- The page no longer shows dead Wi-Fi / hub cards.
- Two rows render real values from backend state.
- Tapping a row navigates to an editor screen.

- [ ] **Step 5: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/views/FamilySettingsView.ets
git commit -m "feat: wire family settings overview"
```

### Task 5: Add Home Info Editor

**Files:**
- Create: `apps/openharmony-control/entry/src/main/ets/views/HomeInfoEditorView.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/pages/Index.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/model/index-page-state.ets`

- [ ] **Step 1: Register the new page ID**

```ts
| 'homeInfoEditor'
```

Add it anywhere `isSubPageId()` or similar subpage guards enumerate subpages.

- [ ] **Step 2: Create the editor view**

```ts
@Component
export struct HomeInfoEditorView {
  @Prop appState: AppStateSnapshot;
  onCancel: () => void = () => {};
  onSave: (payload: { homeName: string; address: string; timezone: string }) => void = () => {};

  @State homeName: string = '';
  @State address: string = '';
  @State timezone: string = '';

  aboutToAppear() {
    this.homeName = this.appState.familySettings.homeName;
    this.address = this.appState.familySettings.address;
    this.timezone = this.appState.familySettings.timezone;
  }
}
```

Add three `TextInput` fields and Save / Cancel actions matching the style already used in `SceneEditorView.ets`.

- [ ] **Step 3: Mount the editor in `Index.ets`**

```ts
} else if (this.currentSubPage === 'homeInfoEditor') {
  HomeInfoEditorView({
    appState: this.appState,
    onCancel: () => this.popSubPage(),
    onSave: async (payload) => {
      await this.controller.handleUpdateFamilySettings(this.appState, payload);
      this.popSubPage();
    }
  })
  .layoutWeight(1)
}
```

- [ ] **Step 4: Verify behavior**

Manual verification:
- Open Family Settings
- Enter Home Info
- Change home name and timezone
- Save
- Return to overview and confirm subtitle refreshes

- [ ] **Step 5: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/views/HomeInfoEditorView.ets apps/openharmony-control/entry/src/main/ets/pages/Index.ets apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets apps/openharmony-control/entry/src/main/ets/model/index-page-state.ets
git commit -m "feat: add home info editor"
```

### Task 6: Add Emergency Contact Editor

**Files:**
- Create: `apps/openharmony-control/entry/src/main/ets/views/EmergencyContactEditorView.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/pages/Index.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/model/index-page-state.ets`

- [ ] **Step 1: Register the new page ID**

```ts
| 'emergencyContactEditor'
```

- [ ] **Step 2: Create the editor view**

```ts
@Component
export struct EmergencyContactEditorView {
  @Prop appState: AppStateSnapshot;
  onCancel: () => void = () => {};
  onSave: (payload: { emergencyContactName: string; emergencyContactPhone: string }) => void = () => {};

  @State contactName: string = '';
  @State contactPhone: string = '';

  aboutToAppear() {
    this.contactName = this.appState.familySettings.emergencyContactName;
    this.contactPhone = this.appState.familySettings.emergencyContactPhone;
  }
}
```

Add two `TextInput` fields and a Save action with minimal validation: both fields must be non-empty.

- [ ] **Step 3: Mount the editor in `Index.ets`**

```ts
} else if (this.currentSubPage === 'emergencyContactEditor') {
  EmergencyContactEditorView({
    appState: this.appState,
    onCancel: () => this.popSubPage(),
    onSave: async (payload) => {
      await this.controller.handleUpdateFamilySettings(this.appState, payload);
      this.popSubPage();
    }
  })
  .layoutWeight(1)
}
```

- [ ] **Step 4: Verify behavior**

Manual verification:
- Open Emergency Contact editor
- Change name and phone
- Save
- Return to overview and confirm subtitle refreshes

- [ ] **Step 5: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/views/EmergencyContactEditorView.ets apps/openharmony-control/entry/src/main/ets/pages/Index.ets apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets apps/openharmony-control/entry/src/main/ets/model/index-page-state.ets
git commit -m "feat: add emergency contact editor"
```

### Task 7: Final Verification

**Files:**
- Verify only

- [ ] **Step 1: Run backend tests**

Run: `npm test -- family-settings.test.ts`
Expected: PASS

- [ ] **Step 2: Run frontend typecheck**

Run: `npm run typecheck`
Expected: PASS or only unrelated pre-existing errors

- [ ] **Step 3: Run full manual flow**

Checklist:
- Family Settings page loads live values
- Home Info can be edited and saved
- Emergency Contact can be edited and saved
- Returning to the overview shows the updated values
- No dead option cards remain on the page

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: dataize family settings flow"
```

## Self-Review

**Spec coverage**
- Covers the requested “第 4 项”: family settings dataization.
- Keeps scope to the two highest-value settings: home info and emergency contact.
- Explicitly removes static dead-card behavior from the current settings view.

**Placeholder scan**
- No TBD / TODO placeholders remain.
- Each task names exact files and concrete commands.

**Type consistency**
- Uses one backend/frontend shape: `homeName`, `address`, `timezone`, `emergencyContactName`, `emergencyContactPhone`.
- Uses one controller save path: `handleUpdateFamilySettings`.

Plan complete and saved to `docs/superpowers/plans/2026-06-28-family-settings-dataization.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
