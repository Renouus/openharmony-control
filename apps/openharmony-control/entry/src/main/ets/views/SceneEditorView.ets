import { ActionDraft, DevicePanelState, SceneChipState } from '../model/page-view-state';
import { AppSymbol } from '../components/AppSymbol';
import { ActionPickerSheet } from '../components/ActionPickerSheet';
import { COLOR_ON_SURFACE, COLOR_SURFACE, COLOR_PRIMARY, COLOR_OUTLINE_VARIANT, COLOR_TEXT_MUTED,
  COLOR_SURFACE_CONTAINER_HIGH } from '../theme/smart-home-theme';
import { AppStateSnapshot } from '../model/app-state-snapshot';
import { DEVICE_CAPABILITIES, DeviceCommandConfig } from '../model/automation-capabilities';
import { ScenePayloadDraft, SceneCommandDraft, SceneTriggerDraft, SceneCommandPayload } from '../services/device-api';
import http from '@ohos.net.http';

interface SceneDraft {
  name: string;
  icon?: string;
  actions: ActionDraft[];
}

@Component
export struct SceneEditorView {
  @Prop appState: AppStateSnapshot;
  @Prop editingSceneId: string;
  @State draft: SceneDraft = { name: '', icon: 'movie', actions: [] };
  @State showActionSheet: boolean = false;
  @State showIconPicker: boolean = false;
  @State isLoading: boolean = false;
  
  onCancel: () => void = () => {};
  onSave: (payload: ScenePayloadDraft) => void = () => {};

  aboutToAppear() {
    if (this.editingSceneId) {
      this.loadScene();
    }
  }

  async loadScene() {
    this.isLoading = true;
    try {
      const client = http.createHttp();
      const response = await client.request(`http://10.0.2.2:3000/api/scenes`, { method: http.RequestMethod.GET });
      if (response.responseCode === 200) {
        const data = JSON.parse(response.result as string) as Record<string, Object>;
        const scenes = data.scenes as Record<string, Object>[];
        const scene = scenes.find((s: Record<string, Object>) => s.id === this.editingSceneId);
        if (scene) {
          this.draft.name = scene.name as string;
          this.draft.icon = (scene.icon as string) || 'movie';
          const commands = (scene.commands as Record<string, Object>[]) || [];
          this.draft.actions = commands.map((cmd: Record<string, Object>) => {
            const payloadValues = Object.values(cmd.payload as Record<string, Object>);
            return {
              id: Date.now().toString() + Math.random().toString(),
              type: 'device',
              deviceId: cmd.deviceId as string,
              command: `${cmd.name}:${payloadValues[0]}`
            } as ActionDraft;
          });
        }
      }
      client.destroy();
    } catch (e) {
      console.error('Failed to load scene', e);
    } finally {
      this.isLoading = false;
    }
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
        Text(this.editingSceneId ? '编辑场景' : '新建场景')
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
            if (this.draft.actions.length === 0) {
              console.error('Validation: Must have at least 1 action');
              return;
            }
            
            // Build backend compatible payload
            let payload = new ScenePayloadDraft();
            payload.name = this.draft.name;
            payload.icon = this.draft.icon;
            payload.enabled = true;
            payload.description = '手动触发场景';
            let trigger = new SceneTriggerDraft();
            trigger.type = 'manual';
            trigger.label = '手动触发';
            payload.trigger = trigger;
            payload.repeat = [];
            payload.actionsLabel = this.draft.actions.map((a: ActionDraft) => this.getActionLabel(a));
            payload.commands = this.draft.actions.map((a: ActionDraft) => {
              let cmdParts = (a.command || '').split(':');
              let cmdName = cmdParts[0];
              let cmdValue = cmdParts.length > 1 ? cmdParts[1] : '';
              
              let payloadObj = new SceneCommandPayload();
              if (cmdName === 'switch') {
                payloadObj.on = cmdValue === 'true';
              } else if (cmdName === 'lock') {
                payloadObj.locked = cmdValue === 'true';
              } else if (cmdName === 'set-target-temperature') {
                payloadObj.targetTemperature = parseInt(cmdValue, 10);
              } else if (cmdName === 'set-brightness') {
                payloadObj.brightness = parseInt(cmdValue, 10);
              }
              
              let cmd = new SceneCommandDraft();
              cmd.deviceId = a.deviceId || '';
              cmd.name = cmdName;
              cmd.payload = payloadObj;
              return cmd;
            });
            
            this.onSave(payload);
          })
      }
      .width('100%')
      .height(56)
      .padding({ left: 16, right: 16 })

      if (this.isLoading) {
        LoadingProgress().width(48).height(48).margin({ top: 100 })
      } else {
        Scroll() {
          Column({ space: 24 }) {
            // Name Input
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

              TextInput({ placeholder: '场景名称', text: this.draft.name })
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

            // Actions
            Column({ space: 12 }) {
              Text('执行...')
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
                      let newAct = [...this.draft.actions];
                      newAct.splice(index, 1);
                      this.draft.actions = newAct;
                    })
                  }
                  .width('100%')
                  .alignItems(VerticalAlign.Center)
                  .padding({ left: 16, right: 12, top: 16, bottom: 16 })
                  
                  if (index < this.draft.actions.length - 1 || this.draft.actions.length > 0) {
                    Divider().color(COLOR_OUTLINE_VARIANT).strokeWidth(0.5).margin({ left: 16, right: 16 })
                  }
                })
                
                Button('+ 添加执行动作', { type: ButtonType.Normal })
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
            }
            .width('100%')
          }
          .width('100%')
          .padding({ left: 24, right: 24, top: 24, bottom: 100 })
        }
        .layoutWeight(1)
        .scrollBar(BarState.Off)
        .align(Alignment.Top)
      }
    }
    .width('100%')
    .height('100%')
    .bindSheet($$this.showActionSheet, this.ActionSheetBuilder(), { height: SheetSize.MEDIUM })
  }

  @Builder
  ActionSheetBuilder() {
    ActionPickerSheet({
      appState: this.appState,
      onSelect: (action: ActionDraft) => {
        this.draft.actions = [...this.draft.actions, action];
        this.showActionSheet = false;
      }
    })
  }
}
