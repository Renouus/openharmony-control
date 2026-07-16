import { HomeDeviceCardState } from '../model/page-view-state';
import { AppSymbol } from './AppSymbol';
import {
  COLOR_ON_PRIMARY,
  COLOR_ON_SURFACE,
  COLOR_OUTLINE_VARIANT,
  COLOR_PRIMARY,
  COLOR_PRIMARY_SOFT,
  COLOR_SECONDARY,
  COLOR_SURFACE_CONTAINER_HIGH,
  COLOR_SURFACE_CONTAINER_LOW,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';

@Component
export struct SmallDeviceCard {
  @Prop device: HomeDeviceCardState;
  @Prop fillHeight: boolean = false;
  onTap: () => void = () => {};
  onEdit: () => void = () => {};
  onDelete: () => void = () => {};

  private isOn(): boolean {
    if (this.device.kind === 'door-lock') {
      return !this.device.locked;
    }
    return this.device.power;
  }

  private iconText(): string {
    if (this.device.kind === 'door-lock') {
      return this.device.locked ? 'lock' : 'lock_open';
    }
    return this.device.icon;
  }

  @Builder
  private EditMenu() {
    Menu() {
      MenuItem({ content: '编辑设备' }).onClick(() => this.onEdit())
      MenuItem({ content: '删除设备' }).onClick(() => {
        AlertDialog.show({
          title: '确认删除设备',
          message: `确定要删除「${this.device.name}」吗？此操作不可撤销。`,
          primaryButton: { value: '取消', action: () => {} },
          secondaryButton: { value: '确认删除', fontColor: '#D32F2F', action: () => this.onDelete() },
        });
      })
    }
  }

  build() {
    Row({ space: 12 }) {
      Row() {
        AppSymbol({
          name: this.iconText(),
          glyphSize: 18,
          color: this.isOn() ? COLOR_ON_PRIMARY : COLOR_SECONDARY,
        })
      }
      .width(40)
      .height(40)
      .borderRadius(20)
      .backgroundColor(this.isOn() ? '#33FFFFFF' : COLOR_SURFACE_CONTAINER_HIGH)
      .justifyContent(FlexAlign.Center)

      Column({ space: 3 }) {
        Text(this.device.name)
          .fontSize(13)
          .fontWeight(FontWeight.Bold)
          .fontColor(this.isOn() ? COLOR_ON_PRIMARY : COLOR_ON_SURFACE)
          .maxLines(1)
          .textOverflow({ overflow: TextOverflow.Ellipsis })
        Text(this.device.statusLabel)
          .fontSize(11)
          .fontColor(this.isOn() ? COLOR_ON_PRIMARY + 'E6' : COLOR_TEXT_MUTED)
          .opacity(0.9)
      }
      .alignItems(HorizontalAlign.Start)
      .layoutWeight(1)
    }
    .padding(12)
    .borderRadius(16)
    .backgroundColor(this.isOn() ? COLOR_PRIMARY : COLOR_SURFACE_CONTAINER_LOW)
    .shadow(this.isOn() ? {
      radius: 16, color: '#C2652A33', offsetX: 0, offsetY: 6,
    } : {
      radius: 14, color: '#3A302A0D', offsetX: 0, offsetY: 4,
    })
    .width('100%')
    .height(this.fillHeight ? '100%' : undefined)
    .stateStyles({
      pressed: {
        .scale({ x: 0.95, y: 0.95 })
      },
      normal: {
        .scale({ x: 1, y: 1 })
      }
    })
    .onClick(() => this.onTap())
    .bindContextMenu(this.EditMenu(), ResponseType.LongPress)
    .animation({ duration: 250, curve: Curve.Friction })
  }
}

@Component
export struct LargeDeviceCard {
  @Prop device: HomeDeviceCardState;
  onTap: () => void = () => {};
  onEdit: () => void = () => {};
  onDelete: () => void = () => {};

  private usesPrimaryShell(): boolean {
    return this.device.kind === 'door-lock' || (this.device.kind !== 'air-conditioner' && this.device.power);
  }

  private iconText(): string {
    if (this.device.kind === 'door-lock') {
      return this.device.locked ? 'lock' : 'lock_open';
    }
    return this.device.icon;
  }

  @Builder
  private EditMenu() {
    Menu() {
      MenuItem({ content: '编辑设备' }).onClick(() => this.onEdit())
      MenuItem({ content: '删除设备' }).onClick(() => {
        AlertDialog.show({
          title: '确认删除设备',
          message: `确定要删除「${this.device.name}」吗？此操作不可撤销。`,
          primaryButton: { value: '取消', action: () => {} },
          secondaryButton: { value: '确认删除', fontColor: '#D32F2F', action: () => this.onDelete() },
        });
      })
    }
  }

  private isAc(): boolean {
    return this.device.kind === 'air-conditioner';
  }

  build() {
    Column() {
      if (!this.isAc()) {
        Row() {
          AppSymbol({
            name: this.iconText(),
            glyphSize: 20,
            color: this.usesPrimaryShell() ? COLOR_ON_PRIMARY : COLOR_SECONDARY,
          })
        }
        .width(40)
        .height(40)
        .borderRadius(20)
        .backgroundColor(this.usesPrimaryShell() ? '#33FFFFFF' : COLOR_SURFACE_CONTAINER_HIGH)
        .justifyContent(FlexAlign.Center)
        .margin({ bottom: 8 })
      }

      Blank()

      Column({ space: 3 }) {
        if (this.isAc() && this.device.temperature !== undefined) {
          Text(`${this.device.temperature}.0\u00B0`)
            .fontSize(32)
            .fontWeight(FontWeight.Bold)
            .fontColor(COLOR_PRIMARY)
            .fontFamily('serif')
            .margin({ top: 4 })
          Text(this.device.name)
            .fontSize(15)
            .fontWeight(FontWeight.Bold)
            .fontColor(COLOR_ON_SURFACE)
            .maxLines(1)
            .textOverflow({ overflow: TextOverflow.Ellipsis })
        } else {
          Text(this.device.name)
            .fontSize(15)
            .fontWeight(FontWeight.Bold)
            .fontColor(this.usesPrimaryShell() ? COLOR_ON_PRIMARY : COLOR_ON_SURFACE)
            .maxLines(1)
            .textOverflow({ overflow: TextOverflow.Ellipsis })
        }
        Text(this.device.statusLabel)
          .fontSize(12)
          .fontColor(this.usesPrimaryShell() ? COLOR_ON_PRIMARY + 'E6' : COLOR_TEXT_MUTED)
          .opacity(0.9)
      }
      .alignItems(HorizontalAlign.Start)
      .width('100%')
    }
    .padding(16)
    .borderRadius(20)
    .backgroundColor(this.usesPrimaryShell() ? COLOR_PRIMARY : COLOR_SURFACE_CONTAINER_LOW)
    .shadow(this.usesPrimaryShell() ? {
      radius: 16, color: '#C2652A33', offsetX: 0, offsetY: 6,
    } : {
      radius: 14, color: '#3A302A0D', offsetX: 0, offsetY: 4,
    })
    .width('100%')
    .aspectRatio(1)
    .alignItems(HorizontalAlign.Start)
    .stateStyles({
      pressed: {
        .scale({ x: 0.95, y: 0.95 })
      },
      normal: {
        .scale({ x: 1, y: 1 })
      }
    })
    .onClick(() => this.onTap())
    .bindContextMenu(this.EditMenu(), ResponseType.LongPress)
    .animation({ duration: 250, curve: Curve.Friction })
  }
}

interface DeviceChunk {
  id: string;
  large?: HomeDeviceCardState;
  smalls: HomeDeviceCardState[];
  reversed: boolean;
}

@Component
export struct DeviceGridLayout {
  @Prop devices: HomeDeviceCardState[];
  onDeviceTap: (deviceId: string, kind: string) => void = () => {};
  onDeviceEdit: (deviceId: string) => void = () => {};
  onDeviceDelete: (deviceId: string) => void = () => {};

  private getChunks(): DeviceChunk[] {
    const chunks: DeviceChunk[] = [];
    for (let i = 0; i < this.devices.length; i += 3) {
      let reversed = (i / 3) % 2 === 1;
      
      let large: HomeDeviceCardState | undefined = undefined;
      const smalls: HomeDeviceCardState[] = [];
      
      if (!reversed) {
        // 大卡片在左，小卡片在右。填充顺序：0 -> 大，1 -> 小，2 -> 小
        large = this.devices[i];
        if (i + 1 < this.devices.length) smalls.push(this.devices[i + 1]);
        if (i + 2 < this.devices.length) smalls.push(this.devices[i + 2]);
      } else {
        // 小卡片在左，大卡片在右。为保证从左向右的视觉填充，填充顺序：0 -> 小，1 -> 小，2 -> 大
        if (i < this.devices.length) smalls.push(this.devices[i]);
        if (i + 1 < this.devices.length) smalls.push(this.devices[i + 1]);
        if (i + 2 < this.devices.length) {
          large = this.devices[i + 2];
        }
      }

      const stateHash = [...smalls, ...(large ? [large] : [])]
        .map((d: HomeDeviceCardState) => `${d.id}_${d.power}_${d.locked}_${d.temperature}_${d.targetTemperature}_${d.brightness}`)
        .join('-');

      chunks.push({
        id: `chunk_${i}_${stateHash}`,
        large,
        smalls,
        reversed
      });
    }
    return chunks;
  }

  build() {
    Column({ space: 12 }) {
      ForEach(this.getChunks(), (chunk: DeviceChunk) => {
        Row({ space: 12 }) {
          if (!chunk.reversed) {
            // 左边是大卡片
            if (chunk.large) {
              LargeDeviceCard({
                device: chunk.large,
                onTap: () => this.onDeviceTap(chunk.large!.id, chunk.large!.kind),
                onEdit: () => this.onDeviceEdit(chunk.large!.id),
                onDelete: () => this.onDeviceDelete(chunk.large!.id)
              })
              .layoutWeight(1)
            } else {
              Blank().layoutWeight(1)
            }

            // 右边是小卡片
            if (chunk.smalls.length > 0) {
              Column({ space: 12 }) {
                ForEach(chunk.smalls, (smallDev: HomeDeviceCardState) => {
                  SmallDeviceCard({
                    device: smallDev,
                    fillHeight: !!chunk.large && chunk.smalls.length === 2,
                    onTap: () => this.onDeviceTap(smallDev.id, smallDev.kind),
                    onEdit: () => this.onDeviceEdit(smallDev.id),
                    onDelete: () => this.onDeviceDelete(smallDev.id)
                  })
                  .layoutWeight(!!chunk.large && chunk.smalls.length === 2 ? 1 : 0)
                }, (dev: HomeDeviceCardState) => dev.id)
              }
              .layoutWeight(1)
              .aspectRatio(chunk.large ? 1 : undefined)
              .justifyContent(FlexAlign.Start)
            } else {
              Blank().layoutWeight(1)
            }
          } else {
            // 逆序：左边是小卡片
            if (chunk.smalls.length > 0) {
              Column({ space: 12 }) {
                ForEach(chunk.smalls, (smallDev: HomeDeviceCardState) => {
                  SmallDeviceCard({
                    device: smallDev,
                    fillHeight: !!chunk.large && chunk.smalls.length === 2,
                    onTap: () => this.onDeviceTap(smallDev.id, smallDev.kind),
                    onEdit: () => this.onDeviceEdit(smallDev.id),
                    onDelete: () => this.onDeviceDelete(smallDev.id)
                  })
                  .layoutWeight(!!chunk.large && chunk.smalls.length === 2 ? 1 : 0)
                }, (dev: HomeDeviceCardState) => dev.id)
              }
              .layoutWeight(1)
              .aspectRatio(chunk.large ? 1 : undefined)
              .justifyContent(FlexAlign.Start)
            } else {
              Blank().layoutWeight(1)
            }

            // 逆序：右边是大卡片
            if (chunk.large) {
              LargeDeviceCard({
                device: chunk.large,
                onTap: () => this.onDeviceTap(chunk.large!.id, chunk.large!.kind),
                onEdit: () => this.onDeviceEdit(chunk.large!.id),
                onDelete: () => this.onDeviceDelete(chunk.large!.id)
              })
              .layoutWeight(1)
            } else {
              Blank().layoutWeight(1)
            }
          }
        }
        .width('100%')
        .alignItems(VerticalAlign.Top)
      }, (chunk: DeviceChunk) => chunk.id)
    }
    .width('100%')
  }
}
