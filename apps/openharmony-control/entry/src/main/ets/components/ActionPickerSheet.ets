import { ActionDraft } from '../model/page-view-state';

@Component
export struct ActionPickerSheet {
  @Prop onSelect: (action: ActionDraft) => void = () => {};

  build() {
    Column({ space: 16 }) {
      Text('选择执行动作')
        .fontSize(18)
        .fontWeight(FontWeight.Bold)
      
      List({ space: 10 }) {
        ListItem() {
          Text('执行场景')
            .fontSize(16)
            .padding(16)
            .width('100%')
            .onClick(() => {
              this.onSelect({ id: Date.now().toString(), type: 'scene', sceneId: 'scene_1' });
            })
        }
        .backgroundColor('#F5F5F5')
        .borderRadius(8)
        
        ListItem() {
          Text('控制设备')
            .fontSize(16)
            .padding(16)
            .width('100%')
            .onClick(() => {
              this.onSelect({ id: Date.now().toString(), type: 'device', deviceId: 'dev_1', command: '开启' });
            })
        }
        .backgroundColor('#F5F5F5')
        .borderRadius(8)
      }
    }
    .padding(24)
    .width('100%')
    .alignItems(HorizontalAlign.Start)
  }
}
