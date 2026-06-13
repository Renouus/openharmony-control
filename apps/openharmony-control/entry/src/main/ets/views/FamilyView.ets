import { FamilyActivityState, FamilyMemberCardState, FamilyViewState } from '../model/page-view-state';
import { AppStateSnapshot } from '../model/app-state-snapshot';
import { AppController } from '../controllers/AppController';
import { AppSymbol } from '../components/AppSymbol';
import {
  COLOR_ON_PRIMARY,
  COLOR_ON_SURFACE,
  COLOR_OUTLINE_VARIANT,
  COLOR_PRIMARY,
  COLOR_PRIMARY_SOFT,
  COLOR_SURFACE_CONTAINER,
  COLOR_SURFACE_CONTAINER_HIGH,
  COLOR_SURFACE_CONTAINER_LOW,
  COLOR_SURFACE_CONTAINER_LOWEST,
  COLOR_TERTIARY,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';

function familyAvatar(memberId: string): Resource {
  if (memberId === 'mom') {
    return $r('app.media.family_member_sarah');
  }
  if (memberId === 'dad') {
    return $r('app.media.family_member_david');
  }
  return $r('app.media.family_member_alex');
}

@Component
struct FamilyMemberCard {
  @Prop member: FamilyMemberCardState;

  build() {
    Row({ space: 14 }) {
      Image(familyAvatar(this.member.id))
      .width(56)
      .height(56)
      .borderRadius(28)
      .objectFit(ImageFit.Cover)

      Column({ space: 4 }) {
        Text(this.member.name)
          .fontSize(18)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_ON_SURFACE)

        Row({ space: 6 }) {
          Row()
            .width(8)
            .height(8)
            .borderRadius(4)
            .backgroundColor(this.member.atHome ? COLOR_PRIMARY : COLOR_OUTLINE_VARIANT)
          Text(this.member.subtitle)
            .fontSize(13)
            .fontColor(this.member.atHome ? COLOR_PRIMARY : COLOR_TEXT_MUTED)
        }
      }
      .alignItems(HorizontalAlign.Start)
      .layoutWeight(1)

      AppSymbol({ name: 'chevron_right', glyphSize: 18, color: COLOR_TEXT_MUTED })
    }
    .padding(20)
    .borderRadius(16)
    .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
    .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '1A' })
    .shadow({ radius: 16, color: '#3A302A08', offsetX: 0, offsetY: 4 })
    .width('100%')
  }
}

@Component
struct FamilySettingsRow {
  @Prop icon: string;
  @Prop title: string;
  @Prop subtitle: string;
  @Prop danger: boolean = false;

  build() {
    Row({ space: 14 }) {
      Row() {
        AppSymbol({
          name: this.icon,
          glyphSize: 20,
          color: this.danger ? COLOR_TERTIARY : COLOR_PRIMARY,
        })
      }
      .width(40)
      .height(40)
      .borderRadius(20)
      .backgroundColor(this.danger ? '#FCE4E0' : COLOR_SURFACE_CONTAINER)
      .justifyContent(FlexAlign.Center)

      Column({ space: 3 }) {
        Text(this.title)
          .fontSize(15)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_ON_SURFACE)
        Text(this.subtitle)
          .fontSize(12)
          .fontColor(COLOR_TEXT_MUTED)
      }
      .alignItems(HorizontalAlign.Start)
      .layoutWeight(1)

      AppSymbol({ name: 'chevron_right', glyphSize: 18, color: COLOR_TEXT_MUTED })
    }
    .padding({ left: 20, right: 20, top: 18, bottom: 18 })
    .width('100%')
    .backgroundColor('#00000000')
  }
}

@Component
export struct FamilyView {
  @ObjectLink appState: AppStateSnapshot;
  @Consume('controller') controller: AppController;

  

