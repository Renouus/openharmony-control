import {
  COLOR_ON_PRIMARY,
  COLOR_ON_SURFACE,
  COLOR_OUTLINE_VARIANT,
  COLOR_PRIMARY,
  COLOR_PRIMARY_SOFT,
  COLOR_SURFACE_CONTAINER_HIGH,
  COLOR_SURFACE_CONTAINER_HIGHEST,
  COLOR_SURFACE_CONTAINER_LOW,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';
import { AppSymbol } from './AppSymbol';
import camera from '@ohos.multimedia.camera';
import abilityAccessCtrl from '@ohos.abilityAccessCtrl';
import common from '@ohos.app.ability.common';
import { AppController } from '../controllers/AppController';
import { AppStateSnapshot } from '../model/app-state-snapshot';
import { PendingDeviceState, RoomItemState } from '../model/page-view-state';

class RecommendedDeviceCode {
  icon: string;
  label: string;
  deviceCode: string;
  hint: string;

  constructor(icon: string, label: string, deviceCode: string, hint: string) {
    this.icon = icon;
    this.label = label;
    this.deviceCode = deviceCode;
    this.hint = hint;
  }
}

const RECOMMENDED_DEVICE_CODES: RecommendedDeviceCode[] = [
  new RecommendedDeviceCode('lightbulb', '阅读灯', 'LIGHT-READING', '可调光灯具'),
  new RecommendedDeviceCode('lock', '庭院门锁', 'LOCK-PATIO', '户外安全门锁'),
  new RecommendedDeviceCode('thermostat', '书房空调', 'AC-STUDY', '冷暖空调设备'),
];

@Component
export struct AddDeviceSheet {
  @Consume('controller') controller: AppController;
  @ObjectLink appState: AppStateSnapshot;
  onClose: () => void = () => {};

  @State hasCameraPermission: boolean = false;
  @State deviceCode: string = '';
  @State selectedRoomId: string = 'living-room';
  @State isSubmitting: boolean = false;
  @State errorMessage: string = '';
  @State successMessage: string = '';

  private cameraManager: camera.CameraManager | undefined;
  private cameraSession: camera.CaptureSession | undefined;
  private previewOutput: camera.PreviewOutput | undefined;
  private cameraInput: camera.CameraInput | undefined;
  private xComponentController: XComponentController = new XComponentController();

  aboutToAppear() {
    this.requestCameraPermission();
    this.selectedRoomId = this.defaultRoomId();
  }

  aboutToDisappear() {
    this.releaseCamera();
  }

  private defaultRoomId(): string {
    const livingRoom = this.appState.roomList.rooms.find((room: RoomItemState) => room.id === 'living-room');
    if (livingRoom !== undefined) {
      return livingRoom.id;
    }
    const firstRoom = this.appState.roomList.rooms.length > 0 ? this.appState.roomList.rooms[0] : undefined;
    return firstRoom?.id ?? 'living-room';
  }

  private roomLabel(roomId: string): string {
    const room = this.appState.roomList.rooms.find((item: RoomItemState) => item.id === roomId);
    return room?.name ?? roomId;
  }

  private isRoomSelected(roomId: string): boolean {
    return roomId === this.selectedRoomId;
  }

  async requestCameraPermission() {
    const context = getContext(this) as common.UIAbilityContext;
    const atManager = abilityAccessCtrl.createAtManager();
    try {
      const data = await atManager.requestPermissionsFromUser(context, ['ohos.permission.CAMERA']);
      if (data.authResults[0] === 0) {
        this.hasCameraPermission = true;
      }
    } catch (e) {
      console.error('Camera permission request failed', JSON.stringify(e));
    }
  }

  async initCamera(surfaceId: string) {
    if (!this.hasCameraPermission) {
      return;
    }
    try {
      this.cameraManager = camera.getCameraManager(getContext(this));
      const cameras = this.cameraManager.getSupportedCameras();
      const rearCamera = cameras.find((item) => item.cameraPosition === camera.CameraPosition.CAMERA_POSITION_BACK) || cameras[0];
      if (!rearCamera) {
        return;
      }

      this.cameraInput = this.cameraManager.createCameraInput(rearCamera);
      await this.cameraInput.open();

      const cameraOutputCapability = this.cameraManager.getSupportedOutputCapability(rearCamera, camera.SceneMode.NORMAL_VIDEO);
      const previewProfile = cameraOutputCapability.previewProfiles[0];

      this.previewOutput = this.cameraManager.createPreviewOutput(previewProfile, surfaceId);

      this.cameraSession = this.cameraManager.createCaptureSession();
      this.cameraSession.beginConfig();
      this.cameraSession.addInput(this.cameraInput);
      this.cameraSession.addOutput(this.previewOutput);
      await this.cameraSession.commitConfig();
      await this.cameraSession.start();
    } catch (e) {
      console.error('Failed to init camera', JSON.stringify(e));
    }
  }

  releaseCamera() {
    try {
      this.cameraSession?.stop();
      this.cameraSession?.release();
      this.cameraInput?.close();
      this.previewOutput?.release();
    } catch (e) {
      console.error('Failed to release camera', JSON.stringify(e));
    }
  }

  private applyRecommendedCode(deviceCode: string): void {
    this.deviceCode = deviceCode;
    this.errorMessage = '';
    this.successMessage = '';
  }

  private async submitCreateDevice(): Promise<void> {
    if (this.deviceCode.trim().length === 0 || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const result = await this.controller.handleCreateDevice(
      this.appState,
      this.deviceCode.trim(),
      this.selectedRoomId,
    );

    this.isSubmitting = false;
    if (result.success) {
      this.successMessage = result.message;
      this.onClose();
      return;
    }

    this.errorMessage = result.message;
  }

  private async submitJoinPendingDevice(device: PendingDeviceState): Promise<void> {
    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';
    const message = await this.controller.handleJoinPendingDevice(
      this.appState,
      device.id,
      this.selectedRoomId,
      device.deviceType,
      device.name,
    );
    this.isSubmitting = false;
    this.successMessage = message;
  }

  private async submitRejectPendingDevice(deviceId: string): Promise<void> {
    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';
    const message = await this.controller.handleRejectPendingDevice(this.appState, deviceId);
    this.isSubmitting = false;
    this.successMessage = message;
  }

  build() {
    Column({ space: 22 }) {
      Row()
        .width(48)
        .height(5)
        .borderRadius(3)
        .backgroundColor(COLOR_OUTLINE_VARIANT)
        .margin({ top: 6 })

      Scroll() {
        Column({ space: 22 }) {
          Row() {
            Text('添加设备')
          .fontSize(28)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_ON_SURFACE)
          .fontFamily('serif')
          .layoutWeight(1)
      }
      .width('100%')

      Text('扫描功能当前为视觉预览版。请于下方手动输入支持的设备码以完成设置。')
        .fontSize(13)
        .fontColor(COLOR_TEXT_MUTED)
        .width('100%')

      Stack({ alignContent: Alignment.Center }) {
        if (this.hasCameraPermission) {
          XComponent({ id: 'add_device_camera', type: XComponentType.SURFACE, controller: this.xComponentController })
            .onLoad(() => {
              const surfaceId = this.xComponentController.getXComponentSurfaceId();
              this.initCamera(surfaceId);
            })
            .width('100%')
            .height('100%')
            .borderRadius(32)
        } else {
          Column({ space: 18 }) {
            Row() {
              AppSymbol({ name: 'qr_code_scanner', glyphSize: 42, color: COLOR_PRIMARY })
            }
            .width(88)
            .height(88)
            .borderRadius(44)
            .backgroundColor(COLOR_PRIMARY + '12')
            .justifyContent(FlexAlign.Center)

            Text('相机预览')
              .fontSize(18)
              .fontWeight(FontWeight.Medium)
              .fontColor(COLOR_ON_SURFACE)

            Text('如需体验视觉配网预览，请授权相机访问。下方的设备码手动录入功能已完全就绪。')
              .fontSize(12)
              .fontColor(COLOR_TEXT_MUTED)
              .textAlign(TextAlign.Center)
          }
          .alignItems(HorizontalAlign.Center)
        }

        Row()
          .width('78%')
          .height('78%')
          .borderRadius(28)
          .border({ width: 2, color: COLOR_PRIMARY + '40' })
      }
      .width('100%')
      .height(248)
      .borderRadius(32)
      .clip(true)
      .backgroundColor(COLOR_SURFACE_CONTAINER_HIGHEST)
      .padding(this.hasCameraPermission ? 0 : 24)

      Column({ space: 14 }) {
        Text('手动输入')
          .fontSize(15)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_ON_SURFACE)
          .width('100%')

        TextInput({ placeholder: '请输入设备码', text: this.deviceCode })
          .height(52)
          .fontSize(15)
          .borderRadius(16)
          .backgroundColor('#FFFFFF')
          .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '80' })
          .onChange((value: string) => {
            this.deviceCode = value;
            this.errorMessage = '';
            this.successMessage = '';
          })

        Text(`所属房间: ${this.roomLabel(this.selectedRoomId)}`)
          .fontSize(12)
          .fontColor(COLOR_TEXT_MUTED)
          .width('100%')

        Scroll() {
          Row({ space: 10 }) {
            ForEach(this.appState.roomList.rooms, (room: RoomItemState) => {
              this.RoomChip(room)
            }, (room: RoomItemState) => room.id)
          }
          .padding({ right: 4 })
        }
        .scrollable(ScrollDirection.Horizontal)
        .scrollBar(BarState.Off)
        .width('100%')

        if (this.errorMessage.length > 0) {
          Text(this.errorMessage)
            .fontSize(12)
            .fontColor('#B42318')
            .padding(12)
            .borderRadius(14)
            .backgroundColor('#FEF3F2')
            .width('100%')
        }

        if (this.successMessage.length > 0) {
          Text(this.successMessage)
            .fontSize(12)
            .fontColor(COLOR_PRIMARY)
            .padding(12)
            .borderRadius(14)
            .backgroundColor(COLOR_PRIMARY_SOFT)
            .width('100%')
        }

        Button(this.isSubmitting ? '正在添加...' : '添加设备')
          .width('100%')
          .height(52)
          .fontSize(16)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_ON_PRIMARY)
          .backgroundColor(this.deviceCode.trim().length === 0 ? COLOR_OUTLINE_VARIANT : COLOR_PRIMARY)
          .borderRadius(26)
          .enabled(this.deviceCode.trim().length > 0 && !this.isSubmitting)
          .onClick(async () => {
            await this.submitCreateDevice();
          })
      }
      .width('100%')

      if (this.appState.home.pendingDevices.length > 0) {
        Column({ space: 12 }) {
          Text('待审设备')
            .fontSize(15)
            .fontWeight(FontWeight.Medium)
            .fontColor(COLOR_ON_SURFACE)
            .width('100%')

          Text(`将这些设备分配至${this.roomLabel(this.selectedRoomId)}，或者暂不处理。`)
            .fontSize(12)
            .fontColor(COLOR_TEXT_MUTED)
            .width('100%')

          Column({ space: 10 }) {
            ForEach(this.appState.home.pendingDevices, (device: PendingDeviceState) => {
              this.PendingDeviceCard(device)
            }, (device: PendingDeviceState) => device.id)
          }
          .width('100%')
        }
        .width('100%')
      }

      Column({ space: 12 }) {
        Text('推荐设备码')
          .fontSize(15)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_ON_SURFACE)
          .width('100%')

        Row({ space: 12 }) {
          ForEach(RECOMMENDED_DEVICE_CODES, (item: RecommendedDeviceCode) => {
            this.RecommendedCodeCard(item)
          }, (item: RecommendedDeviceCode) => item.deviceCode)
        }
        .width('100%')
      }
      .width('100%')
      } // Closes inner Column 
      .width('100%')      
    } // Closes Scroll
    .scrollBar(BarState.Auto)
    .scrollable(ScrollDirection.Vertical)
    .layoutWeight(1)
    .width('100%')
  } // Closes outer root Column
  .width('100%')
  .height('100%')
  .padding({ left: 24, right: 24, top: 14, bottom: 28 })
  .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
  .borderRadius(32)
  .shadow({ radius: 32, color: '#3A302A1A', offsetX: 0, offsetY: -6 })
  .parallelGesture(
    PanGesture({ direction: PanDirection.Vertical })
      .onActionUpdate((event: GestureEvent | undefined) => {
        if (event && event.offsetY > 100) {
          this.onClose();
        }
      })
  )
  .onClick(() => {})
} // Closes build()

  @Builder
  private RoomChip(room: RoomItemState) {
    Row({ space: 8 }) {
      AppSymbol({
        name: room.icon,
        glyphSize: 16,
        color: this.isRoomSelected(room.id) ? COLOR_ON_PRIMARY : COLOR_PRIMARY,
      })
      Text(room.name)
        .fontSize(13)
        .fontWeight(FontWeight.Medium)
        .fontColor(this.isRoomSelected(room.id) ? COLOR_ON_PRIMARY : COLOR_ON_SURFACE)
    }
    .padding({ left: 16, right: 16, top: 10, bottom: 10 })
    .borderRadius(20)
    .backgroundColor(this.isRoomSelected(room.id) ? COLOR_PRIMARY : '#FFFFFF')
    .border({ width: 1, color: this.isRoomSelected(room.id) ? COLOR_PRIMARY : COLOR_OUTLINE_VARIANT + '66' })
    .onClick(() => {
      this.selectedRoomId = room.id;
      this.errorMessage = '';
      this.successMessage = '';
    })
  }

  @Builder
  private RecommendedCodeCard(item: RecommendedDeviceCode) {
    Column({ space: 10 }) {
      Row() {
        AppSymbol({ name: item.icon, glyphSize: 20, color: COLOR_PRIMARY })
      }
      .width(44)
      .height(44)
      .borderRadius(22)
      .backgroundColor(COLOR_SURFACE_CONTAINER_HIGH)
      .justifyContent(FlexAlign.Center)

      Text(item.label)
        .fontSize(12)
        .fontWeight(FontWeight.Medium)
        .fontColor(COLOR_ON_SURFACE)

      Text(item.deviceCode)
        .fontSize(11)
        .fontColor(COLOR_TEXT_MUTED)

      Text(item.hint)
        .fontSize(10)
        .fontColor(COLOR_TEXT_MUTED)
        .textAlign(TextAlign.Center)
    }
    .layoutWeight(1)
    .padding({ left: 10, right: 10, top: 16, bottom: 16 })
    .borderRadius(18)
    .backgroundColor('#FFFFFF')
    .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' })
    .onClick(() => {
      this.applyRecommendedCode(item.deviceCode);
    })
  }

  @Builder
  private PendingDeviceCard(device: PendingDeviceState) {
    Column({ space: 10 }) {
      Row({ space: 10 }) {
        Row() {
          AppSymbol({ name: 'inventory_2', glyphSize: 18, color: COLOR_PRIMARY })
        }
        .width(40)
        .height(40)
        .borderRadius(20)
        .backgroundColor(COLOR_SURFACE_CONTAINER_HIGH)
        .justifyContent(FlexAlign.Center)

        Column({ space: 2 }) {
          Text(device.name)
            .fontSize(14)
            .fontWeight(FontWeight.Medium)
            .fontColor(COLOR_ON_SURFACE)
          Text(`${device.provider} · ${device.deviceType} · ${device.online ? 'online' : 'offline'}`)
            .fontSize(11)
            .fontColor(COLOR_TEXT_MUTED)
        }
        .layoutWeight(1)
        .alignItems(HorizontalAlign.Start)
      }
      .width('100%')

      Row({ space: 10 }) {
        Button(this.isSubmitting ? '正在加入...' : '添加到房间')
          .layoutWeight(1)
          .height(42)
          .fontSize(14)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_ON_PRIMARY)
          .backgroundColor(COLOR_PRIMARY)
          .borderRadius(21)
          .enabled(!this.isSubmitting)
          .onClick(async () => {
            await this.submitJoinPendingDevice(device);
          })

        Button('忽略')
          .layoutWeight(1)
          .height(42)
          .fontSize(14)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_ON_SURFACE)
          .backgroundColor('#FFFFFF')
          .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '80' })
          .borderRadius(21)
          .enabled(!this.isSubmitting)
          .onClick(async () => {
            await this.submitRejectPendingDevice(device.id);
          })
      }
      .width('100%')
    }
    .width('100%')
    .padding(14)
    .borderRadius(18)
    .backgroundColor('#FFFFFF')
    .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' })
  }
}
