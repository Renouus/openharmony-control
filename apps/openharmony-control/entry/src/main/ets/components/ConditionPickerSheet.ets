import { ConditionDraft, DevicePanelState } from '../model/page-view-state';
import { AppStateSnapshot } from '../model/app-state-snapshot';
import { DEVICE_CAPABILITIES, DevicePropertyConfig } from '../model/automation-capabilities';
import { COLOR_PRIMARY, COLOR_SURFACE, COLOR_TEXT_MUTED } from '../theme/smart-home-theme';

@Component
export struct ConditionPickerSheet {
  @Prop appState: AppStateSnapshot;
  onSelect: (condition: ConditionDraft) => void = () => {};

  @State level: number = 1;
  @State selectedType: 'time' | 'device' = 'device';
  @State selectedDeviceId: string = '';
  @State selectedPropertyConfig: DevicePropertyConfig | null = null;
  @State thresholdValue: number = 25; // Default for slider

  build() {
    Column({ space: 16 }) {
      if (this.level === 1) {
        this.Level1Builder()
      } else if (this.level === 2 && this.selectedType === 'device') {
        this.Level2DeviceBuilder()
      } else if (this.level === 2 && this.selectedType === 'time') {
        this.Level2TimeBuilder()
      } else if (this.level === 3) {
        this.Level3PropertyBuilder()
      }
    }
    .padding(24)
    .width('100%')
    .alignItems(HorizontalAlign.Start)
  }

  @Builder
  Level1Builder() {
    Text('选择触发条件')
      .fontSize(18)
      .fontWeight(FontWeight.Bold)
    
    List({ space: 10 }) {
      ListItem() {
        Text('特定时间')
          .fontSize(16)
          .padding(16)
          .width('100%')
      }
      .backgroundColor('#F5F5F5')
      .borderRadius(8)
      .onClick(() => {
        this.selectedType = 'time';
        this.level = 2;
      })
      
      ListItem() {
        Text('设备状态变化')
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
  Level2TimeBuilder() {
    Row() {
      Text('返回')
        .fontColor(COLOR_PRIMARY)
        .onClick(() => this.level = 1)
      Blank()
      Text('设定时间')
        .fontSize(18)
        .fontWeight(FontWeight.Bold)
      Blank()
      Text('    ') // spacing balance
    }
    .width('100%')

    // Mock TimePicker
    TimePicker({
      selected: new Date()
    })
    .useMilitaryTime(false)
    .onChange((value: TimePickerResult) => {
      // Typically we'd keep this in state, but let's mock the final selection
    })

    Button('完成')
      .width('100%')
      .onClick(() => {
        this.onSelect({ id: Date.now().toString(), type: 'time', time: '08:00' });
      })
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
          if (DEVICE_CAPABILITIES[device.kind]?.conditions?.length > 0) {
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
  Level3PropertyBuilder() {
    Row() {
      Text('返回')
        .fontColor(COLOR_PRIMARY)
        .onClick(() => this.level = 2)
      Blank()
      Text('配置条件')
        .fontSize(18)
        .fontWeight(FontWeight.Bold)
      Blank()
      Text('    ')
    }
    .width('100%')

    // Find the device
    if (this.selectedDeviceId) {
      Scroll() {
        Column({ space: 16 }) {
          // In ArkTS, we cannot put complex expressions in ForEach directly or define local variables.
          // We rely on component state or simple array iteration.
          // Since we need the capabilities for the selected device, we filter appState.home.devices.
          ForEach(this.appState.home.devices.filter((d: DevicePanelState) => d.id === this.selectedDeviceId), (device: DevicePanelState) => {
            ForEach(DEVICE_CAPABILITIES[device.kind]?.conditions || [], (config: DevicePropertyConfig) => {
              if (config.type === 'boolean') {
                Column({ space: 8 }) {
                  Text(config.label).fontSize(16).fontWeight(FontWeight.Medium)
                  Row({ space: 10 }) {
                    Button('开启').onClick(() => {
                      this.onSelect({ id: Date.now().toString(), type: 'device', deviceId: device.id, property: config.property, operator: '==', threshold: 'true' });
                    })
                    Button('关闭').onClick(() => {
                      this.onSelect({ id: Date.now().toString(), type: 'device', deviceId: device.id, property: config.property, operator: '==', threshold: 'false' });
                    })
                  }
                }
                .alignItems(HorizontalAlign.Start)
                .width('100%')
              } else if (config.type === 'number') {
                Column({ space: 8 }) {
                  Text(`${config.label} 大于 ${this.thresholdValue}`).fontSize(16).fontWeight(FontWeight.Medium)
                  Slider({
                    value: this.thresholdValue,
                    min: config.range?.[0] || 0,
                    max: config.range?.[1] || 100,
                    step: 1,
                  })
                  .showSteps(true)
                  .onChange((value: number) => {
                    this.thresholdValue = value;
                  })
                  Button('确定').width('100%').onClick(() => {
                    this.onSelect({ id: Date.now().toString(), type: 'device', deviceId: device.id, property: config.property, operator: '>', threshold: this.thresholdValue.toString() });
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
