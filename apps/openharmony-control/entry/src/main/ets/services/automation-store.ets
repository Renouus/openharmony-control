import { AutomationSnapshot } from './device-api';
import { SmartHomeRepository } from './smart-home-repository';

function compareAutomations(left: AutomationSnapshot, right: AutomationSnapshot): number {
  return left.id.localeCompare(right.id);
}

function sortAutomations(items: AutomationSnapshot[]): AutomationSnapshot[] {
  return items.slice().sort(compareAutomations);
}

@Observed
export class AutomationStore {
  items: AutomationSnapshot[] = [];
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
    const automations = await repository.listAutomations();
    this.replaceAll(automations);
  }

  replaceAll(items: AutomationSnapshot[]): void {
    this.items = sortAutomations(items);
    this.loaded = true;
  }

  append(automation: AutomationSnapshot): void {
    const existingIndex = this.items.findIndex((item) => item.id === automation.id);
    if (existingIndex >= 0) {
      this.replace(automation);
      return;
    }

    this.items = sortAutomations([...this.items, automation]);
  }

  replace(automation: AutomationSnapshot): void {
    let replaced = false;
    const nextItems: AutomationSnapshot[] = this.items.map((item: AutomationSnapshot): AutomationSnapshot => {
      if (item.id !== automation.id) {
        return item;
      }
      replaced = true;
      return automation;
    });

    this.items = sortAutomations(replaced ? nextItems : [...nextItems, automation]);
  }

  removeVisible(automationId: string): void {
    this.items = this.items.filter((item) => item.id !== automationId);
  }

  visibleItems(): AutomationSnapshot[] {
    return this.items;
  }
}
