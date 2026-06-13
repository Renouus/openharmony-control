import { ActionDraft, DevicePanelState, SceneChipState } from '../model/page-view-state';
import { AppStateSnapshot } from '../model/app-state';
import { DEVICE_CAPABILITIES, DeviceCommandConfig } from '../model/automation-capabilities';
import { COLOR_PRIMARY, COLOR_TEXT_MUTED } from '../theme/smart-home-theme';

@Component
export struct ActionPickerSheet {
  @Prop appState: AppStateSnapshot;
  onSelect: (action: ActionDraft) => void = () => {};

  @State level: number = 1;
  @State selectedType: 'scene' | 'device' = 'device';
  @State selectedDeviceId: string = '';
  @State commandValue: number = 25; // Default for slider

  build() {
    Column({ space: 16 }) {
      if (this.level === 1) {
        this.Level1Builder()
      } else if (this.level === 2 && this.selectedType === 'scene') {
        this.Level2SceneBuilder()
      } else if (this.level === 2 && this.selectedType === 'device') {
        this.Level2DeviceBuilder()
      } else if (this.level === 3) {
        this.Level3CommandBuilder()
      }
    }
    .padding(24)
    .width('100%')
    .alignItems(HorizontalAlign.Start)
  }

  @Builder
  Level1Builder() {
    Text('选择执行动作')
      .fontSize(18)
      .fontWeight(FontWeight.Bold)
    
    List({ space: 10 }) {
      ListItem() {
        Text('执行场景')
          .fontSize(16)
          .padding(16)
          .width('100%')
      }
      .backgroundColor('#F5F5F5')
      .borderRadius(8)
      .onClick(() => {
        this.selectedType = 'scene';
        this.level = 2;
      })
      
      ListItem() {
        Text('控制设备')
          .fontSize(16)
          .padding(16)
          .width('100%')
      }
      .backgroundColor('#F5F5F5')
      .borderRadius(8)
      .onClick(() => {
        this.selectedType = 'device';
        this.level = 2;
      })
    }
  }

  @Builder
  Level2SceneBuilder() {
    Row() {
      Text('返回')
        .fontColor(COLOR_PRIMARY)
        .onClick(() => this.level = 1)
      Blank()
      Text('选择场景')
        .fontSize(18)
        .fontWeight(FontWeight.Bold)
      Blank()
      Text('    ')
    }
    .width('100%')

    Scroll() {
      Column({ space: 10 }) {
        ForEach(this.appState.home.quickScenes, (scene: SceneChipState) => {
          ListItem() {
            Row() {
              Text(scene.label).fontSize(16)
            }
            .padding(16)
            .width('100%')
          }
          .backgroundColor('#F5F5F5')
          .borderRadius(8)
          .onClick(() => {
            this.onSelect({ id: Date.now().toString(), type: 'scene', sceneId: scene.id });
          })
        }, (s: SceneChipState) => s.id)
      }
    }
    .height(300)
  }

  @Builder
  Level2DeviceBuilder() {
    Row() {
      Text('返回')
        .fontColor(COLOR_PRIMARY)
        .onClick(() => this.level = 1)
      Blank()
      Text('选择设备')
        .fontSize(18)
        .fontWeight(FontWeight.Bold)
      Blank()
      Text('    ')
    }
    .width('100%')

    Scroll() {
      Column({ space: 10 }) {
        ForEach(this.appState.home.devices, (device: DevicePanelState) => {
          if (DEVICE_CAPABILITIES[device.kind]?.actions?.length > 0) {
            ListItem() {
              Row() {
                Column() {
                  Text(device.name).fontSize(16)
                  Text(device.roomName).fontSize(12).fontColor(COLOR_TEXT_MUTED)
                }
                .alignItems(HorizontalAlign.Start)
              }
              .padding(16)
              .width('100%')
            }
            .backgroundColor('#F5F5F5')
            .borderRadius(8)
            .onClick(() => {
              this.selectedDeviceId = device.id;
              this.level = 3;
            })
          }
        }, (d: DevicePanelState) => d.id)
      }
    }
    .height(300)
  }

  @Builder
  Level3CommandBuilder() {
    Row() {
      Text('返回')
        .fontColor(COLOR_PRIMARY)
        .onClick(() => this.level = 2)
      Blank()
      Text('配置动作')
        .fontSize(18)
        .fontWeight(FontWeight.Bold)
      Blank()
      Text('    ')
    }
    .width('100%')

    if (this.selectedDeviceId) {
      Scroll() {
        Column({ space: 16 }) {
          ForEach(this.appState.home.devices.filter(d => d.id === this.selectedDeviceId), (device: DevicePanelState) => {
            ForEach(DEVICE_CAPABILITIES[device.kind]?.actions || [], (config: DeviceCommandConfig) => {
              if (config.type === 'boolean') {
                Column({ space: 8 }) {
                  Text(config.label).fontSize(16).fontWeight(FontWeight.Medium)
                  Row({ space: 10 }) {
                    Button('开启').onClick(() => {
                      this.onSelect({ id: Date.now().toString(), type: 'device', deviceId: device.id, command: `${config.command}:true` });
                    })
                    Button('关闭').onClick(() => {
                      this.onSelect({ id: Date.now().toString(), type: 'device', deviceId: device.id, command: `${config.command}:false` });
                    })
                  }
                }
                .alignItems(HorizontalAlign.Start)
                .width('100%')
              } else if (config.type === 'number') {
                Column({ space: 8 }) {
                  Text(`${config.label}: ${this.commandValue}`).fontSize(16).fontWeight(FontWeight.Medium)
                  Slider({
                    value: this.commandValue,
                    min: config.range?.[0] || 0,
                    max: config.range?.[1] || 100,
                    step: 1,
                  })
                  .showSteps(true)
                  .onChange((value: number) => {
                    this.commandValue = value;
                  })
                  Button('确定').width('100%').onClick(() => {
                    this.onSelect({ id: Date.now().toString(), type: 'device', deviceId: device.id, command: `${config.command}:${this.commandValue}` });
                  })
                }
                .alignItems(HorizontalAlign.Start)
                .width('100%')
              }
            })
          })
        }
      }
      .height(300)
    }
  }
}
