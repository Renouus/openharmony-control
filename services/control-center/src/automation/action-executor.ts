import { ExecutionLogService } from "./execution-log-service";
import type { AutomationAction, AutomationEvent, AutomationRule } from "./types";
import { toAutomationDeviceCommand } from "./automation-normalization";
import { DeviceCommandService } from "../services/device-command-service";
import { SceneService } from "../services/scene-service";

export class ActionExecutor {
  constructor(
    private readonly deviceCommandService: DeviceCommandService | undefined,
    private readonly sceneService: SceneService,
    private readonly logService: ExecutionLogService,
  ) {}

  async execute(rule: AutomationRule, event: AutomationEvent): Promise<void> {
    for (let index = 0; index < rule.actions.length; index += 1) {
      const action: AutomationAction = rule.actions[index];

      try {
        if (action.type === "scene_run") {
          await this.sceneService.runScene(String(action.config.sceneId));
        } else if (action.type === "device_command") {
          if (!this.deviceCommandService) {
            throw new Error("DEVICE_COMMAND_NOT_YET_WIRED");
          }
          const command = toAutomationDeviceCommand(
            action.config,
            event.metadata.executionId ?? `${rule.id}-${event.eventId}-${index}`,
            Date.now(),
          );
          const result = await this.deviceCommandService.executeAutomationCommand(
            command,
            rule.id,
            event.metadata.executionId ?? `${rule.id}-${event.eventId}`,
            event.metadata.chainDepth ?? 0,
          );
          if (!result.ok) {
            throw new Error(result.body.code);
          }
        } else {
          throw new Error("UNSUPPORTED_ACTION");
        }
      } catch (error) {
        this.logService.record({
          executionId: event.metadata.executionId ?? `${rule.id}-${event.eventId}`,
          automationId: rule.id,
          eventId: event.eventId,
          status: "failed",
          reason: error instanceof Error ? error.message : "UNKNOWN_ACTION_ERROR",
          timestamp: Date.now(),
          actionIndex: index,
          actionType: action.type,
        });
        return;
      }
    }

    this.logService.record({
      executionId: event.metadata.executionId ?? `${rule.id}-${event.eventId}`,
      automationId: rule.id,
      eventId: event.eventId,
      status: "success",
      reason: "EXECUTED",
      timestamp: Date.now(),
    });
  }
}
