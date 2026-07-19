import { ConditionDraft, DevicePanelState, SensorDeviceCardState } from '../model/page-view-state';
import { AppStateSnapshot } from '../model/app-state-snapshot';
import { DEVICE_CAPABILITIES, DevicePropertyConfig, isSensorKind } from '../model/automation-capabilities';
import { AppSymbol } from '../components/AppSymbol';
import {
  COLOR_ON_PRIMARY,
  COLOR_ON_SURFACE,
  COLOR_OUTLINE_VARIANT,
  COLOR_PRIMARY,
  COLOR_PRIMARY_SOFT,
  COLOR_SURFACE,
  COLOR_SURFACE_CONTAINER,
  COLOR_SURFACE_CONTAINER_HIGH,
  COLOR_SURFACE_CONTAINER_LOW,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';

/**
 * 比较运算符选项。
 *
 * boolean 类型属性仅使用 '=='；number 类型属性支持完整 5 种运算符。
 * 与后端 RuleEvaluator.compare 中实现的运算符语义保持一致。
 */
interface OperatorOption {
  value: string;
  label: string;
}

const NUMBER_OPERATORS: OperatorOption[] = [
  { value: '>', label: '大于' },
  { value: '<', label: '小于' },
  { value: '==', label: '等于' },
  { value: '>=', label: '大于等于' },
  { value: '<=', label: '小于等于' },
];

// ── 模块级工具函数（供 ConditionPickerSheet 与 SensorNumberConditionCard 共用） ──

function iconForProperty(property: string): string {
  if (property === 'temperature') { return 'mode_heat'; }
  if (property === 'humidity') { return 'water_drop'; }
  if (property === 'illuminance') { return 'wb_sunny'; }
  if (property === 'motionDetected') { return 'directions_run'; }
  if (property === 'contactOpen') { return 'meeting_room'; }
  if (property === 'power') { return 'power_settings_new'; }
  if (property === 'brightness') { return 'lightbulb'; }
  if (property === 'targetTemperature') { return 'thermostat'; }
  if (property === 'locked') { return 'lock'; }
  return 'sensors';
}

function unitForProperty(property: string): string {
  if (property === 'temperature') { return '°C'; }
  if (property === 'humidity') { return '%'; }
  if (property === 'illuminance') { return 'lux'; }
  return '';
}

function stepForProperty(property: string): number {
  if (property === 'temperature') { return 0.5; }
  if (property === 'illuminance') { return 10; }
  return 1;
}

function roundValue(property: string, value: number): number {
  if (property === 'temperature') { return Math.round(value * 2) / 2; }
  return Math.round(value);
}

function defaultThresholdFor(property: string, rangeMin: number, rangeMax: number): number {
  if (property === 'temperature') { return 25; }
  if (property === 'humidity') { return 50; }
  if (property === 'illuminance') { return 500; }
  return Math.round((rangeMin + rangeMax) / 2);
}

function defaultOperatorFor(property: string): string {
  if (property === 'illuminance') { return '<'; }
  return '>';
}

/**
 * number 类型属性的条件配置卡片（独立 @Component）。
 *
 * 关键设计：每个实例维护自己的 @State thresholdValue 和 selectedOperator，
 * 互不干扰。这样在 environment-sensor 同时展示温度和湿度两张卡片时，
 * 用户可以独立设置"温度 < 20"和"湿度 > 70"两个条件，不会出现
 * 调整一张卡片时另一张卡片阈值/运算符跟着变化的"绑定"问题。
 *
 * 默认值在 aboutToAppear 中根据 config.property 初始化：
 * - temperature: 25°C，运算符 '>'
 * - humidity: 50%，运算符 '>'
 * - illuminance: 500 lux，运算符 '<'
 * - 其它: 取范围中值，运算符 '>'
 */
@Component
struct SensorNumberConditionCard {
  @Prop device: DevicePanelState;
  @Prop config: DevicePropertyConfig;
  @Prop selectedType: 'time' | 'device' | 'sensor';
  onSelect: (condition: ConditionDraft) => void = () => {};

  @State thresholdValue: number = 25;
  @State selectedOperator: string = '>';

  aboutToAppear(): void {
    const rangeMin = this.config.range?.[0] ?? 0;
    const rangeMax = this.config.range?.[1] ?? 100;
    this.thresholdValue = defaultThresholdFor(this.config.property, rangeMin, rangeMax);
    this.selectedOperator = defaultOperatorFor(this.config.property);
  }

  build() {
    Column({ space: 12 }) {
      Row() {
        AppSymbol({ name: iconForProperty(this.config.property), glyphSize: 18, color: COLOR_PRIMARY })
        Text(this.config.label)
          .fontSize(16)
          .fontWeight(FontWeight.Medium)
          .margin({ left: 8 })
        Blank()
        Text(this.config.property === 'temperature' ? '温度条件' :
          (this.config.property === 'humidity' ? '湿度条件' :
          (this.config.property === 'illuminance' ? '光照条件' : this.config.label + '条件')))
          .fontSize(11)
          .fontColor(COLOR_TEXT_MUTED)
          .letterSpacing(1.0)
      }
      .width('100%')

      // 运算符选择器（每个卡片独立）
      Row({ space: 8 }) {
        ForEach(NUMBER_OPERATORS, (op: OperatorOption) => {
          Text(op.label)
            .fontSize(13)
            .fontColor(this.selectedOperator === op.value ? COLOR_ON_PRIMARY : COLOR_TEXT_MUTED)
            .padding({ left: 12, right: 12, top: 8, bottom: 8 })
            .borderRadius(16)
            .backgroundColor(this.selectedOperator === op.value ? COLOR_PRIMARY : COLOR_SURFACE_CONTAINER)
            .onClick(() => {
              this.selectedOperator = op.value;
            })
        }, (op: OperatorOption) => op.value)
      }
      .width('100%')

      // 阈值显示与滑块（每个卡片独立）
      Row() {
        Text('阈值')
          .fontSize(13)
          .fontColor(COLOR_TEXT_MUTED)
        Blank()
        Text(`${this.thresholdValue} ${unitForProperty(this.config.property)}`)
          .fontSize(20)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_ON_SURFACE)
      }
      .width('100%')

      Slider({
        value: this.thresholdValue,
        min: this.config.range?.[0] ?? 0,
        max: this.config.range?.[1] ?? 100,
        step: stepForProperty(this.config.property),
      })
      .selectedColor(COLOR_PRIMARY)
      .blockColor(COLOR_PRIMARY)
      .trackColor(COLOR_OUTLINE_VARIANT)
      .showTips(false)
      .onChange((value: number) => {
        this.thresholdValue = roundValue(this.config.property, value);
      })

      Row() {
        Text(`${this.config.range?.[0] ?? 0}`)
          .fontSize(11)
          .fontColor(COLOR_TEXT_MUTED)
        Blank()
        Text(`${this.config.range?.[1] ?? 100} ${unitForProperty(this.config.property)}`)
          .fontSize(11)
          .fontColor(COLOR_TEXT_MUTED)
      }
      .width('100%')

      Button(`添加${this.config.label}条件`)
        .width('100%')
        .height(44)
        .backgroundColor(COLOR_PRIMARY)
        .fontColor(COLOR_ON_PRIMARY)
        .borderRadius(22)
        .onClick(() => {
          this.onSelect({
            id: Date.now().toString(),
            type: this.selectedType,
            deviceId: this.device.id,
            property: this.config.property,
            operator: this.selectedOperator,
            threshold: this.thresholdValue.toString(),
          });
        })
    }
    .alignItems(HorizontalAlign.Start)
    .width('100%')
    .padding(14)
    .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
    .borderRadius(12)
  }
}

