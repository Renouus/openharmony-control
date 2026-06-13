import { AppStateSnapshot } from '../model/app-state-snapshot';
import { HomeDeviceCardState, HomeViewState } from '../model/page-view-state';
import { AppController } from '../controllers/AppController';
import { AppSymbol } from '../components/AppSymbol';
import {
  COLOR_BG,
  COLOR_PRIMARY,
  COLOR_ON_SURFACE,
  COLOR_SECONDARY,
  COLOR_SURFACE_CONTAINER_LOW,
  COLOR_SURFACE_CONTAINER_HIGH,
  COLOR_OUTLINE_VARIANT,
  COLOR_ON_PRIMARY,
  COLOR_PRIMARY_SOFT
} from '../theme/smart-home-theme';

@Component
export struct LightControlView {
  @Prop deviceId: string;
  @ObjectLink appState: AppStateSnapshot;
  @Consume('controller') controller: AppController;

  @State colorTemp: number = 4000; // 模拟色温，范围 2000K 到 6500K

  private getDevice(): HomeDeviceCardState | undefined {
    for (const room of this.appState.home.rooms) {
      const dev = room.devices.find(d => d.id === this.deviceId);
      if (dev) return dev;
    }
    return undefined;
  }

  private getGradientColor(): string {
    const dev = this.getDevice();
    if (!dev || !dev.power) return '#00000000'; // 关闭时无光晕
    
    if (this.colorTemp < 3500) {
      return '#26FF9800'; // 暖光光晕
    } else if (this.colorTemp > 5000) {
      return '#262196F3'; // 冷光光晕
    } else {
      return '#1AFFFFFF'; // 中性光晕
    }
  }

