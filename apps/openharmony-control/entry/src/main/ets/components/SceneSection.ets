import { createGlobalSceneEditorRoute, createRoomSceneEditorRoute, SceneChipState } from '../model/page-view-state';
import { AppStateSnapshot } from '../model/app-state-snapshot';
import { AppController } from '../controllers/AppController';
import { NavProxy } from '../controllers/NavProxy';
import { AppSymbol } from './AppSymbol';
import { SceneChip } from './SceneChip';
import {
  COLOR_ON_SURFACE,
  COLOR_PRIMARY,
  COLOR_SURFACE_CONTAINER_LOW,
} from '../theme/smart-home-theme';

@Component
export struct SceneSection {
  @ObjectLink appState: AppStateSnapshot;
  @Prop scenes: SceneChipState[];
  @Prop title: string = '场景';
  @Prop roomId: string = ''; // 为空表示全屋场景
  @Consume('controller') controller: AppController;
  @Consume('navStack') navStack: NavProxy;

  build() {
    Column({ space: 14 }) {
      Row({ space: 4 }) {
        Text(this.title)
          .fontSize(22)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_ON_SURFACE)
          .fontFamily('serif')

        Row() {
          AppSymbol({ name: 'chevron_right', glyphSize: 18, color: COLOR_PRIMARY })
        }
        .padding(4)
        .onClick(() => {
          if (this.roomId) {
            class RoomParam {
              roomId: string = '';
            }
            const param = new RoomParam();
            param.roomId = this.roomId;
            this.navStack.pushPathByName('scenesList', param);
          } else {
            this.navStack.pushPathByName('scenesList', null);
          }
        })

        Blank()
      }
      .width('100%')

      if (this.scenes.length > 0) {
        Scroll() {
          Row({ space: 14 }) {
            ForEach(this.scenes, (scene: SceneChipState) => {
              SceneChip({
                scene,
                onTap: () => {
                  this.controller.handleHomeRunScene(this.appState, scene.id)
                },
              })
            }, (scene: SceneChipState) => `${scene.id}_${scene.active}`)
          }
          .justifyContent(FlexAlign.Start)
          .padding({ left: 0, right: 20, top: 6, bottom: 16 })
        }
        .scrollable(ScrollDirection.Horizontal)
        .scrollBar(BarState.Off)
        .width('100%')
      }
    }
    .width('100%')
  }
}
