export type ServerLifecycleApp = {
  close(): Promise<void>;
  log: { error(value: unknown): unknown };
};

export async function runServerWithShutdownOnFailure(
  app: ServerLifecycleApp,
  start: () => Promise<void>,
): Promise<void> {
  try {
    await start();
  } catch (startupError) {
    try {
      await app.close();
    } catch (closeError) {
      app.log.error(closeError);
    }
    throw startupError;
  }
}
