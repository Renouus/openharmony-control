import {
  ClimateModeState,
  DevicePanelState,
  HomeDeviceCardState,
  HomeViewState,
} from '../model/page-view-state';
import { AppStateSnapshot } from '../model/app-state-snapshot';
import { AppController } from '../controllers/AppController';
import { AppSymbol } from '../components/AppSymbol';
import { DeviceNoteBanner } from '../components/DeviceNoteBanner';
import {
  COLOR_BG,
  COLOR_ON_SURFACE,
  COLOR_OUTLINE_VARIANT,
  COLOR_PRIMARY,
  COLOR_PRIMARY_SOFT,
  COLOR_SURFACE_CONTAINER_HIGH,
  COLOR_SURFACE_CONTAINER_LOW,
  COLOR_SURFACE_CONTAINER_LOWEST,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';

@Component
struct ClimateControlModeButton {
  @Prop mode: ClimateModeState;
  onTap: () => void = () => {};

  build() {
    Column({ space: 6 }) {
      AppSymbol({
        name: this.mode.icon,
        glyphSize: 20,
        color: this.mode.active ? '#FFFFFF' : COLOR_TEXT_MUTED,
      })
      Text(this.mode.label)
        .fontSize(12)
        .fontWeight(FontWeight.Bold)
        .fontColor(this.mode.active ? '#FFFFFF' : COLOR_TEXT_MUTED)
    }
    .layoutWeight(1)
    .height(84)
    .justifyContent(FlexAlign.Center)
    .alignItems(HorizontalAlign.Center)
    .borderRadius(18)
    .backgroundColor(this.mode.active ? COLOR_PRIMARY : '#00000000')
    .animation({ duration: 300 })
    .onClick(() => this.onTap())
    .stateStyles({
      pressed: { .opacity(0.7).scale({ x: 0.95, y: 0.95 }) },
      normal: { .opacity(1).scale({ x: 1, y: 1 }) }
    })
  }
}

@Component
export struct ClimateControlView {
  @Prop deviceId: string;
  @ObjectLink appState: AppStateSnapshot;
  @ObjectLink home: HomeViewState;
  @Consume('controller') controller: AppController;

  @State feedback: string = '';

  private getDeviceMode(): string {
    return this.getDevice()?.mode ?? 'auto';
  }

  private getDevice(): HomeDeviceCardState | undefined {
    for (const room of this.home.rooms) {
      const device = room.devices.find((item: HomeDeviceCardState) => item.id === this.deviceId);
      if (device !== undefined) {
        return device;
      }
    }
    return undefined;
  }

  private getDevicePanel(): DevicePanelState | undefined {
    return this.appState.home.devices.find((device: DevicePanelState) => device.id === this.deviceId);
  }

  private buildModes(): ClimateModeState[] {
    const isPowered = this.getDevice()?.power ?? false;
    const deviceMode = this.getDeviceMode();
    const modes: ClimateModeState[] = [];
    const heatMode: ClimateModeState = {
      id: 'heat',
      label: '制热',
      icon: 'mode_heat',
      active: isPowered && deviceMode === 'heat',
    };
    modes.push(heatMode);
    const coolMode: ClimateModeState = {
      id: 'cool',
      label: '制冷',
      icon: 'ac_unit',
      active: isPowered && deviceMode === 'cool',
    };
    modes.push(coolMode);
    const autoMode: ClimateModeState = {
      id: 'auto',
      label: '自动',
      icon: 'autorenew',
      active: isPowered && deviceMode === 'auto',
    };
    modes.push(autoMode);
    return modes;
  }

  private adjustTarget(delta: number): void {
    this.controller.handleClimateTarget(this.appState, this.deviceId, delta)
      .then(() => {})
      .catch(() => {});
  }

  private togglePower(): void {
    this.controller.handleClimatePowerToggle(this.appState, this.deviceId)
      .then(() => {})
      .catch(() => {});
  }

  private selectMode(mode: string): void {
    const isPowered = this.getDevice()?.power ?? false;
    const deviceMode = this.getDeviceMode();
    if (isPowered && deviceMode === mode) {
      this.controller.handleClimateMode(this.appState, this.deviceId, 'off')
        .then(() => {})
        .catch(() => {});
      return;
    }
    this.controller.handleClimateMode(this.appState, this.deviceId, mode)
      .then(() => {})
      .catch(() => {});
  }

  build() {
    Column({ space: 0 }) {
      if (this.getDevice() === undefined) {
        Column({ space: 12 }) {
          AppSymbol({ name: 'thermostat', glyphSize: 32, color: COLOR_TEXT_MUTED })
          Text('设备未找到')
            .fontSize(16)
            .fontColor(COLOR_TEXT_MUTED)
        }
        .width('100%')
        .padding({ top: 60, bottom: 60 })
        .alignItems(HorizontalAlign.Center)
      } else {
        Column({ space: 0 }) {
          Column({ space: 2 }) {
            Text(this.getDevicePanel()?.name ?? this.getDevice()?.name ?? '')
              .fontSize(28)
              .fontWeight(FontWeight.Bold)
              .fontColor(COLOR_ON_SURFACE)
              .fontFamily('serif')
            Text(this.getDevicePanel()?.roomName ?? '')
              .fontSize(12)
              .fontWeight(FontWeight.Bold)
              .fontColor(COLOR_TEXT_MUTED)
              .letterSpacing(1.5)
          }
          .width('100%')
          .alignItems(HorizontalAlign.Start)
          .margin({ bottom: 20 })

          DeviceNoteBanner({ note: this.getDevicePanel()?.note ?? '' })
            .margin({ bottom: 20 })

          Stack({ alignContent: Alignment.Center }) {
            Row()
              .width(320)
              .height(320)
              .borderRadius(160)
              .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '33' })

            Row()
              .width(280)
              .height(280)
              .borderRadius(140)
              .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' })

            Row()
              .width(244)
              .height(244)
              .borderRadius(122)
              .backgroundColor(this.getDevice()?.power === true ? COLOR_PRIMARY + '14' : COLOR_SURFACE_CONTAINER_HIGH)
              .animation({ duration: 400 })

            Row()
              .width(240)
              .height(240)
              .borderRadius(120)
              .backgroundColor(this.getDevice()?.power === true ? COLOR_PRIMARY : COLOR_SURFACE_CONTAINER_HIGH)
              .animation({ duration: 400 })

            Row()
              .width(94)
              .height(94)
              .borderRadius(47)
              .backgroundColor(COLOR_BG)
              .position({ x: '8%', y: '62%' })

            Column({ space: 16 }) {
              Row({ space: 12 }) {
                Button('-')
                  .fontSize(22)
                  .fontColor(COLOR_TEXT_MUTED)
                  .width(40)
                  .height(40)
                  .borderRadius(20)
                  .backgroundColor(COLOR_SURFACE_CONTAINER_HIGH)
                  .onClick(() => this.adjustTarget(-1))
                  .stateStyles({
                    pressed: { .opacity(0.7).scale({ x: 0.9, y: 0.9 }) },
                    normal: { .opacity(1).scale({ x: 1, y: 1 }) }
                  })
                Text('温度调节')
                  .fontSize(11)
                  .fontWeight(FontWeight.Bold)
                  .fontColor(COLOR_TEXT_MUTED)
                  .letterSpacing(1.6)
                Button('+')
                  .fontSize(22)
                  .fontColor(COLOR_TEXT_MUTED)
                  .width(40)
                  .height(40)
                  .borderRadius(20)
                  .backgroundColor(COLOR_SURFACE_CONTAINER_HIGH)
                  .onClick(() => this.adjustTarget(1))
                  .stateStyles({
                    pressed: { .opacity(0.7).scale({ x: 0.9, y: 0.9 }) },
                    normal: { .opacity(1).scale({ x: 1, y: 1 }) }
                  })
              }
              .justifyContent(FlexAlign.Center)

              Text(`${this.getDevice()?.targetTemperature ?? 24}\u00B0`)
                .fontSize(62)
                .fontWeight(FontWeight.Bold)
                .fontColor(COLOR_PRIMARY)
                .fontFamily('serif')

              Text('目标温度')
                .fontSize(11)
                .fontWeight(FontWeight.Bold)
                .fontColor(COLOR_TEXT_MUTED)
                .letterSpacing(1.6)

              Row({ space: 6 }) {
                AppSymbol({
                  name: this.getDevice()?.power === true ? this.getDeviceMode() === 'cool' ? 'ac_unit' : 'mode_heat' : 'thermostat',
                  glyphSize: 16,
                  color: COLOR_PRIMARY,
                })
                Text(this.getDevice()?.power === true ? this.getDeviceMode() === 'cool' ? '制冷中' : this.getDeviceMode() === 'auto' ? '自动运行' : '制热中' : '已关闭')
                  .fontSize(12)
                  .fontWeight(FontWeight.Bold)
                  .fontColor(COLOR_PRIMARY)
                  .letterSpacing(1.2)
              }
              .justifyContent(FlexAlign.Center)

              Row() {
                AppSymbol({
                  name: 'power_settings_new',
                  glyphSize: 18,
                  color: this.getDevice()?.power === true ? '#FFFFFF' : COLOR_TEXT_MUTED,
                })
              }
              .width(40)
              .height(40)
              .borderRadius(20)
              .backgroundColor(this.getDevice()?.power === true ? COLOR_PRIMARY : COLOR_SURFACE_CONTAINER_HIGH)
              .animation({ duration: 300 })
              .justifyContent(FlexAlign.Center)
              .onClick(() => this.togglePower())
              .stateStyles({
                pressed: { .opacity(0.7).scale({ x: 0.9, y: 0.9 }) },
                normal: { .opacity(1).scale({ x: 1, y: 1 }) }
              })
            }
            .width(240)
            .height(240)
            .borderRadius(120)
            .backgroundColor(COLOR_BG)
            .shadow({ radius: 24, color: '#3A302A14', offsetX: 0, offsetY: 6 })
            .border({ width: 10, color: COLOR_BG })
            .alignItems(HorizontalAlign.Center)
            .justifyContent(FlexAlign.Center)

            Row()
              .width(16)
              .height(16)
              .borderRadius(8)
              .backgroundColor(this.getDevice()?.power === true ? COLOR_PRIMARY : COLOR_TEXT_MUTED)
              .animation({ duration: 400 })
              .border({ width: 3, color: COLOR_SURFACE_CONTAINER_LOWEST })
              .position({ x: '71%', y: '12%' })
          }
          .width('100%')
          .height(340)
          .margin({ bottom: 18 })

          Text(this.getDevice()?.statusLabel ?? '')
            .fontSize(14)
            .fontStyle(FontStyle.Italic)
            .fontWeight(FontWeight.Medium)
            .fontColor(COLOR_TEXT_MUTED)
            .width('100%')
            .textAlign(TextAlign.Center)
            .margin({ bottom: 28 })

          Row({ space: 8 }) {
            ForEach(this.buildModes(), (mode: ClimateModeState) => {
              ClimateControlModeButton({
                mode,
                onTap: () => this.selectMode(mode.id),
              })
            }, (mode: ClimateModeState) => mode.id + '_' + mode.active)
          }
          .padding(8)
          .borderRadius(24)
          .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
          .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '4D' })
          .shadow({ radius: 12, color: '#3A302A08', offsetX: 0, offsetY: 4 })
          .width('100%')
          .margin({ bottom: 28 })

          if (this.feedback.length > 0) {
            Text(this.feedback)
              .fontSize(13)
              .fontColor(COLOR_PRIMARY)
              .padding(12)
              .borderRadius(12)
              .backgroundColor(COLOR_PRIMARY_SOFT)
              .width('100%')
              .margin({ top: 4 })
          }
        }
        .width('100%')
        .alignItems(HorizontalAlign.Start)
      }
    }
    .width('100%')
  }
}
