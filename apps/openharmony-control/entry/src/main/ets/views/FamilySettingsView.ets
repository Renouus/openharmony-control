import { AppStateSnapshot } from '../model/app-state-snapshot';
import { AppController } from '../controllers/AppController';
import { NavProxy } from '../controllers/NavProxy';
import { AppSymbol } from '../components/AppSymbol';
import {
  COLOR_ON_PRIMARY,
  COLOR_ON_SURFACE,
  COLOR_OUTLINE_VARIANT,
  COLOR_PRIMARY,
  COLOR_PRIMARY_SOFT,
  COLOR_SURFACE_CONTAINER,
  COLOR_SURFACE_CONTAINER_HIGH,
  COLOR_SURFACE_CONTAINER_LOWEST,
  COLOR_TERTIARY,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';

interface FamilySettingsRow {
  id: 'homeInfo' | 'emergency';
  icon: string;
  title: string;
  subtitle: string;
  danger?: boolean;
}

@Component
export struct FamilySettingsView {
  @ObjectLink appState: AppStateSnapshot;
  @Consume('controller') controller: AppController;
  @Consume('navStack') navStack: NavProxy;

  aboutToAppear() {
    this.controller.refreshFamilySettings(this.appState);
  }

  private buildRows(): FamilySettingsRow[] {
    return [
      {
        id: 'homeInfo',
        icon: 'house',
        title: '家庭信息',
        subtitle: `${this.appState.familySettings.homeName} · ${this.appState.familySettings.timezone}`,
      },
      {
        id: 'emergency',
        icon: 'contact_emergency',
        title: '紧急联系人',
        subtitle: `${this.appState.familySettings.emergencyContactName} · ${this.appState.familySettings.emergencyContactPhone}`,
        danger: true,
      },
    ];
  }

  private openRow(row: FamilySettingsRow): void {
    if (row.id === 'homeInfo') {
      this.navStack.pushPathByName('homeInfoEditor', null);
      return;
    }
    this.navStack.pushPathByName('emergencyContactEditor', null);
  }

  build() {
    Column({ space: 26 }) {
      Row({ space: 14 }) {
        this.highlightCard(
          'house',
          this.appState.familySettings.homeName,
          this.appState.familySettings.address || 'Add a household address',
          true,
        )
        this.highlightCard(
          'contact_emergency',
          this.appState.familySettings.emergencyContactName || 'Emergency Contact',
          this.appState.familySettings.emergencyContactPhone || 'Add a contact number',
          false,
        )
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
          ForEach(this.buildRows(), (row: FamilySettingsRow, index: number) => {
            Column({ space: 0 }) {
              Row({ space: 14 }) {
                Row() {
                  AppSymbol({
                    name: row.icon,
                    glyphSize: 20,
                    color: row.danger ? COLOR_TERTIARY : COLOR_PRIMARY,
                  })
                }
                .width(42)
                .height(42)
                .borderRadius(21)
                .backgroundColor(row.danger ? '#FCE4E0' : COLOR_SURFACE_CONTAINER)
                .justifyContent(FlexAlign.Center)

                Column({ space: 3 }) {
                  Text(row.title)
                    .fontSize(15)
                    .fontWeight(FontWeight.Medium)
                    .fontColor(COLOR_ON_SURFACE)
                  Text(row.subtitle)
                    .fontSize(12)
                    .fontColor(COLOR_TEXT_MUTED)
                }
                .alignItems(HorizontalAlign.Start)
                .layoutWeight(1)

                AppSymbol({ name: 'chevron_right', glyphSize: 18, color: COLOR_TEXT_MUTED })
              }
              .padding({ left: 18, right: 18, top: 18, bottom: 18 })
              .width('100%')
              .onClick(() => this.openRow(row))

              if (index < this.buildRows().length - 1) {
                Divider().color(COLOR_OUTLINE_VARIANT + '4D').margin({ left: 74, right: 18 })
              }
            }
          }, (row: FamilySettingsRow) => row.id)
        }
        .borderRadius(24)
        .backgroundColor(COLOR_SURFACE_CONTAINER_LOWEST)
        .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '80' })
        .clip(true)

        if (this.appState.familySettings.feedback.length > 0) {
          Text(this.appState.familySettings.feedback)
            .fontSize(13)
            .fontColor(COLOR_PRIMARY)
            .padding(12)
            .borderRadius(12)
            .backgroundColor(COLOR_PRIMARY_SOFT)
            .width('100%')
        }
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
          .maxLines(2)
        Text(subtitle)
          .fontSize(12)
          .fontColor(primary ? COLOR_ON_PRIMARY + 'CC' : COLOR_TEXT_MUTED)
          .maxLines(3)
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