  build() {
    Column() {
      if (!this.getDevice()) {
        Column() { 
          Text('未找到该设备').fontColor(COLOR_SECONDARY) 
        }.width('100%').height('100%').justifyContent(FlexAlign.Center)
      } else {
        Stack({ alignContent: Alignment.Top }) {
          // 背景环境光晕
          Row()
            .width('100%')
            .height(350)
            .linearGradient({
              direction: GradientDirection.Bottom,
              colors: [
                [this.getGradientColor(), 0.0],
                ['#00000000', 1.0]
              ]
            })
            .animation({ duration: 600, curve: Curve.EaseInOut })

          Column({ space: 32 }) {
            // 头部设备信息
            Column({ space: 8 }) {
              Text(this.getDevice()?.name ?? '')
                .fontSize(28)
                .fontWeight(FontWeight.Bold)
                .fontColor(COLOR_ON_SURFACE)
              Text(this.getDevice()?.statusLabel ?? '')
                .fontSize(14)
                .fontColor(COLOR_SECONDARY)
            }
            .alignItems(HorizontalAlign.Center)
            .margin({ top: 16 })

            // 中央亮度展示区（已优化）
            Stack() {
              DataPanel({ values: [this.getDevice()?.power ? (this.getDevice()?.brightness ?? 0) : 0], max: 100, type: DataPanelType.Line })
                .width(280)
                .height(280)
                .valueColors([this.getDevice()?.power ? COLOR_PRIMARY : COLOR_OUTLINE_VARIANT])
                .trackBackgroundColor(COLOR_SURFACE_CONTAINER_HIGH)
                .shadow(this.getDevice()?.power ? { radius: 32, color: this.getGradientColor(), offsetY: 0 } : { radius: 0 })
                .animation({ duration: 400, curve: Curve.EaseOut })
              
              Column({ space: 8 }) {
                AppSymbol({ name: 'lightbulb', glyphSize: 32, color: this.getDevice()?.power ? COLOR_PRIMARY : COLOR_SECONDARY })
                  .animation({ duration: 400 })
                Row({ space: 4 }) {
                  Text(`${this.getDevice()?.power ? (this.getDevice()?.brightness ?? 0) : 0}`)
                    .fontSize(72)
                    .fontWeight(FontWeight.Medium)
                    .letterSpacing(-2)
                    .fontColor(this.getDevice()?.power ? COLOR_ON_SURFACE : COLOR_SECONDARY)
                  Text('%')
                    .fontSize(20)
                    .fontColor(COLOR_SECONDARY)
                    .margin({ top: 30 })
                }
              }
            }

            // 核心控制区（电源 & 亮度）
            Row({ space: 16 }) {
              // 电源开关大按钮
              Column() {
                AppSymbol({ name: 'power_settings_new', glyphSize: 32, color: this.getDevice()?.power ? COLOR_ON_PRIMARY : COLOR_SECONDARY })
              }
              .width(76)
              .height(76)
              .borderRadius(38)
              .backgroundColor(this.getDevice()?.power ? COLOR_PRIMARY : COLOR_SURFACE_CONTAINER_HIGH)
              .justifyContent(FlexAlign.Center)
              .shadow(this.getDevice()?.power ? { radius: 20, color: COLOR_PRIMARY + '66', offsetY: 8 } : { radius: 0, color: '#0000' })
              .animation({ duration: 300 })
              .onClick(() => {
                const dev = this.getDevice();
                if (dev) {
                  this.controller.handleHomeTogglePower(this.appState, dev.id, !dev.power);
                }
              })

              // 亮度滑块胶囊
              Row() {
                AppSymbol({ name: 'brightness_low', glyphSize: 20, color: COLOR_SECONDARY })
                Slider({ value: this.getDevice()?.brightness ?? 0, min: 1, max: 100, style: SliderStyle.OutSet })
                  .layoutWeight(1)
                  .trackColor(COLOR_OUTLINE_VARIANT)
                  .selectedColor(COLOR_PRIMARY)
                  .blockColor(this.getDevice()?.power ? COLOR_PRIMARY : COLOR_SECONDARY)
                  .onChange((value: number, mode: SliderChangeMode) => {
                    if (mode === SliderChangeMode.End || mode === SliderChangeMode.Click) {
                      const dev = this.getDevice();
                      if (dev) {
                        this.controller.handleHomeBrightness(this.appState, dev.id, Math.round(value));
                      }
                    }
                  })
                AppSymbol({ name: 'brightness_high', glyphSize: 20, color: COLOR_SECONDARY })
              }
              .layoutWeight(1)
              .height(76)
              .padding({ left: 20, right: 20 })
              .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
              .borderRadius(38)
              .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '4D' })
            }
            .width('100%')

            // 色温调节卡片
            Column({ space: 16 }) {
              Row() {
                Text('色温').fontSize(18).fontWeight(FontWeight.Medium).fontColor(COLOR_ON_SURFACE)
                Blank()
                Text(`${this.colorTemp}K`).fontSize(14).fontColor(COLOR_SECONDARY)
              }
              .width('100%')

              Column({ space: 8 }) {
                Slider({ value: this.colorTemp, min: 2000, max: 6500, style: SliderStyle.OutSet })
                  .trackColor(COLOR_OUTLINE_VARIANT)
                  .selectedColor(COLOR_PRIMARY)
                  .blockColor(COLOR_PRIMARY)
                  .onChange((value: number) => {
                    this.colorTemp = Math.round(value);
                  })
                Row() {
                  Text('暖光').fontSize(12).fontColor(COLOR_SECONDARY)
                  Blank()
                  Text('冷光').fontSize(12).fontColor(COLOR_SECONDARY)
                }
                .width('100%')
              }
            }
            .padding(24)
            .borderRadius(24)
            .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
            .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '33' })
            .width('100%')
            
            // 预设场景网格
            Column({ space: 16 }) {
              Text('预设场景').fontSize(18).fontWeight(FontWeight.Medium).fontColor(COLOR_ON_SURFACE)
              GridRow({ columns: 2, gutter: 12 }) {
                GridCol() { this.PresetCard('psychology', '专注', '冷光 • 100%', this.colorTemp >= 5000 && (this.getDevice()?.brightness ?? 0) > 80 && (this.getDevice()?.power ?? false)) }
                GridCol() { this.PresetCard('self_care', '放松', '暖光 • 60%', this.colorTemp < 3500 && (this.getDevice()?.brightness ?? 0) <= 70 && (this.getDevice()?.power ?? false)) }
                GridCol() { this.PresetCard('menu_book', '阅读', '中性 • 80%', this.colorTemp >= 3500 && this.colorTemp < 5000 && (this.getDevice()?.brightness ?? 0) > 70 && (this.getDevice()?.power ?? false)) }
                GridCol() { this.PresetCard('bedtime', '夜间', '极暖 • 10%', this.colorTemp <= 2500 && (this.getDevice()?.brightness ?? 0) <= 20 && (this.getDevice()?.power ?? false)) }
              }
            }
            .alignItems(HorizontalAlign.Start)
            .width('100%')

          }
          .width('100%')
        }
        .width('100%')
      }
    }
    .width('100%')
  }

  @Builder
  PresetCard(icon: string, title: string, subtitle: string, isActive: boolean) {
    Column({ space: 12 }) {
      AppSymbol({ name: icon, glyphSize: 24, color: isActive ? COLOR_ON_PRIMARY : COLOR_SECONDARY })
      Column({ space: 4 }) {
        Text(title).fontSize(16).fontWeight(FontWeight.Medium).fontColor(isActive ? COLOR_ON_PRIMARY : COLOR_ON_SURFACE)
        Text(subtitle).fontSize(12).fontColor(isActive ? COLOR_ON_PRIMARY + 'CC' : COLOR_SECONDARY)
      }
      .alignItems(HorizontalAlign.Start)
    }
    .alignItems(HorizontalAlign.Start)
    .padding(16)
    .borderRadius(20)
    .backgroundColor(isActive ? COLOR_PRIMARY : COLOR_SURFACE_CONTAINER_LOW)
    .border({ width: 1, color: isActive ? COLOR_PRIMARY : COLOR_OUTLINE_VARIANT + '33' })
    .width('100%')
    .onClick(() => {
      if (title === '专注') {
        this.colorTemp = 6000;
        this.controller.handleHomeBrightness(this.appState, this.deviceId, 100);
      } else if (title === '放松') {
        this.colorTemp = 3000;
        this.controller.handleHomeBrightness(this.appState, this.deviceId, 60);
      } else if (title === '阅读') {
        this.colorTemp = 4000;
        this.controller.handleHomeBrightness(this.appState, this.deviceId, 80);
      } else if (title === '夜间') {
        this.colorTemp = 2000;
        this.controller.handleHomeBrightness(this.appState, this.deviceId, 10);
      }
      if (!this.getDevice()?.power) {
        this.controller.handleHomeTogglePower(this.appState, this.deviceId, true);
      }
    })
    .animation({ duration: 300 })
  }
}
