import { ClimateModeState, ClimateUsageBarState, ClimateViewState } from '../model/page-view-state';
import { AppSymbol } from '../components/AppSymbol';
import {
  COLOR_BG,
  COLOR_ON_SURFACE,
  COLOR_OUTLINE_VARIANT,
  COLOR_PRIMARY,
  COLOR_SURFACE_CONTAINER_HIGH,
  COLOR_SURFACE_CONTAINER_LOW,
  COLOR_SURFACE_CONTAINER_LOWEST,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';

@Component
struct ClimateModeButton {
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
    .onClick(() => this.onTap())
  }
}

@Component
export struct ClimateView {
  @Prop state: ClimateViewState;
  onBack: () => void = () => {};
  onSelectMode: (mode: string) => void = () => {};
  onAdjustTarget: (delta: number) => void = () => {};
  onPowerToggle: () => void = () => {};

  build() {
    Column({ space: 0 }) {
      Row() {
        Row({ space: 14 }) {
          Row() {
            AppSymbol({ name: 'arrow_back', glyphSize: 24, color: COLOR_PRIMARY })
          }
          .width(44)
          .height(44)
          .borderRadius(22)
          .justifyContent(FlexAlign.Center)
          .onClick(() => this.onBack())

          Column({ space: 2 }) {
            Text('OmniHome')
              .fontSize(10)
              .fontWeight(FontWeight.Bold)
              .fontColor(COLOR_PRIMARY + 'CC')
              .letterSpacing(2)
            Text('Climate Control')
              .fontSize(28)
              .fontWeight(FontWeight.Bold)
              .fontColor(COLOR_ON_SURFACE)
              .fontFamily('serif')
          }
          .alignItems(HorizontalAlign.Start)
        }

        Blank()

        Row() {
          AppSymbol({ name: 'more_vert', glyphSize: 20, color: COLOR_TEXT_MUTED })
        }
        .width(40)
        .height(40)
        .borderRadius(20)
        .justifyContent(FlexAlign.Center)
      }
      .width('100%')
      .padding({ bottom: 24 })

      Row() {
        Column({ space: 2 }) {
          Text(this.state.roomLabel)
            .fontSize(12)
            .fontWeight(FontWeight.Bold)
            .fontColor(COLOR_TEXT_MUTED)
            .letterSpacing(1.5)
          Row({ space: 6 }) {
            Text(`${this.state.indoorTemperature}\u00B0`)
              .fontSize(64)
              .fontWeight(FontWeight.Medium)
              .fontColor(COLOR_ON_SURFACE)
              .fontFamily('serif')
            Text('Indoor')
              .fontSize(22)
              .fontColor(COLOR_TEXT_MUTED)
          }
        }
        .alignItems(HorizontalAlign.Start)
        .layoutWeight(1)

        Column({ space: 6 }) {
          Row({ space: 4 }) {
            AppSymbol({ name: 'water_drop', glyphSize: 14, color: COLOR_TEXT_MUTED })
            Text('Humidity')
              .fontSize(12)
              .fontWeight(FontWeight.Bold)
              .fontColor(COLOR_TEXT_MUTED)
              .letterSpacing(1.2)
          }
          .justifyContent(FlexAlign.End)
          .width('100%')

          Text(`${this.state.humidity}%`)
            .fontSize(34)
            .fontWeight(FontWeight.Medium)
            .fontColor(COLOR_ON_SURFACE)
            .fontFamily('serif')
        }
        .alignItems(HorizontalAlign.End)
      }
      .width('100%')
      .margin({ bottom: 28 })

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
          .backgroundColor(COLOR_PRIMARY + '14')

        Row()
          .width(240)
          .height(240)
          .borderRadius(120)
          .backgroundColor(COLOR_PRIMARY)

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
              .onClick(() => this.onAdjustTarget(-1))
            Text(`Current ${this.state.currentTemperature}\u00B0`)
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
              .onClick(() => this.onAdjustTarget(1))
          }
          .justifyContent(FlexAlign.Center)

          Text(`${this.state.targetTemperature}\u00B0`)
            .fontSize(62)
            .fontWeight(FontWeight.Bold)
            .fontColor(COLOR_PRIMARY)
            .fontFamily('serif')

          Text('Target')
            .fontSize(11)
            .fontWeight(FontWeight.Bold)
            .fontColor(COLOR_TEXT_MUTED)
            .letterSpacing(1.6)

          Row({ space: 6 }) {
            AppSymbol({
              name: this.state.modeLabel === 'Heat' ? 'mode_heat' : 'thermostat',
              glyphSize: 16,
              color: COLOR_PRIMARY,
            })
            Text(this.state.modeLabel)
              .fontSize(12)
              .fontWeight(FontWeight.Bold)
              .fontColor(COLOR_PRIMARY)
              .letterSpacing(1.2)
          }
          .justifyContent(FlexAlign.Center)

          Row() {
            AppSymbol({ name: 'power_settings_new', glyphSize: 18, color: COLOR_TEXT_MUTED })
          }
          .width(40)
          .height(40)
          .borderRadius(20)
          .backgroundColor(COLOR_SURFACE_CONTAINER_HIGH)
          .justifyContent(FlexAlign.Center)
          .onClick(() => this.onPowerToggle())
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
          .backgroundColor(COLOR_PRIMARY)
          .border({ width: 3, color: COLOR_SURFACE_CONTAINER_LOWEST })
          .position({ x: '71%', y: '12%' })
      }
      .width('100%')
      .height(340)
      .margin({ bottom: 18 })

