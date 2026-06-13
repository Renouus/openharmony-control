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
import { AppSymbol } from '../components/AppSymbol';
import { AppStateSnapshot } from '../model/app-state-snapshot';
import { NavProxy } from '../controllers/NavProxy';
import { DeviceGridLayout } from '../components/DeviceGridLayout';
import { HomeDeviceCardState } from '../model/page-view-state';

@Component
export struct BathroomView {
  @ObjectLink appState: AppStateSnapshot;
  @Consume('navStack') navStack: NavProxy;

  private getRoomDevices(): HomeDeviceCardState[] {
    const room = this.appState.home.rooms.find(r => r.roomId === 'bathroom');
    return room?.devices ?? [];
  }

  private handleDeviceTap(deviceId: string, kind: string): void {
    if (kind === 'door-lock') {
      this.navStack.pushPathByName('access', null);
    } else if (kind === 'light') {
      this.navStack.pushPathByName('lightControl', deviceId);
    } else if (kind === 'air-conditioner') {
      this.navStack.pushPathByName('climate', null);
    } else {
      this.navStack.pushPathByName('climate', null);
    }
  }
  build() {
    Column({ space: 24 }) {
      Column({ space: 4 }) {
        Text('全部设备已关闭 • 24°C')
          .fontSize(14)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_SECONDARY)
          .textCase(TextCase.UpperCase)
          .letterSpacing(1)
      }
      .width('100%')
      .alignItems(HorizontalAlign.Center)

      Image('https://lh3.googleusercontent.com/aida-public/AB6AXuBvPvpPf6zK5AJDk2Wy3vAIrtbC2SKoGuvMeIPevPdTmb3n5sxgQB4lm34esgn0gi6J0CN2eQUJDixfGrSDhENRC7Omz9DeyaUMYSl591biKDczCiKxAvi6bmTngQX7A4DcOMcZgXZHYmkenzbPw7WzhIsNx8dMuR-KQW1txv_ms7t1qiqRJCPS2kMFvWkqpm2s-1thQWfyHtZSzoqzwX2VzWrDetex4pTM37v79alr4DMs1_Agv-5ZSClgJjeuMuNfmJIsor1ayfg')
        .width('100%')
        .aspectRatio(4/3)
        .borderRadius(24)
        .objectFit(ImageFit.Cover)

      Column({ space: 16 }) {
        Text('氛围')
          .fontSize(20)
          .fontWeight(FontWeight.Bold)
          .fontColor(COLOR_ON_SURFACE)
          .fontFamily('serif')

        Scroll() {
          Row({ space: 12 }) {
            Row({ space: 8 }) {
              AppSymbol({ name: 'spa', glyphSize: 20, color: COLOR_ON_PRIMARY })
              Text('水疗模式')
                .fontSize(14)
                .fontWeight(FontWeight.Medium)
                .fontColor(COLOR_ON_PRIMARY)
            }
            .padding({ left: 20, right: 20, top: 12, bottom: 12 })
            .backgroundColor(COLOR_PRIMARY)
            .borderRadius(16)

            this.SceneChip('wb_sunny', '晨间日常')
            this.SceneChip('bedtime', '静谧之夜')
            this.SceneChip('shower', '淋浴')
          }
          .padding({ right: 20 })
        }
        .scrollable(ScrollDirection.Horizontal)
        .scrollBar(BarState.Off)
      }
      .alignItems(HorizontalAlign.Start)

      Column({ space: 16 }) {
        Text('设备')
          .fontSize(20)
          .fontWeight(FontWeight.Bold)
          .fontColor(COLOR_ON_SURFACE)
          .fontFamily('serif')

        DeviceGridLayout({
          devices: this.getRoomDevices(),
          onDeviceTap: (deviceId: string, kind: string) => this.handleDeviceTap(deviceId, kind)
        })
      }
      .alignItems(HorizontalAlign.Start)
    }
    .width('100%')
  }

  @Builder
  SceneChip(icon: string, label: string) {
    Row({ space: 8 }) {
      AppSymbol({ name: icon, glyphSize: 20, color: COLOR_SECONDARY })
      Text(label)
        .fontSize(14)
        .fontWeight(FontWeight.Medium)
        .fontColor(COLOR_SECONDARY)
    }
    .padding({ left: 20, right: 20, top: 12, bottom: 12 })
    .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
    .borderRadius(16)
    .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '80' })
  }


}
