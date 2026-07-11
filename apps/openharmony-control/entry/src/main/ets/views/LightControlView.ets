import { AppStateSnapshot } from '../model/app-state-snapshot';
import { DevicePanelState, HomeDeviceCardState, HomeViewState } from '../model/page-view-state';
import { AppController } from '../controllers/AppController';
import { AppSymbol } from '../components/AppSymbol';
import { DeviceNoteBanner } from '../components/DeviceNoteBanner';
import {
  COLOR_PRIMARY,
  COLOR_ON_SURFACE,
  COLOR_SECONDARY,
  COLOR_SURFACE_CONTAINER_LOW,
  COLOR_SURFACE_CONTAINER_HIGH,
  COLOR_OUTLINE_VARIANT,
  COLOR_ON_PRIMARY,
} from '../theme/smart-home-theme';

@Component
export struct LightControlView {
  @Prop deviceId: string;
  @ObjectLink appState: AppStateSnapshot;
  @ObjectLink home: HomeViewState;
  @Consume('controller') controller: AppController;

  @State colorTemp: number = 4000;

  private getDevice(): HomeDeviceCardState | undefined {
    for (const room of this.home.rooms) {
      const device = room.devices.find((item) => item.id === this.deviceId);
      if (device !== undefined) {
        return device;
      }
    }
    return undefined;
  }

  private getDevicePanel(): DevicePanelState | undefined {
    return this.appState.home.devices.find((device: DevicePanelState) => device.id === this.deviceId);
  }

  private getGradientColor(): string {
    const device = this.getDevice();
    if (device === undefined || !device.power) {
      return '#00000000';
    }
    if (this.colorTemp < 3500) {
      return '#26FF9800';
    }
    if (this.colorTemp > 5000) {
      return '#262196F3';
    }
    return '#1AFFFFFF';
  }

  build() {
    Column() {
      if (!this.getDevice()) {
        Column() {
          Text('Device not found').fontColor(COLOR_SECONDARY)
        }
        .width('100%')
        .height('100%')
        .justifyContent(FlexAlign.Center)
      } else {
        Stack({ alignContent: Alignment.Top }) {
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
            Column({ space: 8 }) {
              Text(this.getDevice()?.name ?? '')
                .fontSize(28)
                .fontWeight(FontWeight.Bold)
                .fontColor(COLOR_ON_SURFACE)
                .width('100%')

              Text(this.getDevice()?.statusLabel ?? '')
                .fontSize(14)
                .fontColor(COLOR_SECONDARY)
            }
            .alignItems(HorizontalAlign.Start)
            .margin({ top: 16 })

            DeviceNoteBanner({ note: this.getDevicePanel()?.note ?? '' })

            Stack() {
              DataPanel({
                values: [this.getDevice()?.power ? (this.getDevice()?.brightness ?? 0) : 0],
                max: 100,
                type: DataPanelType.Line
              })
                .width(280)
                .height(280)
                .valueColors([this.getDevice()?.power ? COLOR_PRIMARY : COLOR_OUTLINE_VARIANT])
                .trackBackgroundColor(COLOR_SURFACE_CONTAINER_HIGH)
                .shadow(this.getDevice()?.power
                  ? { radius: 32, color: this.getGradientColor(), offsetY: 0 }
                  : { radius: 0 })
                .animation({ duration: 400, curve: Curve.EaseOut })

              Column({ space: 8 }) {
                AppSymbol({
                  name: 'lightbulb',
                  glyphSize: 32,
                  color: this.getDevice()?.power ? COLOR_PRIMARY : COLOR_SECONDARY
                })
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

            Row({ space: 16 }) {
              Column() {
                AppSymbol({
                  name: 'power_settings_new',
                  glyphSize: 32,
                  color: this.getDevice()?.power ? COLOR_ON_PRIMARY : COLOR_SECONDARY
                })
              }
              .width(76)
              .height(76)
              .borderRadius(38)
              .backgroundColor(this.getDevice()?.power ? COLOR_PRIMARY : COLOR_SURFACE_CONTAINER_HIGH)
              .justifyContent(FlexAlign.Center)
              .shadow(this.getDevice()?.power
                ? { radius: 20, color: COLOR_PRIMARY + '66', offsetY: 8 }
                : { radius: 0, color: '#0000' })
              .animation({ duration: 300 })
              .onClick(() => {
                const device = this.getDevice();
                if (device !== undefined) {
                  this.controller.handleHomeTogglePower(this.appState, device.id, !device.power);
                }
              })

              Row() {
                AppSymbol({ name: 'brightness_low', glyphSize: 20, color: COLOR_SECONDARY })
                Slider({ value: this.getDevice()?.brightness ?? 0, min: 1, max: 100, style: SliderStyle.OutSet })
                  .layoutWeight(1)
                  .trackColor(COLOR_OUTLINE_VARIANT)
                  .selectedColor(COLOR_PRIMARY)
                  .blockColor(this.getDevice()?.power ? COLOR_PRIMARY : COLOR_SECONDARY)
                  .onChange((value: number, mode: SliderChangeMode) => {
                    if (mode === SliderChangeMode.End || mode === SliderChangeMode.Click) {
                      const device = this.getDevice();
                      if (device !== undefined) {
                        this.controller.handleHomeBrightness(this.appState, device.id, Math.round(value));
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

            Column({ space: 16 }) {
              Row() {
                Text('Color temperature').fontSize(18).fontWeight(FontWeight.Medium).fontColor(COLOR_ON_SURFACE)
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
                  Text('Warm').fontSize(12).fontColor(COLOR_SECONDARY)
                  Blank()
                  Text('Cool').fontSize(12).fontColor(COLOR_SECONDARY)
                }
                .width('100%')
              }
            }
            .padding(24)
            .borderRadius(24)
            .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
            .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '33' })
            .width('100%')

            Column({ space: 16 }) {
              Text('Presets').fontSize(18).fontWeight(FontWeight.Medium).fontColor(COLOR_ON_SURFACE)
              GridRow({ columns: 2, gutter: 12 }) {
                GridCol() { this.PresetCard('psychology', 'Focus', 'Cool - 100%', this.colorTemp >= 5000 && (this.getDevice()?.brightness ?? 0) > 80 && (this.getDevice()?.power ?? false)) }
                GridCol() { this.PresetCard('self_care', 'Relax', 'Warm - 60%', this.colorTemp < 3500 && (this.getDevice()?.brightness ?? 0) <= 70 && (this.getDevice()?.power ?? false)) }
                GridCol() { this.PresetCard('menu_book', 'Read', 'Neutral - 80%', this.colorTemp >= 3500 && this.colorTemp < 5000 && (this.getDevice()?.brightness ?? 0) > 70 && (this.getDevice()?.power ?? false)) }
                GridCol() { this.PresetCard('bedtime', 'Night', 'Amber - 10%', this.colorTemp <= 2500 && (this.getDevice()?.brightness ?? 0) <= 20 && (this.getDevice()?.power ?? false)) }
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
      if (title === 'Focus') {
        this.colorTemp = 6000;
        this.controller.handleHomeBrightness(this.appState, this.deviceId, 100);
      } else if (title === 'Relax') {
        this.colorTemp = 3000;
        this.controller.handleHomeBrightness(this.appState, this.deviceId, 60);
      } else if (title === 'Read') {
        this.colorTemp = 4000;
        this.controller.handleHomeBrightness(this.appState, this.deviceId, 80);
      } else if (title === 'Night') {
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
