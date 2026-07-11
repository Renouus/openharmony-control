import { AppStateSnapshot } from '../model/app-state-snapshot';
import {
  COLOR_ON_SURFACE,
  COLOR_PRIMARY,
  COLOR_SURFACE,
  COLOR_SURFACE_CONTAINER_LOW,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';

interface EmergencyContactSavePayload {
  emergencyContactName: string;
  emergencyContactPhone: string;
}

@Component
export struct EmergencyContactEditorView {
  @Prop appState: AppStateSnapshot;
  onCancel: () => void = () => {};
  onSave: (payload: EmergencyContactSavePayload) => Promise<void> | void = () => {};

  @State contactName: string = '';
  @State contactPhone: string = '';

  aboutToAppear() {
    this.contactName = this.appState.familySettings.emergencyContactName;
    this.contactPhone = this.appState.familySettings.emergencyContactPhone;
  }

  build() {
    Column() {
      Row() {
        Text('Cancel')
          .fontSize(16)
          .fontColor(COLOR_TEXT_MUTED)
          .onClick(() => this.onCancel())
        Text('Emergency Contact')
          .fontSize(18)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_ON_SURFACE)
          .layoutWeight(1)
          .textAlign(TextAlign.Center)
        Text('Save')
          .fontSize(16)
          .fontColor(COLOR_PRIMARY)
          .onClick(() => {
            if (!this.contactName || !this.contactPhone) {
              return;
            }

            const payload: EmergencyContactSavePayload = {
              emergencyContactName: this.contactName,
              emergencyContactPhone: this.contactPhone,
            };
            this.onSave(payload);
          })
      }
      .width('100%')
      .height(56)
      .padding({ left: 16, right: 16 })

      Scroll() {
        Column({ space: 20 }) {
          this.fieldBlock('Contact Name', 'Enter contact name', this.contactName, (value: string) => {
            this.contactName = value;
          })
          this.fieldBlock('Phone Number', 'Enter contact phone number', this.contactPhone, (value: string) => {
            this.contactPhone = value;
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