  build() {
    Column({ space: 0 }) {
      Column({ space: 10 }) {
        Row() {
          Image($r('app.media.family_home_hero'))
            .width(128)
            .height(128)
            .borderRadius(64)
            .objectFit(ImageFit.Cover)
            .border({ width: 4, color: COLOR_SURFACE_CONTAINER_LOWEST })
        }
        .width('100%')
        .justifyContent(FlexAlign.Center)

        Text(this.appState.family.title)
          .fontSize(38)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_ON_SURFACE)
          .fontFamily('serif')
          .width('100%')
          .textAlign(TextAlign.Center)

        Text(this.appState.family.address)
          .fontSize(13)
          .fontColor(COLOR_TEXT_MUTED)
          .letterSpacing(1.4)
          .width('100%')
          .textAlign(TextAlign.Center)
      }
      .padding({ top: 24, bottom: 24 })
      .border({ width: { bottom: 1 }, color: COLOR_OUTLINE_VARIANT + '4D' })
      .margin({ bottom: 32 })
      .width('100%')

      Column({ space: 16 }) {
        Row() {
          Text('家庭成员')
            .fontSize(24)
            .fontWeight(FontWeight.Medium)
            .fontColor(COLOR_ON_SURFACE)
            .fontFamily('serif')
            .layoutWeight(1)
          Text(`${this.appState.family.presentCount} 人活跃`)
            .fontSize(13)
            .fontColor(COLOR_TEXT_MUTED)
        }
        .width('100%')

        ForEach(this.appState.family.members, (member: FamilyMemberCardState) => {
          FamilyMemberCard({ member })
        }, (member: FamilyMemberCardState) => member.id)
      }
      .width('100%')
      .margin({ bottom: 32 })

      Row({ space: 14 }) {
        Column({ space: 14 }) {
          Row() {
            AppSymbol({ name: 'person_add', glyphSize: 20, color: COLOR_ON_PRIMARY })
          }
          .width(40)
          .height(40)
          .borderRadius(20)
          .backgroundColor('#33FFFFFF')
          .justifyContent(FlexAlign.Center)

          Blank()

          Column({ space: 4 }) {
            Text('邀请新成员')
              .fontSize(22)
              .fontWeight(FontWeight.Medium)
              .fontColor(COLOR_ON_PRIMARY)
              .fontFamily('serif')
            Text('添加家人或室友到 OmniHome。')
              .fontSize(12)
              .fontColor(COLOR_ON_PRIMARY + 'CC')
          }
          .alignItems(HorizontalAlign.Start)
        }
        .padding(24)
        .borderRadius(24)
        .backgroundColor(COLOR_PRIMARY)
        .height(160)
        .layoutWeight(1)
        .alignItems(HorizontalAlign.Start)
        .shadow({ radius: 18, color: '#C2652A24', offsetX: 0, offsetY: 6 })

        Column({ space: 14 }) {
          Row() {
            AppSymbol({ name: 'vpn_key', glyphSize: 20, color: COLOR_PRIMARY })
          }
          .width(40)
          .height(40)
          .borderRadius(20)
          .backgroundColor(COLOR_PRIMARY_SOFT)
          .justifyContent(FlexAlign.Center)

          Blank()

          Column({ space: 4 }) {
            Text('访客访问')
              .fontSize(22)
              .fontWeight(FontWeight.Medium)
              .fontColor(COLOR_ON_SURFACE)
              .fontFamily('serif')
            Text('管理临时密码和权限。')
              .fontSize(12)
              .fontColor(COLOR_TEXT_MUTED)
          }
          .alignItems(HorizontalAlign.Start)
        }
        .padding(24)
        .borderRadius(24)
        .backgroundColor(COLOR_SURFACE_CONTAINER_HIGH)
        .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '80' })
        .height(160)
        .layoutWeight(1)
        .alignItems(HorizontalAlign.Start)
        .shadow({ radius: 16, color: '#3A302A08', offsetX: 0, offsetY: 4 })
      }
      .width('100%')
      .margin({ bottom: 32 })

      Column({ space: 14 }) {
        Row() {
          Text('近期活动')
            .fontSize(24)
            .fontWeight(FontWeight.Medium)
            .fontColor(COLOR_ON_SURFACE)
            .fontFamily('serif')
            .layoutWeight(1)
          Button('广播')
            .fontSize(12)
            .fontColor('#FFFFFF')
            .height(36)
            .borderRadius(999)
            .backgroundColor(COLOR_PRIMARY)
            .padding({ left: 16, right: 16 })
            .onClick(() => this.controller.handleFamilyBroadcast(this.appState))
        }
        .width('100%')

        Column({ space: 0 }) {
          ForEach(this.appState.family.activities, (activity: FamilyActivityState, index: number) => {
            Column({ space: 8 }) {
              Row() {
                Column({ space: 4 }) {
                  Text(activity.message)
                    .fontSize(14)
                    .fontWeight(FontWeight.Medium)
                    .fontColor(COLOR_ON_SURFACE)
                  Text(activity.timeLabel)
                    .fontSize(12)
                    .fontColor(COLOR_TEXT_MUTED)
                }
                .alignItems(HorizontalAlign.Start)
                .layoutWeight(1)
              }
              .width('100%')

              if (index < this.appState.family.activities.length - 1) {
                Divider().color(COLOR_OUTLINE_VARIANT + '4D')
              }
            }
            .padding({ left: 20, right: 20, top: 18, bottom: 18 })
            .width('100%')
          }, (activity: FamilyActivityState) => activity.id)
        }
        .borderRadius(24)
        .backgroundColor(COLOR_SURFACE_CONTAINER_LOWEST)
        .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '80' })
        .shadow({ radius: 18, color: '#3A302A08', offsetX: 0, offsetY: 4 })
      }
      .width('100%')
      .margin({ bottom: 32 })

      Column({ space: 0 }) {
        Text('通用设置')
          .fontSize(24)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_ON_SURFACE)
          .fontFamily('serif')
          .padding({ bottom: 16 })

        Column() {
          FamilySettingsRow({
            icon: 'house',
            title: '家庭信息',
            subtitle: '地址、时区和主要详细信息。',
          })
          Divider().color(COLOR_OUTLINE_VARIANT + '4D').margin({ left: 74 })
          FamilySettingsRow({
            icon: 'wifi',
            title: 'WiFi 设置',
            subtitle: '管理设备的网络访问。',
          })
          Divider().color(COLOR_OUTLINE_VARIANT + '4D').margin({ left: 74 })
          FamilySettingsRow({
            icon: 'router',
            title: '共享控制中枢',
            subtitle: '配置中央控制面板。',
          })
          Divider().color(COLOR_OUTLINE_VARIANT + '4D').margin({ left: 74 })
          FamilySettingsRow({
            icon: 'contact_emergency',
            title: '紧急联系人',
            subtitle: '报警时拨打的号码。',
            danger: true,
          })
        }
        .borderRadius(24)
        .backgroundColor(COLOR_SURFACE_CONTAINER_LOWEST)
        .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '80' })
        .clip(true)
        .shadow({ radius: 18, color: '#3A302A08', offsetX: 0, offsetY: 4 })
      }
      .width('100%')

      if (this.appState.family.feedback.length > 0) {
        Text(this.appState.family.feedback)
          .fontSize(13)
          .fontColor(COLOR_PRIMARY)
          .padding(12)
          .borderRadius(12)
          .backgroundColor(COLOR_PRIMARY_SOFT)
          .width('100%')
          .margin({ top: 18 })
      }
    }
    .width('100%')
    .alignItems(HorizontalAlign.Start)
  }
}
