import { RoutineDraft, ConditionDraft, ActionDraft, DevicePanelState, SceneChipState, SceneCardState } from '../model/page-view-state';
import { AppSymbol } from '../components/AppSymbol';
import { ConditionPickerSheet } from '../components/ConditionPickerSheet';
import { ActionPickerSheet } from '../components/ActionPickerSheet';
import { COLOR_ON_SURFACE, COLOR_SURFACE, COLOR_PRIMARY, COLOR_OUTLINE_VARIANT, COLOR_TEXT_MUTED,
  COLOR_SURFACE_CONTAINER_HIGH } from '../theme/smart-home-theme';
import { AppStateSnapshot } from '../model/app-state-snapshot';
import { DEVICE_CAPABILITIES, DevicePropertyConfig, DeviceCommandConfig } from '../model/automation-capabilities';

@Component
export struct CreateAutomationView {
  @Prop appState: AppStateSnapshot;
  @State draft: RoutineDraft = { name: '', icon: 'auto_awesome', conditions: [], actions: [] };
  @State showConditionSheet: boolean = false;
  @State showActionSheet: boolean = false;
  @State showIconPicker: boolean = false;
  onCancel: () => void = () => {};
  onSave: (scene: SceneCardState) => void = () => {};

  getConditionLabel(cond: ConditionDraft): string {
    if (cond.type === 'time') {
      return `定时: ${cond.time}`;
    }
    if (cond.type === 'device') {
      let device = this.appState.home.devices.find((d: DevicePanelState) => d.id === cond.deviceId);
      if (!device) return '未知设备';
      let cap = DEVICE_CAPABILITIES[device.kind]?.conditions?.find((c: DevicePropertyConfig) => c.property === cond.property);
      let propLabel = cap ? cap.label : cond.property;
      let thresholdLabel = cond.threshold === 'true' ? '开启' : (cond.threshold === 'false' ? '关闭' : cond.threshold);
      let opLabel = cond.operator === '==' ? '变为' : (cond.operator === '>' ? '大于' : cond.operator);
      return `${device.roomName} ${device.name} ${propLabel} ${opLabel} ${thresholdLabel}`;
    }
    return '未知条件';
  }

