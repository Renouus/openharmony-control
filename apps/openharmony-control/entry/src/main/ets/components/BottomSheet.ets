import { COLOR_OUTLINE_VARIANT, COLOR_SURFACE_CONTAINER_LOW } from '../theme/smart-home-theme';

@Component
export struct BottomSheet {
  @BuilderParam content: () => void;
  onClose: () => void = () => {};

  build() {
    Column() {
      // 1. Gesture Handle Zone
      Column({ space: 6 }) {
        Row()
          .width(48)
          .height(5)
          .borderRadius(3)
          .backgroundColor(COLOR_OUTLINE_VARIANT)
          .margin({ top: 6 })
      }
      .width('100%')
      .justifyContent(FlexAlign.Center)
      .parallelGesture(
        PanGesture({ direction: PanDirection.Vertical })
          .onActionUpdate((event: GestureEvent | undefined) => {
            if (event && event.offsetY > 150) {
              this.onClose();
            }
          })
      )

      // 2. Generic Content Zone
      Scroll() {
         this.content()
      }
      .scrollBar(BarState.Off)
      .scrollable(ScrollDirection.Vertical)
      .layoutWeight(1)
      .width('100%')
      
    } 
    .width('100%')
    .constraintSize({ maxHeight: '90%' })
    .padding({ left: 24, right: 24, top: 14, bottom: 28 })
    .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
    .borderRadius({ topLeft: 32, topRight: 32 })
    .shadow({ radius: 32, color: '#3A302A1A', offsetX: 0, offsetY: -6 })
    .onClick(() => {}) // Trap internal clicks
  }
}
