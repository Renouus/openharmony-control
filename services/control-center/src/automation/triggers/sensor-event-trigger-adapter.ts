import type { AutomationEvent } from "../types";

/**
 * 传感器事件触发器适配器。
 *
 * 把传感器读数变化转换为 AutomationEvent（type='sensor_event'），
 * 交给 AutomationRuntime.dispatch 路由到匹配的自动化规则。
 *
 * 支持的传感器属性：
 * - motionDetected（boolean）：人体感应
 * - contactOpen（boolean）：门窗接触
 * - temperature（number）：温度
 * - humidity（number）：湿度
 * - illuminance（number）：光照
 *
 * 通用 dispatchSensorEvent 接受任意 property/value 组合；
 * 保留 dispatchMotion 作为向后兼容的快捷方法。
 */
export class SensorEventTriggerAdapter {
  constructor(private readonly dispatch: (event: AutomationEvent) => Promise<void>) {}

  /**
   * 通用传感器事件分发。
   *
   * @param deviceId 传感器设备 ID
   * @param property 变化的属性名（如 'temperature'/'humidity'/'illuminance'/'motionDetected'/'contactOpen'）
   * @param value 新值
   * @param routeOrigin 事件来源标记，用于日志追踪
   */
  async dispatchSensorEvent(
    deviceId: string,
    property: string,
    value: number | boolean,
    routeOrigin: string = "sensor-event",
  ): Promise<void> {
    const after: Record<string, unknown> = {};
    after[property] = value;
    await this.dispatch({
      eventId: `${deviceId}-${property}-${Date.now()}`,
      type: "sensor_event",
      source: "demo",
      timestamp: Date.now(),
      deviceId,
      sensorType: property,
      after,
      metadata: {
        chainDepth: 0,
        routeOrigin,
      },
    });
  }

  /**
   * 向后兼容：分发运动检测事件。
   * 等价于 dispatchSensorEvent(deviceId, 'motionDetected', motionDetected, 'demo-motion')。
   */
  async dispatchMotion(deviceId: string, motionDetected: boolean): Promise<void> {
    await this.dispatchSensorEvent(deviceId, "motionDetected", motionDetected, "demo-motion");
  }

  /** 分发温度变化事件 */
  async dispatchTemperature(deviceId: string, temperature: number): Promise<void> {
    await this.dispatchSensorEvent(deviceId, "temperature", temperature, "demo-temperature");
  }

  /** 分发湿度变化事件 */
  async dispatchHumidity(deviceId: string, humidity: number): Promise<void> {
    await this.dispatchSensorEvent(deviceId, "humidity", humidity, "demo-humidity");
  }

  /** 分发光照变化事件 */
  async dispatchIlluminance(deviceId: string, illuminance: number): Promise<void> {
    await this.dispatchSensorEvent(deviceId, "illuminance", illuminance, "demo-illuminance");
  }

  /** 分发门窗接触事件 */
  async dispatchContact(deviceId: string, contactOpen: boolean): Promise<void> {
    await this.dispatchSensorEvent(deviceId, "contactOpen", contactOpen, "demo-contact");
  }
}