      Text(this.state.statusLabel)
        .fontSize(14)
        .fontStyle(FontStyle.Italic)
        .fontWeight(FontWeight.Medium)
        .fontColor(COLOR_TEXT_MUTED)
        .width('100%')
        .textAlign(TextAlign.Center)
        .margin({ bottom: 28 })

      Row({ space: 8 }) {
        ForEach(this.state.modes, (mode: ClimateModeState) => {
          ClimateModeButton({
            mode,
            onTap: () => this.onSelectMode(mode.id),
          })
        }, (mode: ClimateModeState) => mode.id)
      }
      .padding(8)
      .borderRadius(24)
      .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
      .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '4D' })
      .shadow({ radius: 12, color: '#3A302A08', offsetX: 0, offsetY: 4 })
      .width('100%')
      .margin({ bottom: 28 })

      Column({ space: 16 }) {
        Row() {
          Text('Weekly Usage')
            .fontSize(22)
            .fontWeight(FontWeight.Bold)
            .fontColor(COLOR_ON_SURFACE)
            .fontFamily('serif')
            .layoutWeight(1)
          Text(this.state.totalUsageLabel)
            .fontSize(13)
            .fontWeight(FontWeight.Bold)
            .fontColor(COLOR_TEXT_MUTED)
        }
        .width('100%')

        Row({ space: 10 }) {
          ForEach(this.state.usageBars, (bar: ClimateUsageBarState) => {
            Column({ space: 10 }) {
              Blank()
                .layoutWeight(1)
              Row()
                .width('100%')
                .height(Math.max(24, Math.round(bar.value * 88)))
                .borderRadius(6)
                .backgroundColor(bar.active ? COLOR_PRIMARY : COLOR_SURFACE_CONTAINER_HIGH)
              Text(bar.dayLabel)
                .fontSize(12)
                .fontWeight(FontWeight.Bold)
                .fontColor(bar.active ? COLOR_PRIMARY : COLOR_TEXT_MUTED)
            }
            .layoutWeight(1)
            .height(130)
            .justifyContent(FlexAlign.End)
            .alignItems(HorizontalAlign.Center)
          }, (bar: ClimateUsageBarState) => bar.dayLabel)
        }
        .width('100%')
        .height(140)
      }
      .padding(24)
      .borderRadius(24)
      .backgroundColor(COLOR_SURFACE_CONTAINER_LOWEST)
      .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' })
      .shadow({ radius: 18, color: '#3A302A08', offsetX: 0, offsetY: 4 })
      .width('100%')

      if (this.state.feedback.length > 0) {
        Text(this.state.feedback)
          .fontSize(13)
          .fontColor(COLOR_PRIMARY)
          .padding(12)
          .borderRadius(12)
          .backgroundColor('#FBE8D8')
          .width('100%')
          .margin({ top: 18 })
      }
    }
    .width('100%')
    .alignItems(HorizontalAlign.Start)
  }
}
