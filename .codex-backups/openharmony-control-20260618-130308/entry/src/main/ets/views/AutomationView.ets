import { AutomationViewState, SceneCardState } from '../model/page-view-state';
import { AppStateSnapshot } from '../model/app-state-snapshot';
import { SceneCard } from '../components/SceneCard';
import { AppController } from '../controllers/AppController';
import { NavProxy } from '../controllers/NavProxy';
import { AppSymbol } from '../components/AppSymbol';
import {
  COLOR_ON_SURFACE,
  COLOR_OUTLINE_VARIANT,
  COLOR_PRIMARY,
  COLOR_PRIMARY_SOFT,
  COLOR_SURFACE_CONTAINER_HIGH,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';

@Component
export struct AutomationView {
  @ObjectLink appState: AppStateSnapshot;
  @ObjectLink automation: AutomationViewState;
  @Consume('controller') controller: AppController;
  @Consume('navStack') navStack: NavProxy;

  

  build() {
    Column({ space: 28 }) {
      Column({ space: 12 }) {
        Text('自动化')
          .fontSize(38)
          .fontWeight(FontWeight.Bold)
          .fontColor(COLOR_ON_SURFACE)
          .fontFamily('serif')
          .width('100%')

        Text('自动化您的家庭环境。')
          .fontSize(18)
          .fontColor(COLOR_TEXT_MUTED)
          .width('100%')
      }
      .width('100%')



      if (this.automation.scenes.filter((s: SceneCardState) => s.triggerTypeLabel !== 'manual').length === 0) {
        Column({ space: 10 }) {
          AppSymbol({ name: 'add', glyphSize: 32, color: COLOR_TEXT_MUTED })
          Text('暂无自动化')
            .fontSize(16)
            .fontColor(COLOR_TEXT_MUTED)
        }
        .width('100%')
        .padding({ top: 40, bottom: 40 })
        .alignItems(HorizontalAlign.Center)
        .borderRadius(20)
        .backgroundColor(COLOR_SURFACE_CONTAINER_HIGH)
        .onClick(() => {
          this.navStack.pushPathByName('createAutomation', null);
        })
      } else {
        Column({ space: 16 }) {
          ForEach(this.automation.scenes.filter((s: SceneCardState) => s.triggerTypeLabel !== 'manual'), (scene: SceneCardState) => {
            SceneCard({
              scene: scene,
              onToggle: (enabled: boolean) => {
                scene.enabled = enabled;
                // Since @ObjectLink doesn't do deep proxying automatically on array items,
                // we'll trigger a UI update by re-assigning the array
                this.automation.scenes = [...this.automation.scenes];
              },
              onRun: () => {
                console.info('执行自动化: ' + scene.name);
              },
              onEdit: () => {
                console.info('编辑自动化: ' + scene.name);
                // Future: Navigate to edit screen
              },
              onDelete: () => {
                this.automation.scenes = this.automation.scenes.filter((item: SceneCardState) => item.id !== scene.id);
              }
            })
          }, (s: SceneCardState) => s.id)
        }
        .width('100%')
      }

      Row() {
        Row({ space: 10 }) {
          AppSymbol({ name: 'add', glyphSize: 20, color: '#FFFFFF' })
          Text('新建自动化')
            .fontSize(14)
            .fontWeight(FontWeight.Medium)
            .fontColor('#FFFFFF')
        }
        .padding({ left: 20, right: 20, top: 14, bottom: 14 })
        .borderRadius(999)
        .backgroundColor(COLOR_PRIMARY)
        .shadow({ radius: 16, color: '#C2652A30', offsetX: 0, offsetY: 6 })
        .onClick(() => {
          this.navStack.pushPathByName('createAutomation', null);
        })
      }
      .width('100%')
      .justifyContent(FlexAlign.End)

      Row()
        .width('100%')
        .height(1)
        .backgroundColor(COLOR_OUTLINE_VARIANT + '66')

      if (this.automation.feedback.length > 0) {
        Text(this.automation.feedback)
          .fontSize(13)
          .fontColor(COLOR_PRIMARY)
          .padding(12)
          .borderRadius(12)
          .backgroundColor(COLOR_PRIMARY_SOFT)
          .width('100%')
      }
    }
    .width('100%')
    .alignItems(HorizontalAlign.Start)
  }
}
