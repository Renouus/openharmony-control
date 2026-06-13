import { ClimateModeState, ClimateUsageBarState, ClimateViewState } from '../model/page-view-state';
import { AppStateSnapshot } from '../model/app-state-snapshot';
import { FeatureHeader } from '../components/FeatureHeader';
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
    .animation({ duration: 300 })
    .onClick(() => this.onTap())
    .stateStyles({
      pressed: { .opacity(0.7).scale({ x: 0.95, y: 0.95 }) },
      normal: { .opacity(1).scale({ x: 1, y: 1 }) }
    })
  }
}

@Component
struct ClimateContent {
  @ObjectLink climate: ClimateViewState;
  onBack: () => void = () => {};
  onSelectMode: (mode: string) => void = () => {};
  onAdjustTarget: (delta: number) => void = () => {};
  onPowerToggle: () => void = () => {};

  build() {
    Column({ space: 0 }) {
      FeatureHeader({
        title: '环境控制',
        subtitle: '全屋温控系统',
        onBack: this.onBack,
      })

      Row() {
        Column({ space: 2 }) {
          Text(this.climate.roomLabel)
            .fontSize(12)
            .fontWeight(FontWeight.Bold)
            .fontColor(COLOR_TEXT_MUTED)
            .letterSpacing(1.5)
          Row({ space: 6 }) {
            Text(`${this.climate.indoorTemperature}\u00B0`)
              .fontSize(64)
              .fontWeight(FontWeight.Medium)
              .fontColor(COLOR_ON_SURFACE)
              .fontFamily('serif')
            Text('室内')
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

          Text(`${this.climate.humidity}%`)
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
          .backgroundColor(this.climate.isPowered ? COLOR_PRIMARY + '14' : COLOR_SURFACE_CONTAINER_HIGH)
          .animation({ duration: 400 })

        Row()
          .width(240)
          .height(240)
          .borderRadius(120)
          .backgroundColor(this.climate.isPowered ? COLOR_PRIMARY : COLOR_SURFACE_CONTAINER_HIGH)
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
              .onClick(() => this.onAdjustTarget(-1))
              .stateStyles({
                pressed: { .opacity(0.7).scale({ x: 0.9, y: 0.9 }) },
                normal: { .opacity(1).scale({ x: 1, y: 1 }) }
              })
            Text(`Current ${this.climate.currentTemperature}\u00B0`)
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
              .stateStyles({
                pressed: { .opacity(0.7).scale({ x: 0.9, y: 0.9 }) },
                normal: { .opacity(1).scale({ x: 1, y: 1 }) }
              })
          }
          .justifyContent(FlexAlign.Center)

          Text(`${this.climate.targetTemperature}\u00B0`)
            .fontSize(62)
            .fontWeight(FontWeight.Bold)
            .fontColor(COLOR_PRIMARY)
            .fontFamily('serif')

          Text('目标')
            .fontSize(11)
            .fontWeight(FontWeight.Bold)
            .fontColor(COLOR_TEXT_MUTED)
            .letterSpacing(1.6)

          Row({ space: 6 }) {
            AppSymbol({
              name: this.climate.modeLabel === 'Heat' ? 'mode_heat' : 'thermostat',
              glyphSize: 16,
              color: COLOR_PRIMARY,
            })
            Text(this.climate.modeLabel)
              .fontSize(12)
              .fontWeight(FontWeight.Bold)
              .fontColor(COLOR_PRIMARY)
              .letterSpacing(1.2)
          }
          .justifyContent(FlexAlign.Center)

          Row() {
            AppSymbol({ name: 'power_settings_new', glyphSize: 18, color: this.climate.isPowered ? '#FFFFFF' : COLOR_TEXT_MUTED })
          }
          .width(40)
          .height(40)
          .borderRadius(20)
          .backgroundColor(this.climate.isPowered ? COLOR_PRIMARY : COLOR_SURFACE_CONTAINER_HIGH)
          .animation({ duration: 300 })
          .justifyContent(FlexAlign.Center)
          .onClick(() => this.onPowerToggle())
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
          .backgroundColor(this.climate.isPowered ? COLOR_PRIMARY : COLOR_TEXT_MUTED)
          .animation({ duration: 400 })
          .border({ width: 3, color: COLOR_SURFACE_CONTAINER_LOWEST })
          .position({ x: '71%', y: '12%' })
      }
      .width('100%')
      .height(340)
      .margin({ bottom: 18 })

      Text(this.climate.statusLabel)
        .fontSize(14)
        .fontStyle(FontStyle.Italic)
        .fontWeight(FontWeight.Medium)
        .fontColor(COLOR_TEXT_MUTED)
        .width('100%')
        .textAlign(TextAlign.Center)
        .margin({ bottom: 28 })

      Row({ space: 8 }) {
        ForEach(this.climate.modes, (mode: ClimateModeState) => {
          ClimateModeButton({
            mode,
            onTap: () => this.onSelectMode(mode.id),
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

      Column({ space: 16 }) {
        Row() {
          Text('Weekly 能耗')
            .fontSize(22)
            .fontWeight(FontWeight.Bold)
            .fontColor(COLOR_ON_SURFACE)
            .fontFamily('serif')
            .layoutWeight(1)
          Text(this.climate.totalUsageLabel)
            .fontSize(13)
            .fontWeight(FontWeight.Bold)
            .fontColor(COLOR_TEXT_MUTED)
        }
        .width('100%')

        Row({ space: 10 }) {
          ForEach(this.climate.usageBars, (bar: ClimateUsageBarState) => {
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

      if (this.climate.feedback.length > 0) {
        Text(this.climate.feedback)
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


@Component
export struct ClimateView {
  @ObjectLink appState: AppStateSnapshot;
  onBack: () => void = () => {};
  onSelectMode: (mode: string) => void = () => {};
  onAdjustTarget: (delta: number) => void = () => {};
  onPowerToggle: () => void = () => {};

  build() {
    ClimateContent({
      climate: this.appState.climate,
      onBack: this.onBack,
      onSelectMode: this.onSelectMode,
      onAdjustTarget: this.onAdjustTarget,
      onPowerToggle: this.onPowerToggle
    })
  }
}
