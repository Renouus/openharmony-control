import { ActionDraft, ConditionDraft, DevicePanelState, RoutineDraft, SceneChipState } from '../model/page-view-state';
import { AppSymbol } from '../components/AppSymbol';
import { ConditionPickerSheet } from '../components/ConditionPickerSheet';
import { ActionPickerSheet } from '../components/ActionPickerSheet';
import { COLOR_ON_SURFACE, COLOR_OUTLINE_VARIANT, COLOR_PRIMARY, COLOR_SURFACE, COLOR_SURFACE_CONTAINER_HIGH, COLOR_SURFACE_CONTAINER_LOW, COLOR_TEXT_MUTED } from '../theme/smart-home-theme';
import { AppStateSnapshot } from '../model/app-state-snapshot';
import { DEVICE_CAPABILITIES, DeviceCommandConfig, DevicePropertyConfig } from '../model/automation-capabilities';
import { AutomationPayloadDraft, AutomationSnapshot } from '../services/device-api';
import { buildAutomationPayloadDraft, hydrateAutomationDraft } from '../model/automation-editor-mappers';

@Component
export struct CreateAutomationView {
  @Prop appState: AppStateSnapshot;
  @Prop editingAutomationId: string = '';
  @State draft: RoutineDraft = { name: '', icon: 'auto_awesome', conditionLogic: 'all', conditions: [], actions: [] };
  @State showConditionSheet: boolean = false;
  @State showActionSheet: boolean = false;
  @State showIconPicker: boolean = false;
  @State hasHydratedEditDraft: boolean = false;
  onCancel: () => void = () => {};
  onSave: (payload: AutomationPayloadDraft) => void = () => {};

  aboutToAppear(): void {
    if (this.hasHydratedEditDraft || !this.editingAutomationId) {
      return;
    }

    const snapshot = this.appState.automationSource.find(
      (item: AutomationSnapshot) => item.id === this.editingAutomationId,
    );
    if (!snapshot) {
      return;
    }

    this.draft = hydrateAutomationDraft(snapshot);
    this.hasHydratedEditDraft = true;
  }

  getConditionLabel(cond: ConditionDraft): string {
    if (cond.type === 'time') {
      return `时间：${cond.time}`;
    }
    if (cond.type === 'device') {
      const device = this.appState.home.devices.find((item: DevicePanelState) => item.id === cond.deviceId);
      if (!device) {
        return '未知设备';
      }
      const capability = DEVICE_CAPABILITIES[device.kind]?.conditions?.find(
        (item: DevicePropertyConfig) => item.property === cond.property,
      );
      const propertyLabel = capability ? capability.label : cond.property;
      const thresholdLabel = cond.threshold === 'true' ? '开启' : (cond.threshold === 'false' ? '关闭' : cond.threshold);
      const operatorLabel = cond.operator === '==' ? '等于' : (cond.operator === '>' ? '大于' : cond.operator);
      return `${device.roomName} ${device.name} ${propertyLabel} ${operatorLabel} ${thresholdLabel}`;
    }
    return '未知条件';
  }

  getActionLabel(action: ActionDraft): string {
    if (action.type === 'scene') {
      const scene = this.appState.home.quickScenes.find((item: SceneChipState) => item.id === action.sceneId);
      return scene ? `执行场景：${scene.label}` : '未知场景';
    }
    if (action.type === 'device') {
      const device = this.appState.home.devices.find((item: DevicePanelState) => item.id === action.deviceId);
      if (!device) {
        return '未知设备';
      }

      const commandParts = (action.command || '').split(':');
      const commandName = commandParts[0];
      const commandValue = commandParts.length > 1 ? commandParts[1] : '';
      const capability = DEVICE_CAPABILITIES[device.kind]?.actions?.find(
        (item: DeviceCommandConfig) => item.command === commandName,
      );
      const commandLabel = capability ? capability.label : commandName;
      const valueLabel = commandValue === 'true' ? '开启' : (commandValue === 'false' ? '关闭' : commandValue);

      return `${device.roomName} ${device.name} ${commandLabel} ${valueLabel}`;
    }
    return '未知动作';
  }

  private buildPayload(): AutomationPayloadDraft {
    return buildAutomationPayloadDraft(
      this.draft,
      (condition: ConditionDraft) => this.getConditionLabel(condition),
      (action: ActionDraft) => this.getActionLabel(action),
    );
  }

