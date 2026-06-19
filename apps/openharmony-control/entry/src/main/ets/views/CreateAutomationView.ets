import { ActionDraft, ConditionDraft, DevicePanelState, RoutineDraft, SceneChipState } from '../model/page-view-state';
import { AppSymbol } from '../components/AppSymbol';
import { ConditionPickerSheet } from '../components/ConditionPickerSheet';
import { ActionPickerSheet } from '../components/ActionPickerSheet';
import { COLOR_ON_SURFACE, COLOR_OUTLINE_VARIANT, COLOR_PRIMARY, COLOR_SURFACE, COLOR_SURFACE_CONTAINER_HIGH, COLOR_SURFACE_CONTAINER_LOW, COLOR_TEXT_MUTED } from '../theme/smart-home-theme';
import { AppStateSnapshot } from '../model/app-state-snapshot';
import { DEVICE_CAPABILITIES, DeviceCommandConfig, DevicePropertyConfig } from '../model/automation-capabilities';
import { AutomationActionDraftItem, AutomationPayloadDraft, AutomationTriggerDraftItem } from '../services/device-api';

@Component
export struct CreateAutomationView {
  @Prop appState: AppStateSnapshot;
  @Prop editingAutomationId: string = '';
  @State draft: RoutineDraft = { name: '', icon: 'auto_awesome', conditions: [], actions: [] };
  @State showConditionSheet: boolean = false;
  @State showActionSheet: boolean = false;
  @State showIconPicker: boolean = false;
  onCancel: () => void = () => {};
  onSave: (payload: AutomationPayloadDraft) => void = () => {};

  getConditionLabel(cond: ConditionDraft): string {
    if (cond.type === 'time') {
      return `瀹氭椂: ${cond.time}`;
    }
    if (cond.type === 'device') {
      const device = this.appState.home.devices.find((item: DevicePanelState) => item.id === cond.deviceId);
      if (!device) {
        return '鏈煡璁惧';
      }
      const capability = DEVICE_CAPABILITIES[device.kind]?.conditions?.find(
        (item: DevicePropertyConfig) => item.property === cond.property,
      );
      const propertyLabel = capability ? capability.label : cond.property;
      const thresholdLabel = cond.threshold === 'true' ? '寮€鍚?' : (cond.threshold === 'false' ? '鍏抽棴' : cond.threshold);
      const operatorLabel = cond.operator === '==' ? '鍙樹负' : (cond.operator === '>' ? '澶т簬' : cond.operator);
      return `${device.roomName} ${device.name} ${propertyLabel} ${operatorLabel} ${thresholdLabel}`;
    }
    return '鏈煡鏉′欢';
  }

  getActionLabel(action: ActionDraft): string {
    if (action.type === 'scene') {
      const scene = this.appState.home.quickScenes.find((item: SceneChipState) => item.id === action.sceneId);
      return scene ? `鎵ц鍦烘櫙: ${scene.label}` : '鏈煡鍦烘櫙';
    }
    if (action.type === 'device') {
      const device = this.appState.home.devices.find((item: DevicePanelState) => item.id === action.deviceId);
      if (!device) {
        return '鏈煡璁惧';
      }

      const commandParts = (action.command || '').split(':');
      const commandName = commandParts[0];
      const commandValue = commandParts.length > 1 ? commandParts[1] : '';
      const capability = DEVICE_CAPABILITIES[device.kind]?.actions?.find(
        (item: DeviceCommandConfig) => item.command === commandName,
      );
      const commandLabel = capability ? capability.label : commandName;
      const valueLabel = commandValue === 'true' ? '寮€鍚?' : (commandValue === 'false' ? '鍏抽棴' : commandValue);

      return `${device.roomName} ${device.name} ${commandLabel} ${valueLabel}`;
    }
    return '鏈煡鍔ㄤ綔';
  }

  private buildPayload(): AutomationPayloadDraft {
    const payload = new AutomationPayloadDraft();
    payload.name = this.draft.name;
    payload.icon = this.draft.icon;
    payload.enabled = true;
    payload.triggerType = this.draft.conditions[0].type === 'time' ? 'time' : 'device';
    const triggers: AutomationTriggerDraftItem[] = this.draft.conditions.map((condition: ConditionDraft) => {
      const trigger = new AutomationTriggerDraftItem();
      trigger.id = condition.id;
      trigger.type = condition.type;
      trigger.time = condition.time;
      trigger.deviceId = condition.deviceId;
      trigger.property = condition.property;
      trigger.operator = condition.operator;
      trigger.threshold = condition.threshold;
      trigger.label = this.getConditionLabel(condition);
      return trigger;
    });
    const actions: AutomationActionDraftItem[] = this.draft.actions.map((action: ActionDraft) => {
      const actionItem = new AutomationActionDraftItem();
      actionItem.id = action.id;
      actionItem.type = action.type;
      actionItem.deviceId = action.deviceId;
      actionItem.command = action.command;
      actionItem.sceneId = action.sceneId;
      actionItem.label = this.getActionLabel(action);
      return actionItem;
    });
    payload.triggerJson = JSON.stringify(triggers);
    payload.actionJson = JSON.stringify(actions);
    return payload;
  }

  @Builder
  IconPickerSheet() {
    Column() {
      Text('閫夋嫨鍥炬爣')
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
        Text('鍙栨秷')
          .fontSize(16)
          .fontColor(COLOR_TEXT_MUTED)
          .onClick(() => {
            this.onCancel();
          })
        Text(this.editingAutomationId ? '缂栬緫鑷姩鍖?' : '鏂板缓鑷姩鍖?')
          .fontSize(18)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_ON_SURFACE)
          .layoutWeight(1)
          .textAlign(TextAlign.Center)
        Text('淇濆瓨')
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

            TextInput({ placeholder: '鑷姩鍖栧悕绉?', text: this.draft.name })
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
            Text('濡傛灉...')
              .fontSize(16)
              .fontWeight(FontWeight.Bold)
              .fontColor(COLOR_ON_SURFACE)
              .width('100%')
              .padding({ left: 4 })

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

                if (index < this.draft.conditions.length - 1 || this.draft.conditions.length > 0) {
                  Divider().color(COLOR_OUTLINE_VARIANT).strokeWidth(0.5).margin({ left: 16, right: 16 })
                }
              })

              Button('+ 娣诲姞鏉′欢', { type: ButtonType.Normal })
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
            Text('灏辨墽琛?..')
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

              Button('+ 娣诲姞鍔ㄤ綔', { type: ButtonType.Normal })
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
