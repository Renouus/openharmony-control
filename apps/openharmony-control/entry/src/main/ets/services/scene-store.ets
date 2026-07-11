import { PersistedScene } from './device-api';
import { SmartHomeRepository } from './smart-home-repository';

function compareScenes(left: PersistedScene, right: PersistedScene): number {
  if (left.sortOrder !== right.sortOrder) {
    return left.sortOrder - right.sortOrder;
  }
  if (left.createdAt !== right.createdAt) {
    return left.createdAt - right.createdAt;
  }
  return left.id.localeCompare(right.id);
}

function sortScenes(items: PersistedScene[]): PersistedScene[] {
  return items.slice().sort(compareScenes);
}

@Observed
export class SceneStore {
  items: PersistedScene[] = [];
  loaded: boolean = false;

  private pendingLoad?: Promise<void>;

  async loadIfNeeded(repository: SmartHomeRepository): Promise<void> {
    if (this.loaded) {
      return;
    }

    if (this.pendingLoad !== undefined) {
      await this.pendingLoad;
      return;
    }

    this.pendingLoad = this.refresh(repository);
    try {
      await this.pendingLoad;
    } finally {
      this.pendingLoad = undefined;
    }
  }

  async refresh(repository: SmartHomeRepository): Promise<void> {
    const scenes = await repository.listPersistedScenes();
    this.replaceAll(scenes);
  }

  replaceAll(items: PersistedScene[]): void {
    this.items = sortScenes(items);
    this.loaded = true;
  }

  append(scene: PersistedScene): void {
    const existingIndex = this.items.findIndex((item) => item.id === scene.id);
    if (existingIndex >= 0) {
      this.replace(scene);
      return;
    }

    this.items = sortScenes([...this.items, scene]);
  }

  replace(scene: PersistedScene): void {
    let replaced = false;
    const nextItems = this.items.map((item) => {
      if (item.id !== scene.id) {
        return item;
      }
      replaced = true;
      return scene;
    });

    this.items = sortScenes(replaced ? nextItems : [...nextItems, scene]);
  }

  removeVisible(sceneId: string): void {
    this.items = this.items.filter((item) => item.id !== sceneId || item.isDeleted);
  }

  applyTombstone(scene: PersistedScene): void {
    scene.isDeleted = true;
    this.replace(scene);
  }

  visibleItems(): PersistedScene[] {
    return this.items.filter((item) => !item.isDeleted);
  }
}