  @Builder
  IconPickerSheet() {
    Column() {
      Text('选择图标')
        .fontSize(20)
        .fontWeight(FontWeight.Bold)
        .fontColor(COLOR_ON_SURFACE)
        .padding({ top: 24, bottom: 24 })

      Flex({ wrap: FlexWrap.Wrap, justifyContent: FlexAlign.Start }) {
        ForEach(['auto_awesome', 'home', 'bedtime', 'movie', 'lightbulb', 'ac_unit', 'lock', 'videocam', 'water_drop', 'power_settings_new'], (icon: string) => {
          Row() {
            AppSymbol({ name: icon, glyphSize: 28, color: this.draft.icon === icon ? COLOR_PRIMARY : COLOR_ON_SURFACE })
          }
          .width(64)
          .height(64)
          .borderRadius(32)
          .margin(8)
          .backgroundColor(this.draft.icon === icon ? COLOR_PRIMARY + '22' : 'transparent')
          .justifyContent(FlexAlign.Center)
          .onClick(() => {
            this.draft.icon = icon;
            this.showIconPicker = false;
          })
        }, (icon: string) => icon)
      }
      .padding({ left: 16, right: 16 })
    }
    .width('100%')
    .height('100%')
  }

  build() {
    Column() {
      Row() {
        Text('取消')
          .fontSize(16)
          .fontColor(COLOR_TEXT_MUTED)
          .onClick(() => {
            this.onCancel();
          })
        Text(this.editingAutomationId ? '编辑自动化' : '新建自动化')
          .fontSize(18)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_ON_SURFACE)
          .layoutWeight(1)
          .textAlign(TextAlign.Center)
        Text('保存')
          .fontSize(16)
          .fontColor(COLOR_PRIMARY)
          .onClick(() => {
            if (!this.draft.name) {
              return;
            }
            if (this.draft.conditions.length === 0 || this.draft.actions.length === 0) {
              return;
            }
            this.onSave(this.buildPayload());
          })
      }
      .width('100%')
      .height(56)
      .padding({ left: 16, right: 16 })

      Scroll() {
        Column({ space: 24 }) {
          Row({ space: 16 }) {
            Row() {
              AppSymbol({ name: this.draft.icon || 'auto_awesome', glyphSize: 24, color: COLOR_PRIMARY })
            }
            .width(56)
            .height(56)
            .backgroundColor(COLOR_PRIMARY + '12')
            .borderRadius(16)
            .justifyContent(FlexAlign.Center)
            .onClick(() => { this.showIconPicker = true; })
            .bindSheet($$this.showIconPicker, this.IconPickerSheet(), {
              height: 340,
              dragBar: true,
              backgroundColor: COLOR_SURFACE_CONTAINER_HIGH
            })

            TextInput({ placeholder: '请输入自动化名称', text: this.draft.name })
              .onChange((value: string) => {
                this.draft.name = value;
              })
              .backgroundColor(Color.Transparent)
              .height(56)
              .layoutWeight(1)
          }
          .width('100%')
          .padding({ left: 12, right: 16, top: 12, bottom: 12 })
          .backgroundColor(COLOR_SURFACE)
          .borderRadius(20)
          .shadow({ radius: 12, color: '#08000000', offsetY: 4 })

          Column({ space: 12 }) {
            Text('触发条件')
              .fontSize(16)
              .fontWeight(FontWeight.Bold)
              .fontColor(COLOR_ON_SURFACE)
              .width('100%')
              .padding({ left: 4 })

            Row({ space: 8 }) {
              Button('满足全部（和）')
                .layoutWeight(1)
                .backgroundColor(this.draft.conditionLogic === 'all' ? COLOR_PRIMARY : COLOR_SURFACE_CONTAINER_LOW)
                .fontColor(this.draft.conditionLogic === 'all' ? Color.White : COLOR_ON_SURFACE)
                .onClick(() => { this.draft.conditionLogic = 'all'; })
              Button('满足任一（或）')
                .layoutWeight(1)
                .backgroundColor(this.draft.conditionLogic === 'any' ? COLOR_PRIMARY : COLOR_SURFACE_CONTAINER_LOW)
                .fontColor(this.draft.conditionLogic === 'any' ? Color.White : COLOR_ON_SURFACE)
                .onClick(() => { this.draft.conditionLogic = 'any'; })
            }
            .width('100%')

            Column() {
              ForEach(this.draft.conditions, (condition: ConditionDraft, index: number) => {
                Row() {
                  Text(this.getConditionLabel(condition))
                    .layoutWeight(1)
                    .fontSize(15)
                    .fontColor(COLOR_ON_SURFACE)
                  Row() {
                    AppSymbol({ name: 'xmark', glyphSize: 14, color: COLOR_TEXT_MUTED })
                  }
                  .width(32)
                  .height(32)
                  .borderRadius(16)
                  .justifyContent(FlexAlign.Center)
                  .alignItems(VerticalAlign.Center)
                  .onClick(() => {
                    const nextConditions = [...this.draft.conditions];
                    nextConditions.splice(index, 1);
                    this.draft.conditions = nextConditions;
                  })
                }
                .width('100%')
                .alignItems(VerticalAlign.Center)
                .padding({ left: 16, right: 12, top: 16, bottom: 16 })

                if (index < this.draft.conditions.length - 1) {
                  Text(this.draft.conditionLogic === 'all' ? '且' : '或')
                    .fontSize(12)
                    .fontColor(COLOR_TEXT_MUTED)
                    .width('100%')
                    .textAlign(TextAlign.Center)
                  Divider().color(COLOR_OUTLINE_VARIANT).strokeWidth(0.5).margin({ left: 16, right: 16 })
                }
              })

              Button('+ 添加条件', { type: ButtonType.Normal })
                .width('100%')
                .height(48)
                .backgroundColor(Color.Transparent)
                .fontColor(COLOR_PRIMARY)
                .fontSize(15)
                .fontWeight(FontWeight.Medium)
                .clickEffect({ level: ClickEffectLevel.LIGHT, scale: 0.98 })
                .onClick(() => {
                  this.showConditionSheet = true;
                })
            }
            .width('100%')
            .backgroundColor(COLOR_SURFACE)
            .borderRadius(20)
            .shadow({ radius: 12, color: '#08000000', offsetY: 4 })
            .clip(true)
            .bindSheet($$this.showConditionSheet, this.ConditionSheetBuilder(), { height: SheetSize.MEDIUM })
          }
          .width('100%')

          Column({ space: 12 }) {
            Text('执行动作')
              .fontSize(16)
              .fontWeight(FontWeight.Bold)
              .fontColor(COLOR_ON_SURFACE)
              .width('100%')
              .padding({ left: 4 })

            Column() {
              ForEach(this.draft.actions, (action: ActionDraft, index: number) => {
                Row() {
                  Text(this.getActionLabel(action))
                    .layoutWeight(1)
                    .fontSize(15)
                    .fontColor(COLOR_ON_SURFACE)
                  Row() {
                    AppSymbol({ name: 'xmark', glyphSize: 14, color: COLOR_TEXT_MUTED })
                  }
                  .width(32)
                  .height(32)
                  .borderRadius(16)
                  .justifyContent(FlexAlign.Center)
                  .alignItems(VerticalAlign.Center)
                  .onClick(() => {
                    const nextActions = [...this.draft.actions];
                    nextActions.splice(index, 1);
                    this.draft.actions = nextActions;
                  })
                }
                .width('100%')
                .alignItems(VerticalAlign.Center)
                .padding({ left: 16, right: 12, top: 16, bottom: 16 })

                if (index < this.draft.actions.length - 1 || this.draft.actions.length > 0) {
                  Divider().color(COLOR_OUTLINE_VARIANT).strokeWidth(0.5).margin({ left: 16, right: 16 })
                }
              })

              Button('+ 添加动作', { type: ButtonType.Normal })
                .width('100%')
                .height(48)
                .backgroundColor(Color.Transparent)
                .fontColor(COLOR_PRIMARY)
                .fontSize(15)
                .fontWeight(FontWeight.Medium)
                .clickEffect({ level: ClickEffectLevel.LIGHT, scale: 0.98 })
                .onClick(() => {
                  this.showActionSheet = true;
                })
            }
            .width('100%')
            .backgroundColor(COLOR_SURFACE)
            .borderRadius(20)
            .shadow({ radius: 12, color: '#08000000', offsetY: 4 })
            .clip(true)
            .bindSheet($$this.showActionSheet, this.ActionSheetBuilder(), { height: SheetSize.MEDIUM })
          }
          .width('100%')
        }
        .padding(16)
        .width('100%')
      }
      .align(Alignment.Top)
      .layoutWeight(1)
    }
    .width('100%')
    .height('100%')
    .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
  }

  @Builder
  ConditionSheetBuilder() {
    ConditionPickerSheet({
      appState: this.appState,
      onSelect: (condition) => {
        this.draft.conditions = [...this.draft.conditions, condition];
        this.showConditionSheet = false;
      }
    })
  }

  @Builder
  ActionSheetBuilder() {
    ActionPickerSheet({
      appState: this.appState,
      onSelect: (action) => {
        this.draft.actions = [...this.draft.actions, action];
        this.showActionSheet = false;
      }
    })
  }
}
