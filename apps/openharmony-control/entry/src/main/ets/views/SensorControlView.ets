import {
  SensorDetailState,
  SensorReadingState,
  SensorThresholdState,
  SensorThresholdPatch,
  SensorHistoryPointState,
  DevicePanelState,
  HomeViewState,
} from '../model/page-view-state';
import { AppStateSnapshot } from '../model/app-state-snapshot';
import { AppController } from '../controllers/AppController';
import { AppSymbol } from '../components/AppSymbol';
import { DeviceNoteBanner } from '../components/DeviceNoteBanner';
import { SensorReadingCard } from '../components/SensorReadingCard';
import { SensorHistoryChart } from '../components/SensorHistoryChart';
import { SensorThresholdEditor } from '../components/SensorThresholdEditor';
import { SensorStatusBadge } from '../components/SensorStatusBadge';
import {
  COLOR_BG,
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

const EMPTY_READINGS: SensorReadingState[] = [];
const EMPTY_HISTORY: SensorHistoryPointState[] = [];
const EMPTY_THRESHOLDS: SensorThresholdState[] = [];/**
 * 单个传感器详情视图。
 *
 * 设计参照 LightControlView/ClimateControlView：
 * - 顶部：设备名 + 房间 + 状态徽标
 * - 中部：实时读数卡片网格（SensorReadingCard）
 * - 下部：历史趋势图表（SensorHistoryChart）
 * - 底部：阈值告警设置（SensorThresholdEditor）
 *
 * 4 种传感器（温湿度 / 光照 / 运动 / 门窗）通过统一的 SensorDetailState
 * 数据驱动渲染，无需为每种类型写独立 struct，保持代码紧凑且与
 * ClimateControlView 单 struct 多分支的风格一致。
 */
@Component
export struct SensorControlView {
  @Prop deviceId: string;
  @ObjectLink appState: AppStateSnapshot;
  @ObjectLink home: HomeViewState;
  @Consume('controller') controller: AppController;

  private getDetail(): SensorDetailState | undefined {
    return this.appState.sensors.details.find((d: SensorDetailState) => d.id === this.deviceId);
  }

  private getDevicePanel(): DevicePanelState | undefined {
    return this.appState.home.devices.find((device: DevicePanelState) => device.id === this.deviceId);
  }

  private readings(): SensorReadingState[] {
    const detail = this.getDetail();
    if (detail === undefined) { return EMPTY_READINGS; }
    return detail.readings;
  }

  private history(): SensorHistoryPointState[] {
    const detail = this.getDetail();
    if (detail === undefined) { return EMPTY_HISTORY; }
    return detail.history;
  }

  private thresholds(): SensorThresholdState[] {
    const detail = this.getDetail();
    if (detail === undefined) { return EMPTY_THRESHOLDS; }
    return detail.thresholds;
  }

  private primaryReading(): SensorReadingState | undefined {
    const readings = this.readings();
    if (readings.length === 0) { return undefined; }
    return readings[0];
  }

  private handlePatch(metricLabel: string, patch: SensorThresholdPatch): void {
    this.controller.handleSensorUpdateThreshold(this.appState, this.deviceId, metricLabel, patch)
      .then(() => {})
      .catch((e: Object) => {
        console.error('OmniHomeLog', `handleSensorUpdateThreshold failed: ${e}`);
      });
  }

  build() {
    Column() {
      if (this.getDetail() === undefined) {
        Column({ space: 12 }) {
          AppSymbol({ name: 'sensors', glyphSize: 32, color: COLOR_TEXT_MUTED })
          Text('设备未找到')
            .fontSize(16)
            .fontColor(COLOR_TEXT_MUTED)
        }
        .width('100%')
        .padding({ top: 60, bottom: 60 })
        .alignItems(HorizontalAlign.Center)
      } else {
        Column({ space: 22 }) {
          // 标题区
          Column({ space: 8 }) {
            Text(this.getDetail()?.name ?? '')
              .fontSize(28)
              .fontWeight(FontWeight.Bold)
              .fontColor(COLOR_ON_SURFACE)
              .fontFamily('serif')
            Row({ space: 8 }) {
              Text(this.getDetail()?.roomName ?? '')
                .fontSize(12)
                .fontWeight(FontWeight.Bold)
                .fontColor(COLOR_TEXT_MUTED)
                .letterSpacing(1.5)
              Text('·')
                .fontSize(12)
                .fontColor(COLOR_TEXT_MUTED)
              Text(this.kindLabel())
                .fontSize(12)
                .fontWeight(FontWeight.Bold)
                .fontColor(COLOR_TEXT_MUTED)
                .letterSpacing(1.5)
            }
          }
          .width('100%')
          .alignItems(HorizontalAlign.Start)

          DeviceNoteBanner({ note: this.getDevicePanel()?.note ?? '' })

          // 状态摘要卡片
          this.StatusSummaryCard()

          // 实时读数
          if (this.readings().length > 0) {
            Column({ space: 14 }) {
              Row() {
                Text('实时读数')
                  .fontSize(20)
                  .fontWeight(FontWeight.Medium)
                  .fontColor(COLOR_ON_SURFACE)
                  .fontFamily('serif')
                  .layoutWeight(1)
                AppSymbol({ name: 'refresh', glyphSize: 18, color: COLOR_PRIMARY })
              }
              .width('100%')

              GridRow({ columns: 2, gutter: 12 }) {
                ForEach(this.readings(), (reading: SensorReadingState, index: number) => {
                  GridCol() {
                    SensorReadingCard({
                      reading,
                      highlight: index === 0 && (this.getDetail()?.online ?? false),
                    })
                  }
                }, (reading: SensorReadingState) => `${reading.label}_${reading.value}_${reading.numericValue}`)
              }
              .width('100%')
            }
            .width('100%')
            .alignItems(HorizontalAlign.Start)
          }

          // 历史图表
          if (this.history().length > 0) {
            SensorHistoryChart({
              points: this.history(),
              unit: this.primaryReading()?.unit ?? '',
              metricLabel: this.primaryReading()?.label ?? '',
            })
          }

          // 阈值告警
          if (this.thresholds().length > 0) {
            SensorThresholdEditor({
              thresholds: this.thresholds(),
              onPatch: (metricLabel: string, patch: SensorThresholdPatch) => this.handlePatch(metricLabel, patch),
            })
          }

          // 电池/最后更新时间
          this.MetaCard()

          if (this.appState.sensors.feedback.length > 0) {
            Text(this.appState.sensors.feedback)
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
    }
    .width('100%')
  }

  private kindLabel(): string {
    const kind = this.getDetail()?.kind ?? '';
    if (kind === 'environment-sensor') { return '温湿度传感器'; }
    if (kind === 'motion-sensor') { return '运动传感器'; }
    if (kind === 'light-sensor') { return '光照传感器'; }
    if (kind === 'contact-sensor') { return '门窗传感器'; }
    return '传感器';
  }

  private formatUpdatedAt(): string {
    const ts = this.getDetail()?.updatedAt ?? 0;
    if (ts === 0) { return '等待上报'; }
    const now = Date.now();
    const diff = Math.max(0, now - ts);
    const minutes = Math.round(diff / 60000);
    if (minutes < 1) { return '刚刚'; }
    if (minutes < 60) { return `${minutes} 分钟前`; }
    const hours = Math.round(minutes / 60);
    if (hours < 24) { return `${hours} 小时前`; }
    const days = Math.round(hours / 24);
    return `${days} 天前`;
  }

  @Builder
  StatusSummaryCard() {
    Row({ space: 16 }) {
      Row() {
        AppSymbol({
          name: this.getDetail()?.icon ?? 'sensors',
          glyphSize: 28,
          color: this.getDetail()?.alertActive === true ? '#FFFFFF' : (this.getDetail()?.online === true ? COLOR_PRIMARY : COLOR_TEXT_MUTED),
        })
      }
      .width(64)
      .height(64)
      .borderRadius(32)
      .backgroundColor(this.getDetail()?.alertActive === true ? '#C0392B' : (this.getDetail()?.online === true ? COLOR_PRIMARY_SOFT : COLOR_SURFACE_CONTAINER_HIGH))
      .justifyContent(FlexAlign.Center)

      Column({ space: 6 }) {
        Text(this.getDetail()?.statusLabel ?? '')
          .fontSize(20)
          .fontWeight(FontWeight.Bold)
          .fontColor(this.getDetail()?.alertActive === true ? '#C0392B' : COLOR_ON_SURFACE)
        Text(this.getDetail()?.statusDetail ?? '')
          .fontSize(12)
          .fontColor(COLOR_TEXT_MUTED)
          .lineHeight(18)
      }
      .alignItems(HorizontalAlign.Start)
      .layoutWeight(1)

      SensorStatusBadge({
        online: this.getDetail()?.online ?? false,
        alertActive: this.getDetail()?.alertActive ?? false,
      })
    }
    .padding(18)
    .borderRadius(22)
    .backgroundColor(this.getDetail()?.alertActive === true ? '#FCE4E0' : COLOR_SURFACE_CONTAINER_LOW)
    .border({ width: 1, color: (this.getDetail()?.alertActive === true ? '#C0392B' : COLOR_OUTLINE_VARIANT) + '33' })
    .shadow({ radius: 14, color: '#3A302A0D', offsetX: 0, offsetY: 4 })
    .width('100%')
    .alignItems(VerticalAlign.Center)
  }

  @Builder
  MetaCard() {
    Row({ space: 12 }) {
      Column({ space: 4 }) {
        Text('最后上报')
          .fontSize(11)
          .fontColor(COLOR_TEXT_MUTED)
          .letterSpacing(1.0)
        Text(this.formatUpdatedAt())
          .fontSize(13)
          .fontWeight(FontWeight.Bold)
          .fontColor(COLOR_ON_SURFACE)
      }
      .alignItems(HorizontalAlign.Start)
      .layoutWeight(1)

      if ((this.getDetail()?.battery ?? -1) >= 0) {
        Column({ space: 4 }) {
          Text('电池电量')
            .fontSize(11)
            .fontColor(COLOR_TEXT_MUTED)
            .letterSpacing(1.0)
          Row({ space: 4 }) {
            AppSymbol({ name: 'battery_horiz_075', glyphSize: 14, color: COLOR_PRIMARY })
            Text(`${this.getDetail()?.battery ?? 0}%`)
              .fontSize(13)
              .fontWeight(FontWeight.Bold)
              .fontColor(COLOR_ON_SURFACE)
          }
        }
        .alignItems(HorizontalAlign.Start)
        .layoutWeight(1)
      }
    }
    .padding(16)
    .borderRadius(18)
    .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
    .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '33' })
    .width('100%')
  }
}
