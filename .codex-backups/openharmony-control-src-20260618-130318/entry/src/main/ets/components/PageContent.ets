// PageContent is no longer used – navigation is handled by Navigation + NavPathStack in Index.ets.
// This file is kept as a placeholder to avoid breaking any external references during migration.

import { AppPageId } from '../model/page-view-state';
import { AppStateSnapshot } from '../model/app-state-snapshot';

@Component
export struct PageContent {
  @Prop activePage: AppPageId = 'home';
  @ObjectLink states: AppStateSnapshot;

  build() {
    Column()
      .width('100%')
  }
}
