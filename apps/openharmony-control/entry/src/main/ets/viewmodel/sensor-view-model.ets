import { SensorViewStateData } from '../model/page-view-state';
import { mapSensorViewState } from '../model/smart-home-mappers';
import { SmartHomeRepositoryPort, normalizeRepositoryError } from '../services/smart-home-repository';

/**
 * 传感器视图模型。
 *
 * 与 ClimateViewModel/LightingViewModel 保持一致的 load() 模式：从 repository
 * 获取设备列表，再通过 mapper 转换为 SensorViewStateData，交由 AppStateSnapshot
 * 写入 @Observed 容器触发 UI 更新。
 *
 * 阈值更新仅维护前端状态（持久化由视图层 @State 暂存），不发起后端命令；
 * 这避免了引入新的命令名/契约字段，使传感器界面能直接复用现有设备数据流。
 */
export class SensorViewModel {
  private readonly repository: SmartHomeRepositoryPort;

  constructor(repository: SmartHomeRepositoryPort) {
    this.repository = repository;
  }

  async load(feedback: string = ''): Promise<SensorViewStateData> {
    const devices = await this.repository.listDevices();
    return mapSensorViewState(devices, feedback);
  }

  /**
   * 阈值更新是纯前端交互（用户调整滑块/Toggle）。
   * 返回的反馈文案与其它 ViewModel 的成功文案风格一致。
   */
  async updateThreshold(metricLabel: string): Promise<string> {
    try {
      // 当前实现不写后端；保留 await 以便未来接入持久化层时无需改动调用方。
      await Promise.resolve();
      return `${metricLabel} 阈值已更新`;
    } catch (error) {
      return normalizeRepositoryError(error as Object);
    }
  }
}
