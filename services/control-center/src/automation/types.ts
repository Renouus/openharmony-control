export type AutomationTriggerType = "time" | "device_state_changed" | "sensor_event";
export type AutomationActionType = "device_command" | "scene_run";

export type AutomationAction = {
  type: AutomationActionType;
  config: Record<string, unknown>;
};

export type AutomationTrigger = {
  type: AutomationTriggerType;
  config: Record<string, unknown>;
};

export type AutomationConditionLogic = "all" | "any";

export type AutomationCondition = {
  type: AutomationTriggerType;
  deviceId?: string;
  time?: string;
  at?: string;
  property?: string;
  operator?: string;
  threshold?: unknown;
};

export type AutomationConditionGroup = {
  logic: AutomationConditionLogic;
  conditions: AutomationCondition[];
};

export type AutomationRule = {
  id: string;
  enabled: boolean;
  trigger: AutomationTrigger;
  conditionGroup?: AutomationConditionGroup;
  actions: AutomationAction[];
  cooldownMs: number;
};

export type AutomationEvent = {
  eventId: string;
  type: AutomationTriggerType;
  source: "user" | "automation" | "demo" | "system";
  timestamp: number;
  deviceId?: string;
  sensorType?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata: {
    chainDepth?: number;
    executionId?: string;
    parentExecutionId?: string;
    automationId?: string;
    routeOrigin?: string;
    time?: string;
  };
};
