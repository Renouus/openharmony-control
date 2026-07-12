import { AppStateSnapshot } from '../model/app-state-snapshot';
import {
  createEditSceneEditorRoute,
  createGlobalSceneEditorRoute,
  createRoomSceneEditorRoute,
  DeviceActionState,
  SceneCardState,
  ScenesViewState
} from '../model/page-view-state';
import { AppController } from '../controllers/AppController';
import { NavProxy } from '../controllers/NavProxy';
import { AppSymbol } from '../components/AppSymbol';
import {
  COLOR_ON_PRIMARY_CONTAINER,
  COLOR_ON_SURFACE,
  COLOR_OUTLINE_VARIANT,
  COLOR_PRIMARY,
  COLOR_PRIMARY_CONTAINER,
  COLOR_SECONDARY_CONTAINER,
  COLOR_SURFACE_CONTAINER_LOW,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';

@Component
export struct ScenesListView {
  @ObjectLink appState: AppStateSnapshot;
  @ObjectLink scenes: ScenesViewState;
  @Prop routeParam: Object | null = null;
  @Consume('controller') controller: AppController;
  @Consume('navStack') navStack: NavProxy;

  @Builder
  SceneMenu(sceneId: string) {
    Menu() {
      MenuItem({ content: 'Edit scene' })
        .onClick(() => {
          const route = createEditSceneEditorRoute(sceneId);
          this.navStack.pushPathByName(route.page, route.param);
        })
      MenuItem({ content: 'Delete scene' })
        .onClick(() => {
          this.controller.handleDeleteScene(this.appState, sceneId);
        })
    }
  }

  private getIconBackground(index: number): string {
    return index % 2 === 0 ? COLOR_SECONDARY_CONTAINER : COLOR_PRIMARY_CONTAINER;
  }

  private getIconColor(index: number): string {
    return index % 2 === 0 ? COLOR_PRIMARY : COLOR_ON_PRIMARY_CONTAINER;
  }

  private getIconName(index: number): string {
    const icons = ['movie', 'wb_sunny', 'spa', 'nightlight'];
    return icons[index % icons.length];
  }

  // 用于确定是从哪个房间进来的
  private targetRoomId(): string | null {
    if (this.routeParam) {
      if (typeof this.routeParam === 'object') {
        const paramStr = JSON.stringify(this.routeParam);
        if (paramStr.includes('"roomId"')) {
          const matched = paramStr.match(/"roomId"\s*:\s*"([^"]+)"/);
          if (matched && matched[1]) {
            return matched[1];
          }
        }
      }
    }
    return null;
  }

  // 根据当前上下文筛选需要显示的场景
  private getFilteredScenes(): SceneCardState[] {
    const roomId = this.targetRoomId();
    if (!roomId) {
      // 修复：当从首页进入全局视角时，只能看到未挂载房间的“全局场景”
      return this.scenes.items.filter((scene: SceneCardState) => !scene.roomId); 
    }
    // 当从房间进入时，只看挂载在该房间下的场景
    return this.scenes.items.filter((scene: SceneCardState) => scene.roomId === roomId);
  }

  build() {
    Column({ space: 24 }) {
      Text('Scenes')
        .fontSize(38)
        .fontWeight(FontWeight.Bold)
        .fontColor(COLOR_PRIMARY)
        .fontFamily('serif')
        .width('100%')

      Column({ space: 20 }) {
        ForEach(this.getFilteredScenes(), (scene: SceneCardState, index: number) => {
          Column() {
            Row() {
              Row({ space: 16 }) {
                Row() {
                  AppSymbol({
                    name: scene.icon || this.getIconName(index),
                    glyphSize: 20,
                    color: this.getIconColor(index),
                  })
                }
                .width(40)
                .height(40)
                .borderRadius(20)
                .backgroundColor(this.getIconBackground(index))
                .justifyContent(FlexAlign.Center)

                Column({ space: 4 }) {
                  Text(scene.name)
                    .fontSize(24)
                    .fontWeight(FontWeight.Medium)
                    .fontColor(COLOR_ON_SURFACE)
                    .fontFamily('serif')
                  Text(`${scene.actions.length} actions configured`)
                    .fontSize(14)
                    .fontColor(COLOR_TEXT_MUTED)
                }
                .alignItems(HorizontalAlign.Start)
              }
              .layoutWeight(1)

              AppSymbol({ name: 'more_horiz', glyphSize: 24, color: COLOR_TEXT_MUTED })
                .bindMenu(this.SceneMenu(scene.id))
            }
            .width('100%')
            .alignItems(VerticalAlign.Top)

            if (scene.deviceActions && scene.deviceActions.length > 0) {
              Row({ space: 8 }) {
                ForEach(scene.deviceActions, (action: DeviceActionState) => {
                  Row({ space: 4 }) {
                    AppSymbol({ name: action.icon, glyphSize: 14, color: COLOR_TEXT_MUTED })
                    Text(action.text)
                      .fontSize(12)
                      .fontColor(COLOR_TEXT_MUTED)
                  }
                  .padding({ left: 8, right: 8, top: 4, bottom: 4 })
                  .backgroundColor(COLOR_SECONDARY_CONTAINER)
                  .borderRadius(6)
                }, (action: DeviceActionState) => action.text)
              }
              .width('100%')
              .margin({ top: 16 })
            }
          }
          .width('100%')
          .padding(24)
          .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
          .borderRadius(16)
          .shadow({ radius: 16, color: '#3A302A0A', offsetX: 0, offsetY: 2 })
          .onClick(() => {
            const route = createEditSceneEditorRoute(scene.id);
            this.navStack.pushPathByName(route.page, route.param);
          })
        }, (scene: SceneCardState) => scene.id)

        Row({ space: 12 }) {
          Row() {
            AppSymbol({ name: 'add', glyphSize: 20, color: COLOR_TEXT_MUTED })
          }
          .width(48)
          .height(48)
          .borderRadius(24)
          .backgroundColor(COLOR_SECONDARY_CONTAINER)
          .justifyContent(FlexAlign.Center)

          Text('Create New Scene')
            .fontSize(16)
            .fontWeight(FontWeight.Medium)
            .fontColor(COLOR_TEXT_MUTED)
        }
        .width('100%')
        .padding(24)
        .justifyContent(FlexAlign.Center)
        .border({ width: 1, color: COLOR_OUTLINE_VARIANT, style: BorderStyle.Dashed })
        .borderRadius(16)
        .onClick(() => {
          const roomId = this.targetRoomId();
          if (roomId) {
            const route = createRoomSceneEditorRoute(roomId);
            this.navStack.pushPathByName(route.page, route.param);
          } else {
            const route = createGlobalSceneEditorRoute();
            this.navStack.pushPathByName(route.page, route.param);
          }
        })
      }
      .width('100%')
    }
    .width('100%')
    .alignItems(HorizontalAlign.Start)
  }
}
