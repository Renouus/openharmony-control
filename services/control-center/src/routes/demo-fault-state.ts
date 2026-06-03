export type DemoFaultState = {
  forceUnauthorizedCommands: boolean;
};

export function createDemoFaultState(): DemoFaultState {
  return { forceUnauthorizedCommands: false };
}
