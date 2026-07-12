import {
  COLOR_ON_PRIMARY,
  COLOR_ON_SURFACE,
  COLOR_OUTLINE_VARIANT,
  COLOR_PRIMARY,
  COLOR_SURFACE_CONTAINER_HIGH,
  COLOR_SURFACE_CONTAINER_LOW,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';
import { AppSymbol } from './AppSymbol';
import { AppController } from '../controllers/AppController';
import { DevicePanelState, RoomItemState } from '../model/page-view-state';
import { AppStateSnapshot } from '../model/app-state-snapshot';

const AVAILABLE_ICONS: string[] = ['home', 'bedtime', 'water_drop', 'videocam', 'lightbulb', 'mode_heat', 'ac_unit', 'auto_awesome'];

@Component
export struct AddRoomSheet {
  @Consume('controller') controller: AppController;
  @ObjectLink appState: AppStateSnapshot;
  onClose: () => void = () => {};

  @Prop editingRoomId: string = '';
  @State roomName: string = '';
  @State selectedIcon: string = 'home';
  @State isSubmitting: boolean = false;

  aboutToAppear() {
    if (this.editingRoomId) {
      const room = this.appState.roomList.rooms.find((r: RoomItemState) => r.id === this.editingRoomId);
      if (room) {
        this.roomName = room.name;
        this.selectedIcon = room.icon;
      }
    }
  }

  build() {
    Column({ space: 22 }) {
      Row()
        .width(48)
        .height(5)
        .borderRadius(3)
        .backgroundColor(COLOR_OUTLINE_VARIANT)
        .margin({ top: 6 })

      Row() {
        Text(this.editingRoomId ? '编辑房间' : '添加房间')
          .fontSize(28)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_ON_SURFACE)
          .fontFamily('serif')
          .layoutWeight(1)

        Button('关闭')
          .fontSize(13)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_TEXT_MUTED)
          .backgroundColor('#00000000')
          .padding({ left: 0, right: 0 })
          .height(32)
          .onClick(() => this.onClose())
      }
      .width('100%')

      Column({ space: 14 }) {
        Text('房间名称')
          .fontSize(15)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_ON_SURFACE)
          .width('100%')

        TextInput({ placeholder: '例如：儿童房、书房', text: this.roomName })
          .height(52)
          .fontSize(15)
          .borderRadius(16)
          .backgroundColor('#FFFFFF')
          .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '80' })
          .onChange((value: string) => {
            this.roomName = value;
          })
      }
      .width('100%')

      Column({ space: 14 }) {
        Text('选择图标')
          .fontSize(15)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_ON_SURFACE)
          .width('100%')

        Grid() {
          ForEach(AVAILABLE_ICONS, (icon: string) => {
            GridItem() {
              Row() {
                AppSymbol({ name: icon, glyphSize: 24, color: this.selectedIcon === icon ? COLOR_PRIMARY : COLOR_TEXT_MUTED })
              }
              .width(56)
              .height(56)
              .borderRadius(28)
              .backgroundColor(this.selectedIcon === icon ? COLOR_PRIMARY + '1A' : COLOR_SURFACE_CONTAINER_HIGH)
              .border({ width: 1, color: this.selectedIcon === icon ? COLOR_PRIMARY : COLOR_OUTLINE_VARIANT + '40' })
              .justifyContent(FlexAlign.Center)
              .onClick(() => {
                this.selectedIcon = icon;
              })
            }
          })
        }
        .columnsTemplate('1fr 1fr 1fr 1fr')
        .columnsGap(12)
        .rowsGap(12)
        .height(124)
        .width('100%')
      }
      .width('100%')

      Button(this.isSubmitting ? '保存中...' : '保存')
        .width('100%')
        .height(52)
        .fontSize(16)
        .fontWeight(FontWeight.Medium)
        .fontColor(COLOR_ON_PRIMARY)
        .backgroundColor(this.roomName.trim().length === 0 ? COLOR_OUTLINE_VARIANT : COLOR_PRIMARY)
        .borderRadius(26)
        .margin({ top: 12 })
        .enabled(this.roomName.trim().length > 0 && !this.isSubmitting)
        .onClick(async () => {
          this.isSubmitting = true;
          if (this.editingRoomId) {
            await this.controller.handleUpdateRoom(this.appState, this.editingRoomId, this.roomName, this.selectedIcon);
          } else {
            await this.controller.handleCreateRoom(this.appState, this.roomName, this.selectedIcon);
          }
          this.isSubmitting = false;
          this.onClose();
        })
    }
    .width('100%')
    .padding({ left: 24, right: 24, top: 14, bottom: 28 })
    .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
    .borderRadius({ topLeft: 32, topRight: 32 })
    .shadow({ radius: 32, color: '#3A302A1A', offsetX: 0, offsetY: -6 })
  }
}