/**
 * 自动化触发条件选择器。
 *
 * 三级导航（与现有 time/device 流程保持一致的用户体验）：
 * - Level 1：选择触发类型（时间 / 设备状态 / 传感器数据）
 * - Level 2：根据类型选择具体设备或时间
 * - Level 3：配置属性 + 运算符 + 阈值
 *
 * 传感器分支（type='sensor'）在 Level 3 为每个可配置属性渲染独立的
 * SensorNumberConditionCard（number 类型）或 BooleanConditionCard（boolean 类型），
 * 每张卡片维护自己的阈值和运算符状态，因此可以独立配置
 * "温度 < 20" 和 "湿度 > 70" 两个条件，分别点击"添加温度条件"、
 * "添加湿度条件"按钮即可把它们加入条件列表。
 *
 * 输出 ConditionDraft.type='sensor'，与 automation-editor-mappers 中
 * inferRuntimeTriggerType 配合映射为后端 'sensor_event' 触发类型。
 */
@Component
export struct ConditionPickerSheet {
  @Prop appState: AppStateSnapshot;
  onSelect: (condition: ConditionDraft) => void = () => {};

  @State level: number = 1;
  @State selectedType: 'time' | 'device' | 'sensor' = 'device';
  @State selectedDeviceId: string = '';
  @State selectedTimeStr: string = '';

