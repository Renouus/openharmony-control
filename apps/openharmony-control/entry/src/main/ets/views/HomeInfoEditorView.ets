import promptAction from '@ohos.promptAction';
import { AppStateSnapshot } from '../model/app-state-snapshot';
import {
  COLOR_ERROR,
  COLOR_ON_SURFACE,
  COLOR_PRIMARY,
  COLOR_SURFACE,
  COLOR_SURFACE_CONTAINER_LOW,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';

interface HomeInfoSavePayload {
  homeName: string;
  address: string;
  timezone: string;
}

@Component
export struct HomeInfoEditorView {
  @Prop appState: AppStateSnapshot;
  onCancel: () => void = () => {};
  onSave: (payload: HomeInfoSavePayload) => Promise<void> | void = () => {};

  @State homeName: string = '';
  @State address: string = '';
  @State timezone: string = '';
  @State initialHomeName: string = '';
  @State initialAddress: string = '';
  @State initialTimezone: string = '';

  aboutToAppear() {
    this.homeName = this.appState.familySettings.homeName;
    this.address = this.appState.familySettings.address;
    this.timezone = this.appState.familySettings.timezone;
    this.initialHomeName = this.homeName;
    this.initialAddress = this.address;
    this.initialTimezone = this.timezone;
  }

  private isDirty(): boolean {
    return this.homeName !== this.initialHomeName
      || this.address !== this.initialAddress
      || this.timezone !== this.initialTimezone;
  }

  private async requestCancel(): Promise<void> {
    if (!this.isDirty()) {
      this.onCancel();
      return;
    }
    const result: promptAction.ShowDialogSuccessResponse = await promptAction.showDialog({
      title: '放弃修改？',
      message: '尚未保存的家庭信息将丢失。',
      buttons: [
        { text: '继续编辑', color: COLOR_TEXT_MUTED },
        { text: '放弃修改', color: COLOR_ERROR },
      ],
    });
    if (result.index === 1) {
      this.onCancel();
    }
  }

  build() {
    Column() {
      Row() {
        Text('Cancel')
          .fontSize(16)
          .fontColor(COLOR_TEXT_MUTED)
          .onClick(() => this.requestCancel())
        Text('Home Info')
          .fontSize(18)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_ON_SURFACE)
          .layoutWeight(1)
          .textAlign(TextAlign.Center)
        Text('Save')
          .fontSize(16)
          .fontColor(COLOR_PRIMARY)
          .onClick(() => {
            if (!this.homeName || !this.timezone) {
              return;
            }

            const payload: HomeInfoSavePayload = {
              homeName: this.homeName,
              address: this.address,
              timezone: this.timezone,
            };
            this.onSave(payload);
          })
      }
      .width('100%')
      .height(56)
      .padding({ left: 16, right: 16 })

      Scroll() {
        Column({ space: 20 }) {
          this.fieldBlock('Home Name', 'Enter household name', this.homeName, (value: string) => {
            this.homeName = value;
          })
          this.fieldBlock('Address', 'Enter household address', this.address, (value: string) => {
            this.address = value;
          })
          this.fieldBlock('Timezone', 'Enter timezone, e.g. Asia/Shanghai', this.timezone, (value: string) => {
            this.timezone = value;
          })
        }
        .padding({ left: 24, right: 24, top: 24, bottom: 100 })
        .width('100%')
      }
      .layoutWeight(1)
      .scrollBar(BarState.Off)
    }
    .width('100%')
    .height('100%')
    .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
  }

  @Builder
  private fieldBlock(label: string, placeholder: string, value: string, onChange: (value: string) => void) {
    Column({ space: 10 }) {
      Text(label)
        .fontSize(16)
        .fontWeight(FontWeight.Medium)
        .fontColor(COLOR_ON_SURFACE)
        .width('100%')

      TextInput({ placeholder, text: value })
        .onChange(onChange)
        .height(56)
        .width('100%')
        .backgroundColor(Color.Transparent)
    }
    .width('100%')
    .padding({ left: 16, right: 16, top: 14, bottom: 14 })
    .backgroundColor(COLOR_SURFACE)
    .borderRadius(20)
    .shadow({ radius: 12, color: '#08000000', offsetY: 4 })
  }
}