  getActionLabel(action: ActionDraft): string {
    if (action.type === 'scene') {
      let scene = this.appState.home.quickScenes.find((s: SceneChipState) => s.id === action.sceneId);
      return scene ? `执行场景: ${scene.label}` : '未知场景';
    }
    if (action.type === 'device') {
      let device = this.appState.home.devices.find((d: DevicePanelState) => d.id === action.deviceId);
      if (!device) return '未知设备';
      
      let cmdParts = (action.command || '').split(':');
      let cmdName = cmdParts[0];
      let cmdValue = cmdParts.length > 1 ? cmdParts[1] : '';
      
      let cap = DEVICE_CAPABILITIES[device.kind]?.actions?.find((a: DeviceCommandConfig) => a.command === cmdName);
      let cmdLabel = cap ? cap.label : cmdName;
      let valLabel = cmdValue === 'true' ? '开启' : (cmdValue === 'false' ? '关闭' : cmdValue);
      
      return `${device.roomName} ${device.name} ${cmdLabel} ${valLabel}`;
    }
    return '未知动作';
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
        }, (i: string) => i)
      }
      .padding({ left: 16, right: 16 })
    }
    .width('100%')
    .height('100%')
  }

  build() {
    Column() {
      // Header
      Row() {
        Text('取消')
          .fontSize(16)
          .fontColor(COLOR_TEXT_MUTED)
          .onClick(() => {
            this.onCancel();
          })
        Text('新建自动化')
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
              console.error('Validation: Name is required');
              return;
            }
            if (this.draft.conditions.length === 0 || this.draft.actions.length === 0) {
              console.error('Validation: Must have at least 1 condition and 1 action');
              return;
            }
            
            let scene: SceneCardState = {
              id: Date.now().toString(),
              name: this.draft.name,
              icon: this.draft.icon,
              description: '自定义自动化规则',
              enabled: true,
              triggerLabel: this.getConditionLabel(this.draft.conditions[0]),
              triggerTypeLabel: this.draft.conditions[0].type === 'time' ? '定时' : '设备状态',
              actions: this.draft.actions.map(a => this.getActionLabel(a)),
              repeatLabel: '执行一次'
            };
            
            this.onSave(scene);
          })
      }
      .width('100%')
      .height(56)
      .padding({ left: 16, right: 16 })


      Scroll() {
        Column({ space: 24 }) {
          // Name Input
          Row({ space: 16 }) {
            Row() {
              AppSymbol({ name: this.draft.icon || 'auto_awesome', glyphSize: 24, color: COLOR_PRIMARY })
            }
            .width(56)
            .height(56)
            .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
            .borderRadius(16)
            .justifyContent(FlexAlign.Center)
            .onClick(() => { this.showIconPicker = true; })
            .bindSheet($$this.showIconPicker, this.IconPickerSheet(), {
              height: 340,
              dragBar: true,
              backgroundColor: COLOR_SURFACE_CONTAINER_HIGH
            })

            TextInput({ placeholder: '自动化名称', text: this.draft.name })
              .onChange((value: string) => {
                this.draft.name = value;
              })
              .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
              .borderRadius(16)
              .height(56)
              .layoutWeight(1)
          }
          .width('100%')

          // Conditions
          Column({ space: 12 }) {
            Text('如果...')
              .fontSize(16)
              .fontWeight(FontWeight.Bold)
              .fontColor(COLOR_ON_SURFACE)
            
            ForEach(this.draft.conditions, (cond: ConditionDraft, index: number) => {
              Row() {
                Text(this.getConditionLabel(cond))
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
                .onClick(() => {
                  let newCond = [...this.draft.conditions];
                  newCond.splice(index, 1);
                  this.draft.conditions = newCond;
                })
              }
              .width('100%')
              .padding({ left: 20, right: 12, top: 12, bottom: 12 })
              .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
              .borderRadius(16)
            })
            
            Button('+ 添加条件', { type: ButtonType.Normal })
              .width('100%')
              .height(48)
              .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
              .fontColor(COLOR_PRIMARY)
              .fontSize(15)
              .fontWeight(FontWeight.Medium)
              .borderRadius(16)
              .clickEffect({ level: ClickEffectLevel.LIGHT, scale: 0.98 })
              .onClick(() => {
                this.showConditionSheet = true;
              })
              .bindSheet($$this.showConditionSheet, this.ConditionSheetBuilder(), { height: SheetSize.MEDIUM })
          }
          .width('100%')
          .alignItems(HorizontalAlign.Start)

          // Actions
          Column({ space: 12 }) {
            Text('就执行...')
              .fontSize(16)
              .fontWeight(FontWeight.Bold)
              .fontColor(COLOR_ON_SURFACE)
            
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
                .onClick(() => {
                  let newAct = [...this.draft.actions];
                  newAct.splice(index, 1);
                  this.draft.actions = newAct;
                })
              }
              .width('100%')
              .padding({ left: 20, right: 12, top: 12, bottom: 12 })
              .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
              .borderRadius(16)
            })
            
            Button('+ 添加动作', { type: ButtonType.Normal })
              .width('100%')
              .height(48)
              .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
              .fontColor(COLOR_PRIMARY)
              .fontSize(15)
              .fontWeight(FontWeight.Medium)
              .borderRadius(16)
              .clickEffect({ level: ClickEffectLevel.LIGHT, scale: 0.98 })
              .onClick(() => {
                this.showActionSheet = true;
              })
              .bindSheet($$this.showActionSheet, this.ActionSheetBuilder(), { height: SheetSize.MEDIUM })
          }
          .width('100%')
          .alignItems(HorizontalAlign.Start)
        }
        .padding(16)
        .width('100%')
      }
      .align(Alignment.Top)
      .layoutWeight(1)
    }
    .width('100%')
    .height('100%')
    .backgroundColor(COLOR_SURFACE)
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
