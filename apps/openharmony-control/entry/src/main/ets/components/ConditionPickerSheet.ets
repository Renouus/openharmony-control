import { ConditionDraft } from '../model/page-view-state';

import { AppStateSnapshot } from '../model/app-state';

@Component
export struct ConditionPickerSheet {
  @Prop appState: AppStateSnapshot;
  onSelect: (condition: ConditionDraft) => void = () => {};

  build() {
    Column({ space: 16 }) {
      Text('选择触发条件')
        .fontSize(18)
        .fontWeight(FontWeight.Bold)
      
      List({ space: 10 }) {
        ListItem() {
          Text('定时触发')
            .fontSize(16)
            .padding(16)
            .width('100%')
            .onClick(() => {
              this.onSelect({ id: Date.now().toString(), type: 'time', time: '08:00' });
            })
        }
        .backgroundColor('#F5F5F5')
        .borderRadius(8)
        
        ListItem() {
          Text('设备状态变化')
            .fontSize(16)
            .padding(16)
            .width('100%')
            .onClick(() => {
              this.onSelect({ id: Date.now().toString(), type: 'device', deviceId: 'dev_1', property: '状态', operator: '==', threshold: '开' });
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