  aboutToAppear() {
    let now = new Date();
    let h = now.getHours().toString().padStart(2, '0');
    let m = now.getMinutes().toString().padStart(2, '0');
    this.selectedTimeStr = `${h}:${m}`;
  }

  build() {
    Column({ space: 16 }) {
      if (this.level === 1) {
        this.Level1Builder()
      } else if (this.level === 2 && this.selectedType === 'device') {
        this.Level2DeviceBuilder()
      } else if (this.level === 2 && this.selectedType === 'sensor') {
        this.Level2SensorBuilder()
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
        Row({ space: 12 }) {
          AppSymbol({ name: 'schedule', glyphSize: 20, color: COLOR_PRIMARY })
          Text('特定时间')
            .fontSize(16)
            .layoutWeight(1)
        }
        .padding(16)
        .width('100%')
      }
      .backgroundColor(COLOR_SURFACE_CONTAINER)
      .borderRadius(8)
      .onClick(() => {
        this.selectedType = 'time';
        this.level = 2;
      })

      ListItem() {
        Row({ space: 12 }) {
          AppSymbol({ name: 'devices', glyphSize: 20, color: COLOR_PRIMARY })
          Text('设备状态变化')
            .fontSize(16)
            .layoutWeight(1)
        }
        .padding(16)
        .width('100%')
      }
      .backgroundColor(COLOR_SURFACE_CONTAINER)
      .borderRadius(8)
      .onClick(() => {
        this.selectedType = 'device';
        this.level = 2;
      })

      ListItem() {
        Row({ space: 12 }) {
          AppSymbol({ name: 'sensors', glyphSize: 20, color: COLOR_PRIMARY })
          Column() {
            Text('传感器数据变化')
              .fontSize(16)
            Text('温湿度 · 光照 · 运动 · 门窗')
              .fontSize(11)
              .fontColor(COLOR_TEXT_MUTED)
          }
          .alignItems(HorizontalAlign.Start)
          .layoutWeight(1)
        }
        .padding(16)
        .width('100%')
      }
      .backgroundColor(COLOR_SURFACE_CONTAINER)
      .borderRadius(8)
      .onClick(() => {
        this.selectedType = 'sensor';
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
      Text('    ')
    }
    .width('100%')

    TimePicker({
      selected: new Date()
    })
    .useMilitaryTime(false)
    .textStyle({ color: COLOR_TEXT_MUTED, font: { size: '16vp', weight: FontWeight.Normal } })
    .selectedTextStyle({ color: COLOR_PRIMARY, font: { size: '24vp', weight: FontWeight.Medium } })
    .disappearTextStyle({ color: COLOR_OUTLINE_VARIANT, font: { size: '14vp', weight: FontWeight.Normal } })
    .backgroundColor(Color.Transparent)
    .margin({ top: 16, bottom: 16 })
    .onChange((value: TimePickerResult) => {
      let h = value.hour.toString().padStart(2, '0');
      let m = value.minute.toString().padStart(2, '0');
      this.selectedTimeStr = `${h}:${m}`;
    })

    Button('完成')
      .width('100%')
      .height(48)
      .backgroundColor(COLOR_PRIMARY)
      .fontColor(COLOR_ON_PRIMARY)
      .borderRadius(24)
      .onClick(() => {
        this.onSelect({ id: Date.now().toString(), type: 'time', time: this.selectedTimeStr });
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
          if (DEVICE_CAPABILITIES[device.kind]?.conditions?.length > 0 && !isSensorKind(device.kind)) {
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
            .backgroundColor(COLOR_SURFACE_CONTAINER)
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
  Level2SensorBuilder() {
    Row() {
      Text('返回')
        .fontColor(COLOR_PRIMARY)
        .onClick(() => this.level = 1)
      Blank()
      Text('选择传感器')
        .fontSize(18)
        .fontWeight(FontWeight.Bold)
      Blank()
      Text('    ')
    }
    .width('100%')

    if (this.appState.sensors.devices.length === 0) {
      Column({ space: 8 }) {
        AppSymbol({ name: 'sensors', glyphSize: 28, color: COLOR_TEXT_MUTED })
        Text('暂无已连接的传感器')
          .fontSize(14)
          .fontColor(COLOR_TEXT_MUTED)
        Text('请先在传感器页面绑定设备')
          .fontSize(12)
          .fontColor(COLOR_TEXT_MUTED)
      }
      .width('100%')
      .padding({ top: 40, bottom: 40 })
      .alignItems(HorizontalAlign.Center)
    } else {
      Scroll() {
        Column({ space: 10 }) {
          ForEach(this.appState.sensors.devices, (device: SensorDeviceCardState) => {
            ListItem() {
              Row({ space: 12 }) {
                AppSymbol({
                  name: this.sensorIconFor(device.kind),
                  glyphSize: 20,
                  color: COLOR_PRIMARY,
                })
                Column() {
                  Text(device.name).fontSize(16)
                  Text(device.subtitle).fontSize(12).fontColor(COLOR_TEXT_MUTED)
                }
                .alignItems(HorizontalAlign.Start)
                .layoutWeight(1)
                AppSymbol({ name: 'chevron_right', glyphSize: 16, color: COLOR_TEXT_MUTED })
              }
              .padding(16)
              .width('100%')
            }
            .backgroundColor(COLOR_SURFACE_CONTAINER)
            .borderRadius(8)
            .onClick(() => {
              this.selectedDeviceId = device.id;
              this.level = 3;
            })
          }, (d: SensorDeviceCardState) => d.id)
        }
      }
      .height(300)
    }
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

    // 操作提示：告知用户每个属性可独立配置，可分别添加多个条件
    Row({ space: 8 }) {
      AppSymbol({ name: 'info', glyphSize: 14, color: COLOR_PRIMARY })
      Text('每个属性可独立配置，分别点击对应按钮添加条件；多个条件可在上一步选择"满足全部/任一"')
        .fontSize(11)
        .fontColor(COLOR_TEXT_MUTED)
        .layoutWeight(1)
    }
    .width('100%')
    .padding(12)
    .backgroundColor(COLOR_PRIMARY_SOFT)
    .borderRadius(10)

    if (this.selectedDeviceId.length > 0) {
      Scroll() {
        Column({ space: 16 }) {
          ForEach(this.appState.home.devices.filter((d: DevicePanelState) => d.id === this.selectedDeviceId), (device: DevicePanelState) => {
            ForEach(DEVICE_CAPABILITIES[device.kind]?.conditions || [], (config: DevicePropertyConfig) => {
              if (config.type === 'boolean') {
                this.BooleanConditionCard(device, config)
              } else if (config.type === 'number') {
                SensorNumberConditionCard({
                  device,
                  config,
                  selectedType: this.selectedType,
                  onSelect: (condition: ConditionDraft) => this.onSelect(condition),
                })
              }
            }, (config: DevicePropertyConfig) => config.property)
          })
        }
      }
      .height(360)
    }
  }

  @Builder
  BooleanConditionCard(device: DevicePanelState, config: DevicePropertyConfig) {
    Column({ space: 10 }) {
      Row() {
        AppSymbol({ name: iconForProperty(config.property), glyphSize: 18, color: COLOR_PRIMARY })
        Text(config.label)
          .fontSize(16)
          .fontWeight(FontWeight.Medium)
          .margin({ left: 8 })
      }
      .width('100%')

      Row({ space: 10 }) {
        Button('触发时')
          .backgroundColor(COLOR_PRIMARY)
          .fontColor(COLOR_ON_PRIMARY)
          .layoutWeight(1)
          .onClick(() => {
            this.onSelect({
              id: Date.now().toString(),
              type: this.selectedType,
              deviceId: device.id,
              property: config.property,
              operator: '==',
              threshold: 'true',
            });
          })
        Button('恢复时')
          .backgroundColor(COLOR_SURFACE_CONTAINER)
          .fontColor(COLOR_PRIMARY)
          .layoutWeight(1)
          .onClick(() => {
            this.onSelect({
              id: Date.now().toString(),
              type: this.selectedType,
              deviceId: device.id,
              property: config.property,
              operator: '==',
              threshold: 'false',
            });
          })
      }
      .width('100%')
    }
    .alignItems(HorizontalAlign.Start)
    .width('100%')
    .padding(14)
    .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
    .borderRadius(12)
  }

  private sensorIconFor(kind: string): string {
    if (kind === 'environment-sensor') { return 'thermostat'; }
    if (kind === 'motion-sensor') { return 'directions_run'; }
    if (kind === 'light-sensor') { return 'wb_sunny'; }
    if (kind === 'contact-sensor') { return 'meeting_room'; }
    return 'sensors';
  }
}
