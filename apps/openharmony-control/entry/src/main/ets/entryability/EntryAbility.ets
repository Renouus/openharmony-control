import UIAbility from '@ohos.app.ability.UIAbility';
import Want from '@ohos.app.ability.Want';
import window from '@ohos.window';
import { DatabaseHelper } from '../services/db/DatabaseHelper';

export default class EntryAbility extends UIAbility {
  async onCreate(want: Want): Promise<void> {
    try {
      await DatabaseHelper.getInstance().init(this.context);
      console.info('Database initialized successfully');
    } catch (err) {
      console.error('Database initialization failed', err);
    }
  }

  onWindowStageCreate(windowStage: window.WindowStage): void {
    windowStage.loadContent('pages/Index', (err) => {
      if (err.code) {
        console.error(`Failed to load page: ${err.code}, ${err.message}`);
      }
    });
  }
}
