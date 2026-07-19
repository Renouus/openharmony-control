import {
  SensorDeviceCardState,
  SensorViewState,
} from '../model/page-view-state';
import { AppStateSnapshot } from '../model/app-state-snapshot';
import { AppController } from '../controllers/AppController';
import { NavProxy } from '../controllers/NavProxy';
import { FeatureHeader } from '../components/FeatureHeader';
import { SensorDeviceCard } from '../components/SensorDeviceCard';
import { AppSymbol } from '../components/AppSymbol';
import {
  COLOR_ON_PRIMARY,
  COLOR_ON_SURFACE,
  COLOR_OUTLINE_VARIANT,
  COLOR_PRIMARY,
  COLOR_PRIMARY_SOFT,
  COLOR_SURFACE_CONTAINER_HIGH,
  COLOR_SURFACE_CONTAINER_LOW,
  COLOR_SURFACE_CONTAINER_LOWEST,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';

/**
 * 传感器总览视图。
 *
 * 设计参照 LightingView：
 * - FeatureHeader 作为页眉
 * - 顶部"全屋"统计卡片（在线数/告警数/总数），与 LightingView Whole House 卡片对应
 * - 按设备列表展示 SensorDeviceCard 网格
 *
 * 交互：点击卡片通过 navStack.pushPathByName 跳转到 sensorControl 子页面，
 * 参数为目标设备 ID（与 lightControl 路由模式一致）。
 */
@Component
struct SensorContent {
  @ObjectLink appState: AppStateSnapshot;
  @ObjectLink sensors: SensorViewState;
  @Consume('controller') controller: AppController;
  @Consume('navStack') navStack: NavProxy;

  private handleCardTap(deviceId: string): void {
    this.navStack.pushPathByName('sensorControl', deviceId);
  }

  private hasAlert(): boolean {
    return this.sensors.devices.some((d: SensorDeviceCardState) => d.alertActive);
  }

  build() {
    Column({ space: 28 }) {
      FeatureHeader({
        title: '环境感知',
        subtitle: '温湿度 · 光照 · 运动 · 门窗',
      })

      // 顶部全屋统计卡片
      Column({ space: 18 }) {
        Row() {
          Column({ space: 4 }) {
            Text('全屋传感器')
              .fontSize(26)
              .fontColor(COLOR_ON_SURFACE)
              .fontFamily('serif')
            Row({ space: 6 }) {
              Row()
                .width(8)
                .height(8)
                .borderRadius(4)
                .backgroundColor(this.hasAlert() ? '#C0392B' : COLOR_PRIMARY)
              Text(this.hasAlert() ? '告警中' : '正常运行')
                .fontSize(12)
                .fontColor(this.hasAlert() ? '#C0392B' : COLOR_PRIMARY)
                .fontWeight(FontWeight.Bold)
                .letterSpacing(1.2)
            }
          }
          .alignItems(HorizontalAlign.Start)
          .layoutWeight(1)

          Row() {
            AppSymbol({
              name: 'sensors',
              glyphSize: 24,
              color: this.hasAlert() ? '#FFFFFF' : COLOR_PRIMARY,
            })
          }
          .width(56)
          .height(56)
          .borderRadius(28)
          .backgroundColor(this.hasAlert() ? '#C0392B' : COLOR_PRIMARY_SOFT)
          .justifyContent(FlexAlign.Center)
        }
        .width('100%')

        Row({ space: 12 }) {
          this.StatPill('在线', this.sensors.onlineCountLabel, 'check_circle', false)
          this.StatPill('告警', this.sensors.alertCountLabel, 'notifications', this.hasAlert())
          this.StatPill('总数', this.sensors.totalCountLabel, 'sensors', false)
        }
        .width('100%')
      }
      .padding(24)
      .borderRadius(28)
      .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
      .border({ width: 2, color: (this.hasAlert() ? '#C0392B' : COLOR_PRIMARY) + '26' })
      .shadow({ radius: 18, color: (this.hasAlert() ? '#C0392B' : '#C2652A') + '1F', offsetX: 0, offsetY: 4 })
      .width('100%')

      if (this.sensors.devices.length === 0) {
        Column({ space: 12 }) {
          AppSymbol({ name: 'sensors', glyphSize: 32, color: COLOR_TEXT_MUTED })
          Text('暂无传感器')
            .fontSize(14)
            .fontColor(COLOR_TEXT_MUTED)
          Text('绑定温湿度、光照、运动或门窗传感器后将在此显示')
            .fontSize(12)
            .fontColor(COLOR_TEXT_MUTED)
            .textAlign(TextAlign.Center)
            .lineHeight(18)
        }
        .width('100%')
        .padding({ top: 32, bottom: 32 })
        .alignItems(HorizontalAlign.Center)
      } else {
        Column({ space: 16 }) {
          Text('设备列表')
            .fontSize(22)
            .fontWeight(FontWeight.Medium)
            .fontColor(COLOR_ON_SURFACE)
            .fontFamily('serif')
            .width('100%')

          GridRow({ columns: 2, gutter: 12 }) {
            ForEach(this.sensors.devices, (card: SensorDeviceCardState) => {
              GridCol() {
                SensorDeviceCard({
                  card,
                  onTap: () => this.handleCardTap(card.id),
                })
              }
            }, (card: SensorDeviceCardState) => `${card.id}_${card.alertActive}_${card.online}_${card.primaryValue}`)
          }
          .width('100%')
        }
        .width('100%')
      }

      if (this.sensors.feedback.length > 0) {
        Text(this.sensors.feedback)
          .fontSize(13)
          .fontColor(COLOR_PRIMARY)
          .padding(12)
          .borderRadius(12)
          .backgroundColor(COLOR_PRIMARY_SOFT)
          .width('100%')
      }
    }
    .width('100%')
    .alignItems(HorizontalAlign.Start)
  }

  @Builder
  StatPill(label: string, value: string, icon: string, alert: boolean) {
    Column({ space: 6 }) {
      AppSymbol({
        name: icon,
        glyphSize: 16,
        color: alert ? '#C0392B' : COLOR_PRIMARY,
      })
      Text(value)
        .fontSize(15)
        .fontWeight(FontWeight.Bold)
        .fontColor(alert ? '#C0392B' : COLOR_ON_SURFACE)
      Text(label)
        .fontSize(11)
        .fontColor(COLOR_TEXT_MUTED)
        .letterSpacing(1.0)
    }
    .layoutWeight(1)
    .padding({ top: 12, bottom: 12 })
    .borderRadius(16)
    .backgroundColor(alert ? '#FCE4E0' : COLOR_SURFACE_CONTAINER_LOWEST)
    .border({ width: 1, color: (alert ? '#C0392B' : COLOR_OUTLINE_VARIANT) + '33' })
    .alignItems(HorizontalAlign.Center)
    .justifyContent(FlexAlign.Center)
  }
}

@Component
export struct SensorView {
  @ObjectLink appState: AppStateSnapshot;

  build() {
    SensorContent({ appState: this.appState, sensors: this.appState.sensors })
      .padding({ left: 20, right: 20, top: 16, bottom: 32 })
  }
}
