import { ActionDraft, DevicePanelState, SceneChipState } from '../model/page-view-state';
import {
  buildScenePayloadDraft,
  createEmptySceneDraft,
  mapSceneCardToDraft,
  SceneDraftData,
} from '../model/scene-editor-mappers';
import { AppSymbol } from '../components/AppSymbol';
import { ActionPickerSheet } from '../components/ActionPickerSheet';
import {
  COLOR_ON_SURFACE,
  COLOR_OUTLINE_VARIANT,
  COLOR_PRIMARY,
  COLOR_SURFACE,
  COLOR_SURFACE_CONTAINER_HIGH,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';
import { AppStateSnapshot } from '../model/app-state-snapshot';
import { DEVICE_CAPABILITIES, DeviceCommandConfig } from '../model/automation-capabilities';
import { ScenePayloadDraft } from '../services/device-api';

@Component
export struct SceneEditorView {
  @Prop appState: AppStateSnapshot;
  @Prop editingSceneId: string;
  @State draft: SceneDraftData = createEmptySceneDraft();
  @State showActionSheet: boolean = false;
  @State showIconPicker: boolean = false;
  @State isLoading: boolean = false;

  onCancel: () => void = () => {};
  onSave: (payload: ScenePayloadDraft) => Promise<void> | void = () => {};

  aboutToAppear() {
    if (this.editingSceneId) {
      this.loadScene();
    }
  }

  loadScene() {
    this.isLoading = true;
    const scene = this.appState.scenes.items.find((item) => item.id === this.editingSceneId);
    if (scene) {
      this.draft = mapSceneCardToDraft(scene);
    }
    this.isLoading = false;
  }

  getActionLabel(action: ActionDraft): string {
    if (action.type === 'scene') {
      const scene = this.appState.home.quickScenes.find((item: SceneChipState) => item.id === action.sceneId);
      return scene ? `Run scene: ${scene.label}` : 'Unknown scene';
    }
    if (action.type === 'device') {
      const device = this.appState.home.devices.find((item: DevicePanelState) => item.id === action.deviceId);
      if (!device) {
        return 'Unknown device';
      }

      const parts = (action.command || '').split(':');
      const commandName = parts[0];
      const commandValue = parts.length > 1 ? parts[1] : '';
      const capability = DEVICE_CAPABILITIES[device.kind]?.actions?.find(
        (item: DeviceCommandConfig) => item.command === commandName,
      );
      const commandLabel = capability ? capability.label : commandName;
      const valueLabel = commandValue === 'true'
        ? 'On'
        : (commandValue === 'false' ? 'Off' : commandValue);
      return `${device.roomName} ${device.name} ${commandLabel} ${valueLabel}`;
    }
    return 'Unknown action';
  }

  @Builder
  IconPickerSheet() {
    Column() {
      Text('Select icon')
        .fontSize(20)
        .fontWeight(FontWeight.Bold)
        .fontColor(COLOR_ON_SURFACE)
        .padding({ top: 24, bottom: 24 })

      Flex({ wrap: FlexWrap.Wrap, justifyContent: FlexAlign.Start }) {
        ForEach(
          ['auto_awesome', 'home', 'bedtime', 'movie', 'lightbulb', 'ac_unit', 'lock', 'videocam', 'water_drop', 'power_settings_new'],
          (icon: string) => {
            Row() {
              AppSymbol({
                name: icon,
                glyphSize: 28,
                color: this.draft.icon === icon ? COLOR_PRIMARY : COLOR_ON_SURFACE,
              })
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
          },
          (icon: string) => icon,
        )
      }
      .padding({ left: 16, right: 16 })
    }
    .width('100%')
    .height('100%')
  }

  build() {
    Column() {
      Row() {
        Text('Cancel')
          .fontSize(16)
          .fontColor(COLOR_TEXT_MUTED)
          .onClick(() => {
            this.onCancel();
          })
        Text(this.editingSceneId ? 'Edit Scene' : 'New Scene')
          .fontSize(18)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_ON_SURFACE)
          .layoutWeight(1)
          .textAlign(TextAlign.Center)
        Text('Save')
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

            const payload = buildScenePayloadDraft(
              this.draft,
              this.draft.actions.map((action: ActionDraft) => this.getActionLabel(action)),
            );
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
            Row({ space: 16 }) {
              Row() {
                AppSymbol({ name: this.draft.icon || 'auto_awesome', glyphSize: 24, color: COLOR_PRIMARY })
              }
              .width(56)
              .height(56)
              .backgroundColor(COLOR_PRIMARY + '12')
              .borderRadius(16)
              .justifyContent(FlexAlign.Center)
              .onClick(() => {
                this.showIconPicker = true;
              })
              .bindSheet($$this.showIconPicker, this.IconPickerSheet(), {
                height: 340,
                dragBar: true,
                backgroundColor: COLOR_SURFACE_CONTAINER_HIGH,
              })

              TextInput({ placeholder: 'Scene name', text: this.draft.name })
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
              Text('Actions')
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

                Button('+ Add action', { type: ButtonType.Normal })
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
      },
    })
  }
}
