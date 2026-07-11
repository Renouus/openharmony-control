import promptAction from '@ohos.promptAction';
import { AppController, DeviceUpdateResult } from '../controllers/AppController';
import { AppStateSnapshot } from '../model/app-state-snapshot';
import {
  DEVICE_ICON_OPTIONS,
  DeviceEditorDraft,
  DeviceEditorFieldErrors,
  createDraft,
  isDeviceEditorDirty,
  validateDeviceEditorDraft,
} from '../model/device-editor-state';
import { DevicePanelState, RoomItemState } from '../model/page-view-state';
import { DeviceUpdateRequest } from '../services/device-api';
import { AppSymbol } from '../components/AppSymbol';
import {
  COLOR_BG,
  COLOR_ERROR,
  COLOR_ERROR_CONTAINER,
  COLOR_ON_PRIMARY,
  COLOR_ON_SURFACE,
  COLOR_OUTLINE_VARIANT,
  COLOR_PRIMARY,
  COLOR_PRIMARY_SOFT,
  COLOR_SURFACE_CONTAINER,
  COLOR_SURFACE_CONTAINER_LOWEST,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';

@Component
export struct DeviceEditorView {
  @Prop deviceId: string;
  @ObjectLink appState: AppStateSnapshot;
  @Consume('controller') controller: AppController;
  onClose: () => void = () => {};

  @State initialDraft: DeviceEditorDraft = createDraft('', '', '', 'devices_other', '');
  @State draft: DeviceEditorDraft = createDraft('', '', '', 'devices_other', '');
  @State errors: DeviceEditorFieldErrors = this.emptyErrors();
  @State pageError: string = '';
  @State isSubmitting: boolean = false;
  @State canSubmit: boolean = false;

  aboutToAppear(): void {
    const panel = this.findDevice();
    if (!panel) {
      return;
    }
    this.initialDraft = createDraft(panel.id, panel.name, panel.note, panel.icon, panel.roomId);
    this.draft = createDraft(panel.id, panel.name, panel.note, panel.icon, panel.roomId);
    this.revalidate(false);
  }

  private emptyErrors(): DeviceEditorFieldErrors {
    return { customName: '', note: '', customIcon: '', roomId: '' };
  }

  private findDevice(): DevicePanelState | undefined {
    return this.appState.home.devices.find((device: DevicePanelState) => device.id === this.deviceId);
  }

  private roomIds(): string[] {
    return this.appState.roomList.rooms.map((room: RoomItemState) => room.id);
  }

  private revalidate(showErrors: boolean): void {
    const validation = validateDeviceEditorDraft(this.draft, this.roomIds());
    this.canSubmit = validation.valid &&
      isDeviceEditorDirty(this.initialDraft, this.draft) &&
      !this.isSubmitting;
    this.errors = showErrors ? validation.errors : this.emptyErrors();
  }

  private updateName(value: string): void {
    this.draft = createDraft(this.draft.deviceId, value, this.draft.note, this.draft.customIcon, this.draft.roomId);
    this.revalidate(false);
  }

  private updateNote(value: string): void {
    this.draft = createDraft(this.draft.deviceId, this.draft.customName, value, this.draft.customIcon, this.draft.roomId);
    this.revalidate(false);
  }

  private selectIcon(icon: string): void {
    this.draft = createDraft(this.draft.deviceId, this.draft.customName, this.draft.note, icon, this.draft.roomId);
    this.revalidate(false);
  }

  private selectRoom(roomId: string): void {
    this.draft = createDraft(this.draft.deviceId, this.draft.customName, this.draft.note, this.draft.customIcon, roomId);
    this.revalidate(false);
  }

  private iconSymbol(icon: string): string {
    if (icon === 'sensors' || icon === 'devices_other') {
      return 'devices';
    }
    if (icon === 'outlet') {
      return 'power_settings_new';
    }
    if (icon === 'air') {
      return 'ac_unit';
    }
    return icon;
  }

  private async save(): Promise<void> {
    if (this.isSubmitting) {
      return;
    }
    const validation = validateDeviceEditorDraft(this.draft, this.roomIds());
    this.errors = validation.errors;
    if (!validation.valid || !isDeviceEditorDirty(this.initialDraft, this.draft)) {
      this.canSubmit = false;
      return;
    }

    this.isSubmitting = true;
    this.canSubmit = false;
    this.pageError = '';
    const update: DeviceUpdateRequest = {
      customName: validation.normalized.customName,
      note: validation.normalized.note,
      customIcon: validation.normalized.customIcon,
      roomId: validation.normalized.roomId,
    };
    const result: DeviceUpdateResult = await this.controller.handleUpdateDevice(this.appState, this.deviceId, update);
    this.isSubmitting = false;
    if (result.success) {
      this.onClose();
      return;
    }
    this.pageError = result.message;
    this.revalidate(true);
  }

  private async requestClose(): Promise<void> {
    if (this.isSubmitting) {
      return;
    }
    if (!isDeviceEditorDirty(this.initialDraft, this.draft)) {
      this.onClose();
      return;
    }

    const result = await promptAction.showDialog({
      title: '放弃修改？',
      message: '尚未保存的设备信息将丢失。',
      buttons: [
        { text: '继续编辑', color: COLOR_TEXT_MUTED },
        { text: '放弃修改', color: COLOR_ERROR },
      ],
    });
    if (result.index === 1) {
      this.onClose();
    }
  }

  build() {
    Column() {
      Row({ space: 12 }) {
        Button({ type: ButtonType.Circle }) {
          AppSymbol({ name: 'arrow_back', glyphSize: 20, color: COLOR_ON_SURFACE })
        }
        .width(44)
        .height(44)
        .backgroundColor(COLOR_SURFACE_CONTAINER)
        .onClick(() => this.requestClose())

        Text('编辑设备')
          .fontSize(20)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_ON_SURFACE)
          .layoutWeight(1)

        Button(this.isSubmitting ? '保存中' : '保存')
          .height(44)
          .fontSize(15)
          .fontColor(this.canSubmit ? COLOR_ON_PRIMARY : COLOR_TEXT_MUTED)
          .backgroundColor(this.canSubmit ? COLOR_PRIMARY : COLOR_SURFACE_CONTAINER)
          .enabled(this.canSubmit)
          .onClick(() => this.save())
      }
      .height(64)
      .padding({ left: 16, right: 16 })
      .width('100%')

      if (!this.findDevice()) {
        this.missingState('找不到设备', '该设备可能已被移除，请返回后刷新。')
      } else {
        Scroll() {
          Column({ space: 20 }) {
            this.previewBlock()
            this.nameField()
            this.noteField()
            this.iconPicker()
            this.roomPicker()

            if (this.pageError.length > 0) {
              Text(this.pageError)
                .fontSize(13)
                .fontColor(COLOR_ERROR)
                .padding(14)
                .borderRadius(12)
                .backgroundColor(COLOR_ERROR_CONTAINER)
                .width('100%')
            }
          }
          .padding({ left: 20, right: 20, top: 12, bottom: 40 })
          .width('100%')
        }
        .layoutWeight(1)
        .scrollBar(BarState.Off)
      }
    }
    .width('100%')
    .height('100%')
    .backgroundColor(COLOR_BG)
  }

  @Builder
  private missingState(title: string, message: string) {
    Column({ space: 14 }) {
      AppSymbol({ name: 'devices', glyphSize: 34, color: COLOR_TEXT_MUTED })
      Text(title).fontSize(20).fontWeight(FontWeight.Medium).fontColor(COLOR_ON_SURFACE)
      Text(message).fontSize(14).fontColor(COLOR_TEXT_MUTED).textAlign(TextAlign.Center)
      Button('返回').onClick(() => this.onClose())
    }
    .layoutWeight(1)
    .padding(32)
    .justifyContent(FlexAlign.Center)
  }

  @Builder
  private previewBlock() {
    Row({ space: 16 }) {
      Row() {
        AppSymbol({ name: this.iconSymbol(this.draft.customIcon), glyphSize: 30, color: COLOR_PRIMARY })
      }
      .width(64)
      .height(64)
      .borderRadius(16)
      .backgroundColor(COLOR_PRIMARY_SOFT)
      .justifyContent(FlexAlign.Center)

      Column({ space: 4 }) {
        Text(this.draft.customName.trim().length > 0 ? this.draft.customName.trim() : '设备名称')
          .fontSize(20)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_ON_SURFACE)
          .maxLines(1)
        Text(this.findDevice()?.originalName ?? '')
          .fontSize(13)
          .fontColor(COLOR_TEXT_MUTED)
          .maxLines(1)
      }
      .alignItems(HorizontalAlign.Start)
      .layoutWeight(1)
    }
    .padding(18)
    .width('100%')
    .backgroundColor(COLOR_SURFACE_CONTAINER_LOWEST)
    .borderRadius(16)
  }

  @Builder
  private nameField() {
    Column({ space: 8 }) {
      this.sectionLabel('名称', `${this.draft.customName.length}/30`)
      TextInput({ placeholder: '输入设备名称', text: this.draft.customName })
        .maxLength(30)
        .height(52)
        .padding({ left: 14, right: 14 })
        .backgroundColor(COLOR_SURFACE_CONTAINER_LOWEST)
        .borderRadius(12)
        .onChange((value: string) => this.updateName(value))
      if (this.errors.customName.length > 0) {
        Text(this.errors.customName).fontSize(12).fontColor(COLOR_ERROR)
      }
    }
    .width('100%')
    .alignItems(HorizontalAlign.Start)
  }

  @Builder
  private noteField() {
    Column({ space: 8 }) {
      this.sectionLabel('备注', `${this.draft.note.length}/120`)
      TextArea({ placeholder: '例如：靠近沙发，勿断电', text: this.draft.note })
        .maxLength(120)
        .height(104)
        .padding(14)
        .backgroundColor(COLOR_SURFACE_CONTAINER_LOWEST)
        .borderRadius(12)
        .onChange((value: string) => this.updateNote(value))
      if (this.errors.note.length > 0) {
        Text(this.errors.note).fontSize(12).fontColor(COLOR_ERROR)
      }
    }
    .width('100%')
    .alignItems(HorizontalAlign.Start)
  }

  @Builder
  private iconPicker() {
    Column({ space: 10 }) {
      this.sectionLabel('图标', '')
      Grid() {
        ForEach(DEVICE_ICON_OPTIONS, (icon: string) => {
          GridItem() {
            Column({ space: 6 }) {
              AppSymbol({
                name: this.iconSymbol(icon),
                glyphSize: 22,
                color: this.draft.customIcon === icon ? COLOR_ON_PRIMARY : COLOR_ON_SURFACE,
              })
              Text(icon === 'devices_other' ? '其他' : '')
                .fontSize(10)
                .fontColor(this.draft.customIcon === icon ? COLOR_ON_PRIMARY : COLOR_TEXT_MUTED)
            }
            .width('100%')
            .height(60)
            .justifyContent(FlexAlign.Center)
            .backgroundColor(this.draft.customIcon === icon ? COLOR_PRIMARY : COLOR_SURFACE_CONTAINER_LOWEST)
            .borderRadius(12)
            .onClick(() => this.selectIcon(icon))
          }
        }, (icon: string) => icon)
      }
      .columnsTemplate('1fr 1fr 1fr 1fr')
      .rowsGap(10)
      .columnsGap(10)
      .width('100%')
      if (this.errors.customIcon.length > 0) {
        Text(this.errors.customIcon).fontSize(12).fontColor(COLOR_ERROR)
      }
    }
    .width('100%')
    .alignItems(HorizontalAlign.Start)
  }

  @Builder
  private roomPicker() {
    Column({ space: 10 }) {
      this.sectionLabel('所属房间', '')
      if (this.appState.roomList.rooms.length === 0) {
        Text('暂无可用房间，请先创建房间')
          .fontSize(13)
          .fontColor(COLOR_ERROR)
          .padding(14)
          .width('100%')
          .backgroundColor(COLOR_ERROR_CONTAINER)
          .borderRadius(12)
      } else {
        Column() {
          ForEach(this.appState.roomList.rooms, (room: RoomItemState, index: number) => {
            Column() {
              Row({ space: 12 }) {
                AppSymbol({ name: room.icon, glyphSize: 20, color: COLOR_PRIMARY })
                Text(room.name)
                  .fontSize(15)
                  .fontColor(COLOR_ON_SURFACE)
                  .layoutWeight(1)
                AppSymbol({
                  name: this.draft.roomId === room.id ? 'check_circle' : 'fiber_manual_record',
                  glyphSize: 20,
                  color: this.draft.roomId === room.id ? COLOR_PRIMARY : COLOR_OUTLINE_VARIANT,
                })
              }
              .height(54)
              .padding({ left: 14, right: 14 })
              .width('100%')
              .onClick(() => this.selectRoom(room.id))
              if (index < this.appState.roomList.rooms.length - 1) {
                Divider().color(COLOR_OUTLINE_VARIANT + '80').margin({ left: 46 })
              }
            }
          }, (room: RoomItemState) => room.id)
        }
        .width('100%')
        .backgroundColor(COLOR_SURFACE_CONTAINER_LOWEST)
        .borderRadius(12)
        .clip(true)
      }
      if (this.errors.roomId.length > 0) {
        Text(this.errors.roomId).fontSize(12).fontColor(COLOR_ERROR)
      }
    }
    .width('100%')
    .alignItems(HorizontalAlign.Start)
  }

  @Builder
  private sectionLabel(label: string, meta: string) {
    Row() {
      Text(label).fontSize(15).fontWeight(FontWeight.Medium).fontColor(COLOR_ON_SURFACE)
      Blank()
      if (meta.length > 0) {
        Text(meta).fontSize(12).fontColor(COLOR_TEXT_MUTED)
      }
    }
    .width('100%')
  }
}
