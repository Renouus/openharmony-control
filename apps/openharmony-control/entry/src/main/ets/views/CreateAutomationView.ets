import { RoutineDraft, ConditionDraft, ActionDraft } from '../model/page-view-state';
import { AppSymbol } from '../components/AppSymbol';
import { ConditionPickerSheet } from '../components/ConditionPickerSheet';
import { ActionPickerSheet } from '../components/ActionPickerSheet';
import { COLOR_ON_SURFACE, COLOR_SURFACE, COLOR_PRIMARY, COLOR_OUTLINE_VARIANT, COLOR_TEXT_MUTED } from '../theme/smart-home-theme';

@Component
export struct CreateAutomationView {
  @State draft: RoutineDraft = { name: '', conditions: [], actions: [] };
  @State showConditionSheet: boolean = false;
  @State showActionSheet: boolean = false;
  onCancel: () => void = () => {};
  onSave: (draft: RoutineDraft) => void = () => {};

  build() {
    Column() {
      // Header
      Row() {
        Text('取消')
          .fontSize(16)
          .fontColor(COLOR_TEXT_MUTED)
          .onClick(() => {
            this.onCancel();
          })
        Text('新建自动化')
          .fontSize(18)
          .fontWeight(FontWeight.Bold)
          .fontColor(COLOR_ON_SURFACE)
          .layoutWeight(1)
          .textAlign(TextAlign.Center)
        Text('保存')
          .fontSize(16)
          .fontColor(COLOR_PRIMARY)
          .onClick(() => {
            if (!this.draft.name) {
              console.error('Validation: Name is required');
              return;
            }
            if (this.draft.conditions.length === 0 || this.draft.actions.length === 0) {
              console.error('Validation: Must have at least 1 condition and 1 action');
              return;
            }
            console.info('Saving Draft:', JSON.stringify(this.draft));
            this.onSave(this.draft);
          })
      }
      .width('100%')
      .height(56)
      .padding({ left: 16, right: 16 })


      Scroll() {
        Column({ space: 24 }) {
          // Name Input
          TextInput({ placeholder: '自动化名称', text: this.draft.name })
            .onChange((value: string) => {
              this.draft.name = value;
            })
            .backgroundColor(COLOR_SURFACE)
            .height(56)
            .width('100%')

          // Conditions
          Column({ space: 12 }) {
            Text('如果...')
              .fontSize(16)
              .fontWeight(FontWeight.Bold)
              .fontColor(COLOR_ON_SURFACE)
            
            ForEach(this.draft.conditions, (cond: ConditionDraft, index: number) => {
              Row() {
                Text(cond.type === 'time' ? '定时: ' + cond.time : '设备状态')
                  .layoutWeight(1)
                  .fontSize(16)
                Text('X')
                  .fontSize(16)
                  .fontColor('#FF4444')
                  .onClick(() => {
                    let newCond = [...this.draft.conditions];
                    newCond.splice(index, 1);
                    this.draft.conditions = newCond;
                  })
              }
              .width('100%')
              .padding(16)
              .backgroundColor('#F5F5F5')
              .borderRadius(8)
            })
            
            Button('+ 添加条件', { type: ButtonType.Normal })
              .width('100%')
              .height(48)
              .backgroundColor(Color.Transparent)
              .fontColor(COLOR_PRIMARY)
              .border({ width: 1, color: COLOR_OUTLINE_VARIANT, style: BorderStyle.Dashed })
              .borderRadius(12)
              .onClick(() => {
                this.showConditionSheet = true;
              })
              .bindSheet($$this.showConditionSheet, this.ConditionSheetBuilder(), { height: SheetSize.MEDIUM })
          }
          .width('100%')
          .alignItems(HorizontalAlign.Start)

          // Actions
          Column({ space: 12 }) {
            Text('就执行...')
              .fontSize(16)
              .fontWeight(FontWeight.Bold)
              .fontColor(COLOR_ON_SURFACE)
            
            ForEach(this.draft.actions, (action: ActionDraft, index: number) => {
              Row() {
                Text(action.type === 'scene' ? '场景' : '设备')
                  .layoutWeight(1)
                  .fontSize(16)
                Text('X')
                  .fontSize(16)
                  .fontColor('#FF4444')
                  .onClick(() => {
                    let newAct = [...this.draft.actions];
                    newAct.splice(index, 1);
                    this.draft.actions = newAct;
                  })
              }
              .width('100%')
              .padding(16)
              .backgroundColor('#F5F5F5')
              .borderRadius(8)
            })
            
            Button('+ 添加动作', { type: ButtonType.Normal })
              .width('100%')
              .height(48)
              .backgroundColor(Color.Transparent)
              .fontColor(COLOR_PRIMARY)
              .border({ width: 1, color: COLOR_OUTLINE_VARIANT, style: BorderStyle.Dashed })
              .borderRadius(12)
              .onClick(() => {
                this.showActionSheet = true;
              })
              .bindSheet($$this.showActionSheet, this.ActionSheetBuilder(), { height: SheetSize.MEDIUM })
          }
          .width('100%')
          .alignItems(HorizontalAlign.Start)
        }
        .padding(16)
        .width('100%')
      }
      .layoutWeight(1)
    }
    .width('100%')
    .height('100%')
    .backgroundColor(COLOR_SURFACE)
    .justifyContent(FlexAlign.Start)
  }

  @Builder
  ConditionSheetBuilder() {
    ConditionPickerSheet({
      onSelect: (condition) => {
        this.draft.conditions = [...this.draft.conditions, condition];
        this.showConditionSheet = false;
      }
    })
  }

  @Builder
  ActionSheetBuilder() {
    ActionPickerSheet({
      onSelect: (action) => {
        this.draft.actions = [...this.draft.actions, action];
        this.showActionSheet = false;
      }
    })
  }
}
