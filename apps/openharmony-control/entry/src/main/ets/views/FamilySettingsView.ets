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

interface FamilySettingOption {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  danger?: boolean;
}

const FAMILY_OPTIONS: FamilySettingOption[] = [
  { id: 'homeInfo', icon: 'house', title: 'Home Information', subtitle: 'Address, timezone, and primary details.' },
  { id: 'wifi', icon: 'wifi', title: 'WiFi Settings', subtitle: 'Manage network access for devices.' },
  { id: 'hub', icon: 'router', title: 'Shared Hubs', subtitle: 'Configure central control panels.' },
  { id: 'emergency', icon: 'contact_emergency', title: 'Emergency Contacts', subtitle: 'Numbers to call in case of alarms.', danger: true },
];

@Component
export struct FamilySettingsView {
  build() {
    Column({ space: 26 }) {
      Row({ space: 14 }) {
        this.highlightCard('person_add', 'Invite Member', 'Bring family or roommates into OmniHome.', true)
        this.highlightCard('vpn_key', 'Guest Access', 'Manage temporary codes and smart access.', false)
      }
      .width('100%')

      Column({ space: 16 }) {
        Text('General Settings')
          .fontSize(24)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_ON_SURFACE)
          .fontFamily('serif')
          .width('100%')

        Column({ space: 0 }) {
          ForEach(FAMILY_OPTIONS, (option: FamilySettingOption, index: number) => {
            Column({ space: 0 }) {
              Row({ space: 14 }) {
                Row() {
                  AppSymbol({
                    name: option.icon,
                    glyphSize: 20,
                    color: option.danger ? COLOR_TERTIARY : COLOR_PRIMARY,
                  })
                }
                .width(42)
                .height(42)
                .borderRadius(21)
                .backgroundColor(option.danger ? '#FCE4E0' : COLOR_SURFACE_CONTAINER)
                .justifyContent(FlexAlign.Center)

                Column({ space: 3 }) {
                  Text(option.title)
                    .fontSize(15)
                    .fontWeight(FontWeight.Medium)
                    .fontColor(COLOR_ON_SURFACE)
                  Text(option.subtitle)
                    .fontSize(12)
                    .fontColor(COLOR_TEXT_MUTED)
                }
                .alignItems(HorizontalAlign.Start)
                .layoutWeight(1)

                AppSymbol({ name: 'chevron_right', glyphSize: 18, color: COLOR_TEXT_MUTED })
              }
              .padding({ left: 18, right: 18, top: 18, bottom: 18 })
              .width('100%')

              if (index < FAMILY_OPTIONS.length - 1) {
                Divider().color(COLOR_OUTLINE_VARIANT + '4D').margin({ left: 74, right: 18 })
              }
            }
          }, (option: FamilySettingOption) => option.id)
        }
        .borderRadius(24)
        .backgroundColor(COLOR_SURFACE_CONTAINER_LOWEST)
        .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '80' })
        .clip(true)
      }
      .width('100%')
    }
    .width('100%')
    .alignItems(HorizontalAlign.Start)
  }

  @Builder
  private highlightCard(icon: string, title: string, subtitle: string, primary: boolean) {
    Column({ space: 14 }) {
      Row() {
        AppSymbol({
          name: icon,
          glyphSize: 20,
          color: primary ? COLOR_ON_PRIMARY : COLOR_PRIMARY,
        })
      }
      .width(42)
      .height(42)
      .borderRadius(21)
      .backgroundColor(primary ? '#33FFFFFF' : COLOR_PRIMARY_SOFT)
      .justifyContent(FlexAlign.Center)

      Blank()

      Column({ space: 4 }) {
        Text(title)
          .fontSize(22)
          .fontWeight(FontWeight.Medium)
          .fontColor(primary ? COLOR_ON_PRIMARY : COLOR_ON_SURFACE)
          .fontFamily('serif')
        Text(subtitle)
          .fontSize(12)
          .fontColor(primary ? COLOR_ON_PRIMARY + 'CC' : COLOR_TEXT_MUTED)
      }
      .alignItems(HorizontalAlign.Start)
    }
    .layoutWeight(1)
    .height(164)
    .padding(22)
    .borderRadius(24)
    .backgroundColor(primary ? COLOR_PRIMARY : COLOR_SURFACE_CONTAINER_HIGH)
    .border(primary ? { width: 0, color: '#00000000' } : { width: 1, color: COLOR_OUTLINE_VARIANT + '80' })
  }
}
