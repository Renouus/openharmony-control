export class SceneRunGuard {
  private running: boolean = false;

  async run(action: () => Promise<void>): Promise<void> {
    if (this.running) {
      return;
    }
    this.running = true;
    try {
      await action();
    } finally {
      this.running = false;
    }
  }
}
