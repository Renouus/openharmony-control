/**
 * OmniHome 智能家居控制中心 —— 主入口页面
 *
 * 基于 OpenHarmony ArkUI 声明式框架构建，使用 Sahara 暖色视觉系统。
 * 通过底部 Tab 导航在「家 / 自动化 / 通知 / 我的」四个主页面间切换，
 * 并通过 activePage 支持门禁、摄像头、灯光控制等二级功能页面的展示。
 */
import { DeviceSnapshot } from '../model/device-view-model';
import {
  AccessKey,
  AccessOverview,
  AccessPointSnapshot,
  BrightnessPayload,
  CameraSnapshot,
  ColorTemperaturePayload,
  CommandHistoryEntry,
  DeviceApi,
  DevicePayload,
  HomeSummary,
  LockPayload,
  SceneSnapshot,
  SwitchPayload,
  TemperaturePayload,
} from '../services/device-api';

// ── Sahara 暖色视觉系统 ──
const COLOR_BG: string = '#FAF5EE';           // 页面背景 —— 温馨米白
const COLOR_SURFACE: string = '#FFFFFF';       // 卡片表面 —— 纯白
const COLOR_SURFACE_WARM: string = '#F6F0E8';  // 暖色卡片表面
const COLOR_PRIMARY: string = '#C2652A';       // 主色调 —— 陶土橙
const COLOR_PRIMARY_SOFT: string = '#FBE8D8';  // 主色调柔和版 —— 用于标签背景
const COLOR_TEXT: string = '#3A302A';          // 主文字色 —— 深棕色
const COLOR_TEXT_MUTED: string = '#605850';    // 次要文字色
const COLOR_BORDER: string = '#D8D0C8';        // 边框色

@Entry
@Component
struct Index {
  /** 后端控制中心 API 客户端（模拟器默认地址为 10.0.2.2:3443） */
  private readonly api: DeviceApi = new DeviceApi('http://10.0.2.2:3443');

  // ── 导航状态 ──
  /** 底部 Tab 索引：0-家 1-自动化 2-通知 3-我的 */
  @State currentTab: number = 0;
  /** 当前活动页面标识：home/lighting/access/camera/automation/notifications/profile */
  @State activePage: string = 'home';

  // ── 设备与场景数据 ──
  /** 全屋设备快照列表（门锁、灯光、空调、传感器等） */
  @State devices: DeviceSnapshot[] = [];
  /** 自动化场景列表 */
  @State scenes: SceneSnapshot[] = [];
  /** 命令执行历史（最近 N 条） */
  @State history: CommandHistoryEntry[] = [];
  /** 摄像头设备列表 */
  @State cameras: CameraSnapshot[] = [];

  // ── 用户反馈 ──
  /** 操作反馈提示文本，展示在页面底部的暖色提示条中 */
  @State feedback: string = '';

  // ── 门禁系统数据 ──
  /** 门禁概览：主锁状态、数字钥匙列表、其他入口点 */
  @State accessOverview: AccessOverview = {
    primary: { id: 'front-door', name: 'Front Door', locked: true, battery: 100 },
    keys: [],
    accessPoints: [],
  };

  // ── 首页仪表盘摘要 ──
  /** 首页摘要：安全状态、设备统计、灯光/气候/环境指标、提醒列表 */
  @State summary: HomeSummary = {
    mode: 'home',
    security: { label: '正在连接', secure: true },
    devices: { total: 0, online: 0, offline: 0, warning: 0 },
    lighting: { active: 0 },
    climate: { temperature: 0, humidity: 0, label: '舒适' },
    environment: { aqi: 0, label: '优秀' },
    alerts: [],
  };

  /**
   * 页面即将显示时的生命周期回调，触发首次全量数据加载。
   */
  async aboutToAppear(): Promise<void> {
    await this.refreshAll();
  }

  /**
   * 刷新首页核心数据：摘要、设备列表、场景、命令历史、门禁、摄像头。
   * 各模块独立 try-catch，单个接口失败不影响其他模块的展示。
   */
  async refreshAll(): Promise<void> {
    try {
      this.summary = await this.api.getSummary();
      this.devices = await this.api.listDevices();
      this.scenes = await this.api.listScenes();
      this.history = await this.api.listHistory(8);
      if (this.feedback === '控制中心暂不可用') {
        this.feedback = '';
      }
    } catch (error) {
      this.feedback = '控制中心暂不可用';
    }

    // 门禁数据独立加载，失败时保留当前的本地安全状态
    try {
      this.accessOverview = await this.api.getAccessOverview();
    } catch (error) {
      // 仅门禁接口失败时保留本地缓存的门禁状态
    }

    await this.refreshCameras();
  }

  /**
   * 刷新摄像头列表。失败时静默保留当前快照，不覆盖已有数据。
   */
  async refreshCameras(): Promise<void> {
    try {
      this.cameras = await this.api.getCameraOverview();
    } catch (error) {
      // 仅摄像头接口失败时保留本地缓存的摄像头状态
    }
  }

  /**
   * 向控制中心发送设备命令（HMAC 签名模式）。
   * @param deviceId 目标设备 ID（如 door-front、light-living-room）
   * @param name 命令名称（lock / switch / set-brightness 等）
   * @param payload 命令载荷（锁定状态、开关值、亮度等）
   */
  async send(deviceId: string, name: string, payload: DevicePayload): Promise<void> {
    try {
      await this.api.postDemoCommand({
        requestId: `cmd-${Date.now()}`,
        timestamp: Date.now(),
        deviceId,
        name,
        payload,
      });
      this.feedback = '操作已发送';
      await this.refreshAll();
    } catch (error) {
      this.feedback = '操作失败，请稍后重试';
      await this.refreshAll();
    }
  }

  /**
   * 执行指定自动化场景。
   * @param sceneId 场景 ID（home / away / sleep / movie）
   */
  async runScene(sceneId: string): Promise<void> {
    try {
      await this.api.runScene(sceneId);
      this.feedback = '自动化已执行';
      await this.refreshAll();
    } catch (error) {
      this.feedback = '自动化执行失败';
      await this.refreshAll();
    }
  }

  /**
   * 启用或停用自动化场景。
   * @param sceneId 场景 ID
   * @param enabled true 启用 / false 停用
   */
  async toggleScene(sceneId: string, enabled: boolean): Promise<void> {
    try {
      await this.api.updateScene(sceneId, enabled);
      this.feedback = enabled ? '自动化已启用' : '自动化已停用';
      await this.refreshAll();
    } catch (error) {
      this.feedback = '自动化设置失败';
      await this.refreshAll();
    }
  }

  /**
   * 分享访客临时钥匙（默认 4 小时有效）。
   */
  async shareGuestAccess(): Promise<void> {
    try {
      await this.api.shareGuestKey('Guest', 4);
      this.feedback = '访客钥匙已分享';
      await this.refreshAll();
    } catch (error) {
      this.feedback = '访客钥匙分享失败';
      await this.refreshAll();
    }
  }

  /**
   * 切换摄像头录制状态（开启 ↔ 停止）。
   * @param camera 目标摄像头快照
   */
  async toggleCameraRecording(camera: CameraSnapshot): Promise<void> {
    try {
      await this.api.toggleCameraRecording(camera.id, !camera.recording);
      this.feedback = camera.recording ? '录像已暂停' : '录像已开启';
      await this.refreshCameras();
    } catch (error) {
      this.feedback = '摄像头录像切换失败';
      await this.refreshCameras();
    }
  }

  // ── 设备查询工具方法 ──

  /** 根据设备 ID 在本地设备列表中查找设备快照 */
  findDevice(deviceId: string): DeviceSnapshot | undefined {
    return this.devices.find((device: DeviceSnapshot) => device.id === deviceId);
  }

  // ── 中文格式化工具方法 ──

  /**
   * 根据设备种类和在线状态返回中文状态描述文本。
   * - 门锁：已上锁 / 未上锁
   * - 灯光：XX% / 关闭
   * - 空调：目标 XX°C / 关闭
   * - 离线：离线
   */
  formatStatus(device: DeviceSnapshot): string {
    if (!device.state.online) {
      return '离线';
    }
    if (device.kind === 'door-lock') {
      return device.state.locked ? '已上锁' : '未上锁';
    }
    if (device.kind === 'light') {
      return device.state.power ? `${device.state.brightness ?? 0}%` : '关闭';
    }
    if (device.kind === 'air-conditioner') {
      return device.state.power ? `目标 ${device.state.targetTemperature ?? '--'}°C` : '关闭';
    }
    return '在线';
  }

  /** 将命令历史条目映射为简短的中文操作名称 */
  formatHistory(entry: CommandHistoryEntry): string {
    if (entry.commandName === 'lock') {
      return '门锁操作';
    }
    if (entry.commandName === 'switch') {
      return '开关操作';
    }
    if (entry.commandName === 'set-target-temperature') {
      return '温度调整';
    }
    if (entry.commandName === 'set-brightness') {
      return '亮度调整';
    }
    return entry.message;
  }

  /** 将场景的重复周期数组转为可读字符串 */
  repeatText(scene: SceneSnapshot): string {
    if (scene.repeat.length === 0) {
      return '不重复';
    }
    return scene.repeat.join(' ');
  }

  // ── 门禁系统工具方法 ──

  /** 将数字钥匙状态转为中文标签 */
  accessKeyStatus(key: AccessKey): string {
    if (key.status === 'temporary') {
      return '临时';
    }
    if (key.status === 'expired') {
      return '已过期';
    }
    return '可用';
  }

  /** 生成数字钥匙的副标题文本（含角色与时效描述） */
  accessKeySubtitle(key: AccessKey): string {
    if (key.expiresAt !== undefined) {
      return `${key.role} · 限时通行`;
    }
    return key.role;
  }

  /** 生成入口点的副标题文本（上锁状态 + 电量） */
  accessPointSubtitle(point: AccessPointSnapshot): string {
    return `${point.locked ? '已上锁' : '未上锁'} · ${point.battery}% 电量`;
  }

  // ── 摄像头工具方法 ──

  /** 获取主摄像头（列表中第一个） */
  primaryCamera(): CameraSnapshot | undefined {
    if (this.cameras.length === 0) {
      return undefined;
    }
    return this.cameras[0];
  }

  /** 根据摄像头状态返回中文标签：等待连接 / 离线 / 实时录像 / 实时预览 */
  cameraStatusLabel(camera: CameraSnapshot | undefined): string {
    if (camera === undefined) {
      return '等待连接';
    }
    if (!camera.online) {
      return '离线';
    }
    return camera.recording ? '实时录像' : '实时预览';
  }

  /** 根据最近移动时间戳生成可读文本（X 分钟前侦测到移动） */
  cameraMotionText(camera: CameraSnapshot): string {
    if (camera.lastMotionAt === undefined) {
      return '暂无移动记录';
    }
    const minutes = Math.max(1, Math.round((Date.now() - camera.lastMotionAt) / 60000));
    return `${minutes} 分钟前侦测到移动`;
  }

  // ── 灯光设备工具方法 ──

  /** 获取所有灯光类设备 */
  lightDevices(): DeviceSnapshot[] {
    return this.devices.filter((device: DeviceSnapshot) => device.kind === 'light');
  }

  /** 按房间名筛选灯光设备 */
  roomLights(room: string): DeviceSnapshot[] {
    return this.lightDevices().filter((device: DeviceSnapshot) => device.room === room);
  }

  /** 将房间键名映射为中文显示名 */
  roomName(room: string): string {
    if (room === 'living-room') {
      return '客厅';
    }
    if (room === 'kitchen') {
      return '厨房';
    }
    if (room === 'bedroom') {
      return '主卧';
    }
    if (room === 'bathroom') {
      return '浴室';
    }
    return room;
  }

  /** 将房间键名映射为图标符号 */
  roomIcon(room: string): string {
    if (room === 'living-room') {
      return '⌂';
    }
    if (room === 'kitchen') {
      return '⌘';
    }
    if (room === 'bedroom') {
      return '☾';
    }
    if (room === 'bathroom') {
      return '◇';
    }
    return '□';
  }

  /** 获取某房间内已开启灯光数量 */
  roomActive(room: string): number {
    return this.roomLights(room).filter((device: DeviceSnapshot) => device.state.power === true).length;
  }

  /** 获取某房间内所有灯光的平均亮度百分比 */
  roomBrightness(room: string): number {
    const activeLights = this.roomLights(room).filter((device: DeviceSnapshot) => device.state.power === true);
    if (activeLights.length === 0) {
      return 0;
    }
    const total = activeLights.reduce((sum: number, device: DeviceSnapshot) => sum + (device.state.brightness ?? 0), 0);
    return Math.round(total / activeLights.length);
  }

  // ── 房间灯光批量控制 ──

  /** 批量开关某房间内所有灯光 */
  async toggleRoom(room: string, on: boolean): Promise<void> {
    const lights = this.roomLights(room);
    for (const light of lights) {
      await this.send(light.id, 'switch', { on } as SwitchPayload);
    }
  }

  /** 批量设置某房间内所有灯光亮度（先开灯再调亮度） */
  async setRoomBrightness(room: string, brightness: number): Promise<void> {
    const lights = this.roomLights(room);
    for (const light of lights) {
      await this.send(light.id, 'switch', { on: true } as SwitchPayload);
      await this.send(light.id, 'set-brightness', { brightness } as BrightnessPayload);
    }
  }

  /**
   * 顶层构建方法：Scroll 内容区 + 底部固定 Tab 栏。
   * 通过 activePage 条件渲染不同的功能页面，实现类路由切换效果。
   */
  build() {
    Column() {
      Scroll() {
        Column({ space: 16 }) {
          if (this.activePage === 'lighting') {
            this.LightingTab()
          } else if (this.activePage === 'access') {
            this.AccessTab()
          } else if (this.activePage === 'camera') {
            this.CameraTab()
          } else if (this.activePage === 'home') {
            this.HomeTab()
          } else if (this.activePage === 'automation') {
            this.AutomationTab()
          } else if (this.activePage === 'notifications') {
            this.NotificationTab()
          } else if (this.activePage === 'profile') {
            this.ProfileTab()
          } else {
            this.HomeTab()
          }
        }
        .padding({ left: 20, right: 20, top: 16, bottom: 18 })
        .width('100%')
      }
      .layoutWeight(1)

      // 底部固定导航栏
      this.BottomTabs()
    }
    .width('100%')
    .height('100%')
    .backgroundColor(COLOR_BG)
  }

  /**
   * 功能页面通用头部：返回按钮 + 标题 + 副标题。
   * @param title 页面标题
   * @param subtitle 页面副标题
   * @param backPage 点击返回后跳转的页面标识，默认为 home
   */
  @Builder
  FeatureHeader(title: string, subtitle: string, backPage: string = 'home') {
    Row() {
      Button('<')
        .fontSize(22)
        .fontColor(COLOR_PRIMARY)
        .backgroundColor(COLOR_BG)
        .onClick(() => {
          this.activePage = backPage;
          if (backPage === 'home') {
            this.currentTab = 0;
          } else if (backPage === 'automation') {
            this.currentTab = 1;
          } else if (backPage === 'notifications') {
            this.currentTab = 2;
          } else if (backPage === 'profile') {
            this.currentTab = 3;
          }
        })
      Column({ space: 2 }) {
        Text(title)
          .fontSize(24)
          .fontWeight(FontWeight.Bold)
          .fontColor(COLOR_TEXT)
        Text(subtitle)
          .fontSize(12)
          .fontColor(COLOR_TEXT_MUTED)
      }
      .layoutWeight(1)
    }
    .width('100%')
  }

  /**
   * 首页 Tab：展示品牌头部、安全状态卡片、模式切换、
   * 门禁/摄像头入口卡片、场景快捷按钮、设备列表。
   */
  @Builder
  HomeTab() {
    Column({ space: 16 }) {
      Row() {
        Column({ space: 2 }) {
          Text('OmniHome')
            .fontSize(16)
            .fontColor(COLOR_PRIMARY)
            .fontWeight(FontWeight.Medium)
          Text('家')
            .fontSize(34)
            .fontColor(COLOR_TEXT)
            .fontWeight(FontWeight.Bold)
        }
        Blank()
        Text('温馨模式')
          .fontSize(12)
          .fontColor(COLOR_PRIMARY)
          .padding({ left: 10, right: 10, top: 6, bottom: 6 })
          .borderRadius(14)
          .backgroundColor(COLOR_PRIMARY_SOFT)
      }
      .width('100%')

      Column({ space: 14 }) {
        Row() {
          Column({ space: 4 }) {
            Text(this.summary.security.label)
              .fontSize(26)
              .fontWeight(FontWeight.Bold)
              .fontColor(COLOR_TEXT)
            Text(this.summary.alerts.length === 0 ? '无重要提醒' : `${this.summary.alerts.length} 个提醒待查看`)
              .fontSize(14)
              .fontColor(COLOR_TEXT_MUTED)
          }
          Blank()
          Text(this.summary.security.secure ? '安全' : '注意')
            .fontSize(13)
            .fontColor(COLOR_PRIMARY)
            .fontWeight(FontWeight.Medium)
        }
        .width('100%')

        Row({ space: 8 }) {
          this.MetricPill('灯光', `${this.summary.lighting.active} 开启`)
          this.MetricPill('环境', `${this.summary.environment.aqi ?? '--'} AQI`)
          this.MetricPill('在线', `${this.summary.devices.online}/${this.summary.devices.total}`)
        }
      }
      .padding(18)
      .borderRadius(18)
      .backgroundColor(COLOR_SURFACE)
      .border({ width: 1, color: COLOR_BORDER })
      .width('100%')

      Row({ space: 8 }) {
        this.ModeChip('在家', true)
        this.ModeChip('离家', false)
        this.ModeChip('夜间', false)
      }
      .width('100%')

      Button('进入灯光控制中心')
        .fontSize(15)
        .fontColor('#FFFFFF')
        .height(48)
        .borderRadius(14)
        .backgroundColor(COLOR_PRIMARY)
        .width('100%')
        .onClick(() => {
          this.activePage = 'lighting';
        })

      Column({ space: 10 }) {
        Row() {
          Column({ space: 4 }) {
            Text('门禁控制')
              .fontSize(18)
              .fontWeight(FontWeight.Medium)
              .fontColor(COLOR_TEXT)
            Text('前门、访客钥匙与其他入口')
              .fontSize(12)
              .fontColor(COLOR_TEXT_MUTED)
          }
          .layoutWeight(1)
          Text(this.accessOverview.primary.locked ? '安全' : '未上锁')
            .fontSize(13)
            .fontColor(COLOR_PRIMARY)
            .padding({ left: 10, right: 10, top: 6, bottom: 6 })
            .borderRadius(14)
            .backgroundColor(COLOR_PRIMARY_SOFT)
        }
        .width('100%')

        Row({ space: 8 }) {
          this.MetricPill('前门', this.accessOverview.primary.locked ? '已上锁' : '未上锁')
          this.MetricPill('电量', `${this.accessOverview.primary.battery}%`)
        }
        .width('100%')
      }
      .padding(16)
      .borderRadius(18)
      .backgroundColor(COLOR_SURFACE_WARM)
      .border({ width: 1, color: COLOR_BORDER })
      .width('100%')
      .onClick(() => {
        this.activePage = 'access';
      })

      Column({ space: 10 }) {
        Row() {
          Column({ space: 4 }) {
            Text('摄像头监控')
              .fontSize(18)
              .fontWeight(FontWeight.Medium)
              .fontColor(COLOR_TEXT)
            Text('前门、庭院与最近移动记录')
              .fontSize(12)
              .fontColor(COLOR_TEXT_MUTED)
          }
          .layoutWeight(1)
          Text(this.cameraStatusLabel(this.primaryCamera()))
            .fontSize(13)
            .fontColor(COLOR_PRIMARY)
            .padding({ left: 10, right: 10, top: 6, bottom: 6 })
            .borderRadius(14)
            .backgroundColor(COLOR_PRIMARY_SOFT)
        }
        .width('100%')

        Row({ space: 8 }) {
          this.MetricPill('在线', `${this.cameras.filter((camera: CameraSnapshot) => camera.online).length}/${this.cameras.length}`)
          this.MetricPill('录像', `${this.cameras.filter((camera: CameraSnapshot) => camera.recording).length} 路`)
        }
        .width('100%')
      }
      .padding(16)
      .borderRadius(18)
      .backgroundColor(COLOR_SURFACE)
      .border({ width: 1, color: COLOR_BORDER })
      .width('100%')
      .onClick(() => {
        this.activePage = 'camera';
      })

      Column({ space: 10 }) {
        this.SectionHeader('快捷自动化', '一键切换全屋状态')
        Row({ space: 8 }) {
          ForEach(this.scenes.slice(0, 3), (scene: SceneSnapshot) => {
            Button(scene.name)
              .fontSize(13)
              .fontColor(COLOR_TEXT)
              .backgroundColor(COLOR_SURFACE)
              .borderRadius(16)
              .border({ width: 1, color: COLOR_BORDER })
              .height(44)
              .onClick(() => this.runScene(scene.id))
          }, (scene: SceneSnapshot) => scene.id)
        }
        .width('100%')
      }

      Column({ space: 10 }) {
        this.SectionHeader('设备状态', '按原型聚合门锁、灯光、空调与环境')
        ForEach(this.devices, (device: DeviceSnapshot) => {
          this.DeviceRow(device)
        }, (device: DeviceSnapshot) => device.id)
      }

      if (this.feedback.length > 0) {
        Text(this.feedback)
          .fontSize(13)
          .fontColor(COLOR_PRIMARY)
          .padding(12)
          .borderRadius(12)
          .backgroundColor(COLOR_PRIMARY_SOFT)
          .width('100%')
      }
    }
  }

  /**
   * 门禁控制页面：展示前门智能锁、点击解锁/上锁交互、
   * 数字钥匙列表、访客钥匙分享、其他入口点状态。
   */
  @Builder
  AccessTab() {
    Column({ space: 16 }) {
      Row() {
        Column({ space: 2 }) {
          Text('OmniHome')
            .fontSize(15)
            .fontColor(COLOR_PRIMARY)
            .fontWeight(FontWeight.Medium)
          Text('门禁控制')
            .fontSize(30)
            .fontColor(COLOR_TEXT)
            .fontWeight(FontWeight.Bold)
        }
        Blank()
        Text('我')
          .fontSize(14)
          .fontColor('#FFFFFF')
          .fontWeight(FontWeight.Medium)
          .textAlign(TextAlign.Center)
          .width(42)
          .height(42)
          .borderRadius(21)
          .backgroundColor(COLOR_PRIMARY)
      }
      .width('100%')

      Column({ space: 16 }) {
        Row() {
          Column({ space: 4 }) {
            Text(this.accessOverview.primary.name)
              .fontSize(22)
              .fontWeight(FontWeight.Bold)
              .fontColor(COLOR_TEXT)
            Text(this.accessOverview.primary.locked ? 'Secure · 门已上锁' : 'Attention · 门未上锁')
              .fontSize(13)
              .fontColor(COLOR_TEXT_MUTED)
          }
          .layoutWeight(1)
          Text(this.accessOverview.primary.locked ? '安全' : '注意')
            .fontSize(13)
            .fontColor(COLOR_PRIMARY)
            .fontWeight(FontWeight.Medium)
        }
        .width('100%')

        Stack() {
          this.AccessLockIcon(this.accessOverview.primary.locked)
        }
        .width(128)
        .height(128)
        .borderRadius(64)
        .backgroundColor(COLOR_PRIMARY)
        .alignSelf(ItemAlign.Center)
        .onClick(() => this.send('door-front', 'lock', { locked: !this.accessOverview.primary.locked } as LockPayload))

        Text(this.accessOverview.primary.locked ? '点击解锁' : '点击上锁')
          .fontSize(15)
          .fontColor(COLOR_TEXT)
          .fontWeight(FontWeight.Medium)
          .textAlign(TextAlign.Center)
          .width('100%')

        Row({ space: 8 }) {
          this.MetricPill('上锁时间', this.accessOverview.primary.locked ? '刚刚' : '未上锁')
          this.MetricPill('电量', `${this.accessOverview.primary.battery}%`)
          this.MetricPill('供电', '正常')
        }
        .width('100%')
      }
      .padding(20)
      .borderRadius(20)
      .backgroundColor(COLOR_SURFACE)
      .border({ width: 1, color: COLOR_BORDER })
      .width('100%')

      Column({ space: 10 }) {
        Row() {
          Column({ space: 2 }) {
            Text('Digital Keys')
              .fontSize(20)
              .fontWeight(FontWeight.Medium)
              .fontColor(COLOR_TEXT)
            Text('家庭成员与临时访客权限')
              .fontSize(12)
              .fontColor(COLOR_TEXT_MUTED)
          }
          .layoutWeight(1)
          Button('+ Share Guest')
            .fontSize(12)
            .fontColor(COLOR_PRIMARY)
            .height(36)
            .borderRadius(14)
            .backgroundColor(COLOR_PRIMARY_SOFT)
            .onClick(() => this.shareGuestAccess())
        }
        .width('100%')

        ForEach(this.accessOverview.keys, (key: AccessKey) => {
          this.AccessKeyRow(key)
        }, (key: AccessKey) => key.id)
      }

      Column({ space: 10 }) {
        this.SectionHeader('Other Access Points', '车库与后门状态')
        ForEach(this.accessOverview.accessPoints, (point: AccessPointSnapshot) => {
          this.AccessPointCard(point)
        }, (point: AccessPointSnapshot) => point.id)
      }

      if (this.feedback.length > 0) {
        Text(this.feedback)
          .fontSize(13)
          .fontColor(COLOR_PRIMARY)
          .padding(12)
          .borderRadius(12)
          .backgroundColor(COLOR_PRIMARY_SOFT)
          .width('100%')
      }
    }
  }

  /**
   * 摄像头监控页面：展示安防状态概览、主摄像头预览框、
   * 录制控制按钮、摄像头列表（含录制切换）。
   */
  @Builder
  CameraTab() {
    Column({ space: 16 }) {
      this.FeatureHeader('摄像头监控', '实时查看入口安全、录像与移动提醒')

      Column({ space: 14 }) {
        Row() {
          Column({ space: 4 }) {
            Text('安防状态')
              .fontSize(15)
              .fontColor(COLOR_PRIMARY)
              .fontWeight(FontWeight.Medium)
            Text(this.cameras.length === 0 ? '等待摄像头连接' : '全屋摄像头在线守护')
              .fontSize(24)
              .fontWeight(FontWeight.Bold)
              .fontColor(COLOR_TEXT)
          }
          .layoutWeight(1)
          Text(`${this.cameras.filter((camera: CameraSnapshot) => camera.recording).length} 路录像`)
            .fontSize(13)
            .fontColor(COLOR_PRIMARY)
            .padding({ left: 10, right: 10, top: 6, bottom: 6 })
            .borderRadius(14)
            .backgroundColor(COLOR_PRIMARY_SOFT)
        }
        .width('100%')

        Row({ space: 8 }) {
          this.MetricPill('在线摄像头', `${this.cameras.filter((camera: CameraSnapshot) => camera.online).length}/${this.cameras.length}`)
          this.MetricPill('最近移动', this.primaryCamera() === undefined ? '暂无' : this.cameraMotionText(this.primaryCamera() as CameraSnapshot))
        }
        .width('100%')
      }
      .padding(18)
      .borderRadius(18)
      .backgroundColor(COLOR_SURFACE)
      .border({ width: 1, color: COLOR_BORDER })
      .width('100%')

      Column({ space: 14 }) {
        Row() {
          Column({ space: 4 }) {
            Text(this.primaryCamera() === undefined ? '主摄像头' : (this.primaryCamera() as CameraSnapshot).name)
              .fontSize(20)
              .fontWeight(FontWeight.Bold)
              .fontColor(COLOR_TEXT)
            Text(this.primaryCamera() === undefined ? '暂无可用画面' : (this.primaryCamera() as CameraSnapshot).location)
              .fontSize(13)
              .fontColor(COLOR_TEXT_MUTED)
          }
          .layoutWeight(1)
          Text(this.cameraStatusLabel(this.primaryCamera()))
            .fontSize(12)
            .fontColor('#FFFFFF')
            .fontWeight(FontWeight.Medium)
            .padding({ left: 10, right: 10, top: 6, bottom: 6 })
            .borderRadius(14)
            .backgroundColor(COLOR_PRIMARY)
        }
        .width('100%')

        Stack() {
          Column({ space: 10 }) {
            Text('LIVE')
              .fontSize(12)
              .fontColor('#FFFFFF')
              .fontWeight(FontWeight.Bold)
              .padding({ left: 10, right: 10, top: 5, bottom: 5 })
              .borderRadius(12)
              .backgroundColor(COLOR_PRIMARY)
              .alignSelf(ItemAlign.Start)
            Blank()
            Text('CAM')
              .fontSize(34)
              .fontColor(COLOR_PRIMARY)
              .fontWeight(FontWeight.Bold)
              .textAlign(TextAlign.Center)
              .width('100%')
            Text('预览画面占位')
              .fontSize(13)
              .fontColor(COLOR_TEXT_MUTED)
              .textAlign(TextAlign.Center)
              .width('100%')
            Blank()
            Text(this.primaryCamera() === undefined ? '未连接' : this.cameraMotionText(this.primaryCamera() as CameraSnapshot))
              .fontSize(12)
              .fontColor(COLOR_TEXT_MUTED)
              .textAlign(TextAlign.Center)
              .width('100%')
          }
          .padding(16)
          .width('100%')
          .height('100%')
        }
        .width('100%')
        .height(210)
        .borderRadius(18)
        .backgroundColor(COLOR_SURFACE_WARM)
        .border({ width: 1, color: COLOR_BORDER })

        if (this.primaryCamera() !== undefined) {
          Row({ space: 8 }) {
            this.CameraActionButton('麦克风', 'Mic', false)
            this.CameraActionButton('快照', 'Shot', false)
            Button((this.primaryCamera() as CameraSnapshot).recording ? '停止录像' : '开始录像')
              .fontSize(12)
              .fontColor('#FFFFFF')
              .height(44)
              .borderRadius(14)
              .backgroundColor(COLOR_PRIMARY)
              .layoutWeight(1)
              .onClick(() => this.toggleCameraRecording(this.primaryCamera() as CameraSnapshot))
            this.CameraActionButton('静音', 'Mute', false)
          }
          .width('100%')
        }
      }
      .padding(18)
      .borderRadius(20)
      .backgroundColor(COLOR_SURFACE)
      .border({ width: 1, color: COLOR_BORDER })
      .width('100%')

      Column({ space: 10 }) {
        this.SectionHeader('摄像头列表', '查看各区域状态与最近移动')
        if (this.cameras.length === 0) {
          Text('暂无摄像头数据')
            .fontSize(14)
            .fontColor(COLOR_TEXT_MUTED)
            .padding(16)
            .borderRadius(16)
            .backgroundColor(COLOR_SURFACE)
            .width('100%')
        }
        ForEach(this.cameras, (camera: CameraSnapshot) => {
          this.CameraRow(camera)
        }, (camera: CameraSnapshot) => camera.id)
      }

      if (this.feedback.length > 0) {
        Text(this.feedback)
          .fontSize(13)
          .fontColor(COLOR_PRIMARY)
          .padding(12)
          .borderRadius(12)
          .backgroundColor(COLOR_PRIMARY_SOFT)
          .width('100%')
      }
    }
  }

  /**
   * 灯光控制中心：全屋开关、场景预设（阅读/专注/晨起）、
   * 按房间批量控制、单灯细调（亮度滑块 + 色温按钮）。
   */
  @Builder
  LightingTab() {
    Column({ space: 16 }) {
      this.FeatureHeader('灯光控制中心', '按房间管理整体氛围，也可以细调每一盏灯。')

      Text('按房间管理整体氛围，也可以细调每一盏灯。')
        .fontSize(13)
        .fontColor(COLOR_TEXT_MUTED)
        .width('100%')

      Column({ space: 14 }) {
        Row() {
          Column({ space: 4 }) {
            Text('全屋灯光')
              .fontSize(18)
              .fontWeight(FontWeight.Medium)
              .fontColor(COLOR_TEXT)
            Text(`${this.summary.lighting.active} 盏已开启`)
              .fontSize(12)
              .fontColor(COLOR_TEXT_MUTED)
          }
          .layoutWeight(1)
          Toggle({ type: ToggleType.Switch, isOn: this.summary.lighting.active > 0 })
            .onChange((value: boolean) => {
              this.toggleRoom('living-room', value);
              this.toggleRoom('kitchen', value);
              this.toggleRoom('bedroom', value);
              this.toggleRoom('bathroom', value);
            })
        }
        .width('100%')

        Row({ space: 10 }) {
          this.LightSceneButton('阅读', 45, 3000)
          this.LightSceneButton('专注', 80, 4200)
          this.LightSceneButton('晨起', 65, 3600)
        }
        .width('100%')
      }
      .padding(18)
      .borderRadius(18)
      .backgroundColor(COLOR_SURFACE)
      .border({ width: 1, color: COLOR_BORDER })
      .width('100%')

      Column({ space: 10 }) {
        this.SectionHeader('房间控制', '按房间统一开关与亮度')
        ForEach(['living-room', 'kitchen', 'bedroom', 'bathroom'], (room: string) => {
          this.RoomLightCard(room)
        }, (room: string) => room)
      }

      Column({ space: 10 }) {
        this.SectionHeader('具体设备控制', '细调单个灯具的亮度与色温')
        ForEach(this.lightDevices(), (device: DeviceSnapshot) => {
          this.LightDeviceCard(device)
        }, (device: DeviceSnapshot) => device.id)
      }

      if (this.feedback.length > 0) {
        Text(this.feedback)
          .fontSize(13)
          .fontColor(COLOR_PRIMARY)
          .padding(12)
          .borderRadius(12)
          .backgroundColor(COLOR_PRIMARY_SOFT)
          .width('100%')
      }
    }
  }

  /**
   * 自动化页面：展示场景列表，包含触发条件、执行动作、
   * 启用/停用开关、立即运行和编辑入口，支持新建自动化。
   */
  @Builder
  AutomationTab() {
    Column({ space: 16 }) {
      Row() {
        Text('新建自动化')
          .fontSize(26)
          .fontWeight(FontWeight.Bold)
          .fontColor(COLOR_TEXT)
        Blank()
        Text('保存')
          .fontSize(13)
          .fontColor(COLOR_PRIMARY)
      }
      .width('100%')

      Text('根据时间、位置或手动触发，让家自动完成一组动作。')
        .fontSize(13)
        .fontColor(COLOR_TEXT_MUTED)
        .width('100%')

      Column({ space: 10 }) {
        this.SectionHeader('When', '触发条件')
        ForEach(this.scenes, (scene: SceneSnapshot) => {
          Row({ space: 12 }) {
            Text(scene.trigger.type === 'time' ? '⏱' : scene.trigger.type === 'location' ? '⌖' : '✦')
              .fontSize(16)
              .fontColor(COLOR_PRIMARY)
              .width(36)
              .height(36)
              .textAlign(TextAlign.Center)
              .backgroundColor(COLOR_PRIMARY_SOFT)
              .borderRadius(12)
            Column({ space: 2 }) {
              Text(scene.trigger.label)
                .fontSize(15)
                .fontWeight(FontWeight.Medium)
                .fontColor(COLOR_TEXT)
              Text(scene.trigger.type === 'manual' ? '手动' : scene.trigger.type === 'time' ? '时间' : '位置')
                .fontSize(12)
                .fontColor(COLOR_TEXT_MUTED)
            }
            .layoutWeight(1)
            Text('›')
              .fontSize(20)
              .fontColor(COLOR_TEXT_MUTED)
          }
          .padding(14)
          .borderRadius(14)
          .backgroundColor(COLOR_SURFACE)
          .border({ width: 1, color: COLOR_BORDER })
          .width('100%')
        }, (scene: SceneSnapshot) => `${scene.id}-trigger`)

        Button('+ 添加触发条件')
          .fontSize(13)
          .fontColor(COLOR_PRIMARY)
          .backgroundColor(COLOR_BG)
          .height(40)
          .borderRadius(12)
          .width('100%')
      }

      Column({ space: 10 }) {
        this.SectionHeader('Then Do', '执行动作')
        ForEach(this.scenes, (scene: SceneSnapshot) => {
          Column({ space: 10 }) {
            Row() {
              Column({ space: 2 }) {
                Text(scene.name)
                  .fontSize(18)
                  .fontWeight(FontWeight.Medium)
                  .fontColor(COLOR_TEXT)
                Text(scene.description)
                  .fontSize(12)
                  .fontColor(COLOR_TEXT_MUTED)
              }
              .layoutWeight(1)
              Toggle({ type: ToggleType.Switch, isOn: scene.enabled })
                .onChange((value: boolean) => this.toggleScene(scene.id, value))
            }
            .width('100%')

            ForEach(scene.actionsLabel, (action: string) => {
              Row({ space: 10 }) {
                Text('□')
                  .fontSize(14)
                  .fontColor(COLOR_PRIMARY)
                  .width(30)
                  .height(30)
                  .textAlign(TextAlign.Center)
                  .backgroundColor(COLOR_PRIMARY_SOFT)
                  .borderRadius(10)
                Text(action)
                  .fontSize(14)
                  .fontColor(COLOR_TEXT)
                  .layoutWeight(1)
                Text('−')
                  .fontSize(18)
                  .fontColor(COLOR_TEXT_MUTED)
              }
              .padding({ left: 10, right: 10, top: 8, bottom: 8 })
              .borderRadius(12)
              .backgroundColor(COLOR_SURFACE_WARM)
              .width('100%')
            }, (action: string) => `${scene.id}-${action}`)

            Row({ space: 10 }) {
              Button('立即运行')
                .fontSize(14)
                .fontColor('#FFFFFF')
                .backgroundColor(COLOR_PRIMARY)
                .borderRadius(12)
                .height(44)
                .layoutWeight(1)
                .onClick(() => this.runScene(scene.id))
              Button('编辑场景')
                .fontSize(14)
                .fontColor(COLOR_TEXT)
                .backgroundColor(COLOR_SURFACE_WARM)
                .borderRadius(12)
                .height(44)
                .layoutWeight(1)
            }
          }
          .padding(16)
          .borderRadius(16)
          .backgroundColor(COLOR_SURFACE)
          .border({ width: 1, color: COLOR_BORDER })
          .width('100%')
        }, (scene: SceneSnapshot) => scene.id)

        Button('+ 添加动作')
          .fontSize(13)
          .fontColor(COLOR_PRIMARY)
          .backgroundColor(COLOR_BG)
          .height(40)
          .borderRadius(12)
          .width('100%')
      }

      Column({ space: 10 }) {
        this.SectionHeader('Repeat', '重复周期')
        ForEach(this.scenes, (scene: SceneSnapshot) => {
          Row() {
            Text(scene.name)
              .fontSize(15)
              .fontColor(COLOR_TEXT)
              .layoutWeight(1)
            Text(this.repeatText(scene))
              .fontSize(13)
              .fontColor(COLOR_PRIMARY)
          }
          .padding(14)
          .borderRadius(14)
          .backgroundColor(COLOR_SURFACE)
          .border({ width: 1, color: COLOR_BORDER })
          .width('100%')
        }, (scene: SceneSnapshot) => `${scene.id}-repeat`)
      }

      Button('+ 创建新自动化')
        .fontSize(15)
        .fontColor(COLOR_PRIMARY)
        .height(52)
        .borderRadius(16)
        .backgroundColor(COLOR_BG)
        .border({ width: 1, color: COLOR_BORDER, style: BorderStyle.Dashed })
        .width('100%')

      if (this.feedback.length > 0) {
        Text(this.feedback)
          .fontSize(13)
          .fontColor(COLOR_PRIMARY)
          .padding(12)
          .borderRadius(12)
          .backgroundColor(COLOR_PRIMARY_SOFT)
          .width('100%')
      }
    }
  }

  /**
   * 通知页面：展示命令执行历史列表，按时间倒序排列。
   * 每条显示操作类型、结果状态和详细消息。
   */
  @Builder
  NotificationTab() {
    Column({ space: 14 }) {
      this.PageTitle('通知', '查看门锁、设备与自动化活动')
      if (this.history.length === 0) {
        Text('暂无通知')
          .fontSize(15)
          .fontColor(COLOR_TEXT_MUTED)
          .padding(16)
          .width('100%')
          .backgroundColor(COLOR_SURFACE)
          .borderRadius(16)
      }
      ForEach(this.history, (entry: CommandHistoryEntry) => {
        Row({ space: 12 }) {
          Text(entry.status === 'SUCCESS' ? '✓' : '!')
            .fontSize(16)
            .fontColor(COLOR_PRIMARY)
            .width(32)
            .height(32)
            .textAlign(TextAlign.Center)
            .backgroundColor(COLOR_PRIMARY_SOFT)
            .borderRadius(16)
          Column({ space: 4 }) {
            Text(this.formatHistory(entry))
              .fontSize(16)
              .fontColor(COLOR_TEXT)
              .fontWeight(FontWeight.Medium)
            Text(entry.message)
              .fontSize(12)
              .fontColor(COLOR_TEXT_MUTED)
          }
          .layoutWeight(1)
        }
        .padding(14)
        .borderRadius(16)
        .backgroundColor(COLOR_SURFACE)
        .border({ width: 1, color: COLOR_BORDER })
        .width('100%')
      }, (entry: CommandHistoryEntry) => entry.id)
    }
  }

  /**
   * 我的页面：展示家庭成员头像与状态、全屋广播按钮。
   */
  @Builder
  ProfileTab() {
    Column({ space: 14 }) {
      this.PageTitle('我的', '家庭成员与演示信息')
      Column({ space: 12 }) {
        Text('家庭成员')
          .fontSize(18)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_TEXT)
          .width('100%')
        Row({ space: 12 }) {
          this.MemberAvatar('妈', '在家')
          this.MemberAvatar('爸', '在家')
          this.MemberAvatar('Alex', '外出')
        }
      }
      .padding(16)
      .borderRadius(16)
      .backgroundColor(COLOR_SURFACE)
      .border({ width: 1, color: COLOR_BORDER })
      .width('100%')

      Button('对全屋广播')
        .fontSize(15)
        .fontColor('#FFFFFF')
        .height(48)
        .borderRadius(14)
        .backgroundColor(COLOR_PRIMARY)
        .width('100%')
    }
  }

  /** 底部固定导航栏：家 / 自动化 / 通知 / 我的 */
  @Builder
  BottomTabs() {
    Row() {
      this.TabButton('家', 0)
      this.TabButton('自动化', 1)
      this.TabButton('通知', 2)
      this.TabButton('我的', 3)
    }
    .padding({ left: 10, right: 10, top: 8, bottom: 8 })
    .backgroundColor(COLOR_SURFACE)
    .border({ width: { top: 1 }, color: COLOR_BORDER })
    .width('100%')
  }

  /**
   * 单个底部 Tab 按钮，选中态使用主色调高亮。
   * @param label 按钮文字
   * @param index Tab 索引
   */
  @Builder
  TabButton(label: string, index: number) {
    Button(label)
      .fontSize(13)
      .fontColor(this.currentTab === index ? COLOR_PRIMARY : COLOR_TEXT_MUTED)
      .backgroundColor(this.currentTab === index ? COLOR_PRIMARY_SOFT : COLOR_SURFACE)
      .borderRadius(14)
      .height(44)
      .layoutWeight(1)
      .onClick(() => {
        this.currentTab = index;
        if (index === 0) {
          this.activePage = 'home';
        } else if (index === 1) {
          this.activePage = 'automation';
        } else if (index === 2) {
          this.activePage = 'notifications';
        } else {
          this.activePage = 'profile';
        }
      })
  }

  /**
   * 设备行卡片：根据设备类型展示不同的控制界面。
   * - 门锁：验证解锁 / 上锁按钮
   * - 灯光：开关切换 + 柔和/明亮/暖光预设按钮
   * - 空调：开关切换 + 温度调节按钮（- / °C / +）
   */
  @Builder
  DeviceRow(device: DeviceSnapshot) {
    Column({ space: 12 }) {
      Row() {
        Column({ space: 4 }) {
          Text(device.name)
            .fontSize(18)
            .fontWeight(FontWeight.Medium)
            .fontColor(COLOR_TEXT)
          Text(this.formatStatus(device))
            .fontSize(13)
            .fontColor(COLOR_TEXT_MUTED)
        }
        Blank()
        if (device.kind === 'door-lock') {
          Button(device.state.locked ? '验证解锁' : '上锁')
            .fontSize(13)
            .fontColor('#FFFFFF')
            .height(44)
            .borderRadius(12)
            .backgroundColor(COLOR_PRIMARY)
            .onClick(() => this.send(device.id, 'lock', { locked: !(device.state.locked ?? true) } as LockPayload))
        } else if (device.kind === 'light') {
          Toggle({ type: ToggleType.Switch, isOn: device.state.power ?? false })
            .onChange((value: boolean) => this.send(device.id, 'switch', { on: value } as SwitchPayload))
        } else if (device.kind === 'air-conditioner') {
          Toggle({ type: ToggleType.Switch, isOn: device.state.power ?? false })
            .onChange((value: boolean) => this.send(device.id, 'switch', { on: value } as SwitchPayload))
        }
      }
      .width('100%')

      if (device.kind === 'light') {
        Row({ space: 8 }) {
          Button('柔和')
            .fontSize(12)
            .fontColor(COLOR_TEXT)
            .height(38)
            .backgroundColor(COLOR_SURFACE_WARM)
            .borderRadius(12)
            .layoutWeight(1)
            .onClick(() => this.send(device.id, 'set-brightness', { brightness: 35 } as BrightnessPayload))
          Button('明亮')
            .fontSize(12)
            .fontColor('#FFFFFF')
            .height(38)
            .backgroundColor(COLOR_PRIMARY)
            .borderRadius(12)
            .layoutWeight(1)
            .onClick(() => this.send(device.id, 'set-brightness', { brightness: 80 } as BrightnessPayload))
          Button('暖光')
            .fontSize(12)
            .fontColor(COLOR_TEXT)
            .height(38)
            .backgroundColor(COLOR_SURFACE_WARM)
            .borderRadius(12)
            .layoutWeight(1)
            .onClick(() => this.send(device.id, 'set-color-temperature', { colorTemperature: 3200 } as ColorTemperaturePayload))
        }
      }

      if (device.kind === 'air-conditioner') {
        Row({ space: 8 }) {
          Button('-')
            .height(38)
            .borderRadius(12)
            .backgroundColor(COLOR_SURFACE_WARM)
            .fontColor(COLOR_TEXT)
            .layoutWeight(1)
            .onClick(() => this.send(device.id, 'set-target-temperature', { targetTemperature: (device.state.targetTemperature ?? 24) - 1 } as TemperaturePayload))
          Text(`${device.state.targetTemperature ?? 24}°C`)
            .fontSize(16)
            .fontColor(COLOR_TEXT)
            .textAlign(TextAlign.Center)
            .layoutWeight(1)
          Button('+')
            .height(38)
            .borderRadius(12)
            .backgroundColor(COLOR_SURFACE_WARM)
            .fontColor(COLOR_TEXT)
            .layoutWeight(1)
            .onClick(() => this.send(device.id, 'set-target-temperature', { targetTemperature: (device.state.targetTemperature ?? 24) + 1 } as TemperaturePayload))
        }
      }
    }
    .padding(16)
    .borderRadius(16)
    .backgroundColor(COLOR_SURFACE)
    .border({ width: 1, color: COLOR_BORDER })
    .width('100%')
  }

  /**
   * 灯光场景预设按钮。点击后同时设置所有房间的亮度和色温。
   * @param label 按钮文字（阅读 / 专注 / 晨起）
   * @param brightness 目标亮度百分比
   * @param colorTemperature 目标色温（K）
   */
  @Builder
  LightSceneButton(label: string, brightness: number, colorTemperature: number) {
    Button(label)
      .fontSize(13)
      .fontColor(label === '专注' ? '#FFFFFF' : COLOR_TEXT)
      .height(44)
      .borderRadius(14)
      .backgroundColor(label === '专注' ? COLOR_PRIMARY : COLOR_SURFACE_WARM)
      .layoutWeight(1)
      .onClick(() => {
        this.setRoomBrightness('living-room', brightness);
        this.setRoomBrightness('kitchen', brightness);
        this.setRoomBrightness('bedroom', brightness);
        this.setRoomBrightness('bathroom', brightness);
        for (const light of this.lightDevices()) {
          this.send(light.id, 'set-color-temperature', { colorTemperature } as ColorTemperaturePayload);
        }
      })
  }

  /**
   * 房间灯光卡片：显示房间图标、名称、已开启数量，
   * 提供总开关和亮度滑块进行批量控制。
   */
  @Builder
  RoomLightCard(room: string) {
    Column({ space: 12 }) {
      Row() {
        Text(this.roomIcon(room))
          .fontSize(15)
          .fontColor(COLOR_PRIMARY)
          .textAlign(TextAlign.Center)
          .width(34)
          .height(34)
          .borderRadius(12)
          .backgroundColor(COLOR_PRIMARY_SOFT)
        Column({ space: 3 }) {
          Text(this.roomName(room))
            .fontSize(17)
            .fontWeight(FontWeight.Medium)
            .fontColor(COLOR_TEXT)
          Text(`${this.roomActive(room)}/${this.roomLights(room).length} 盏开启`)
            .fontSize(12)
            .fontColor(COLOR_TEXT_MUTED)
        }
        .layoutWeight(1)
        Toggle({ type: ToggleType.Switch, isOn: this.roomActive(room) > 0 })
          .onChange((value: boolean) => this.toggleRoom(room, value))
      }
      .width('100%')

      Row() {
        Text('强度')
          .fontSize(12)
          .fontColor(COLOR_TEXT_MUTED)
        Blank()
        Text(`${this.roomBrightness(room)}%`)
          .fontSize(12)
          .fontColor(COLOR_TEXT_MUTED)
      }
      .width('100%')

      Slider({
        value: this.roomBrightness(room),
        min: 0,
        max: 100,
        step: 5,
      })
        .blockColor(COLOR_PRIMARY)
        .trackColor(COLOR_SURFACE_WARM)
        .selectedColor(COLOR_PRIMARY)
        .onChange((value: number) => this.setRoomBrightness(room, Math.round(value)))
    }
    .padding(16)
    .borderRadius(16)
    .backgroundColor(COLOR_SURFACE)
    .border({ width: 1, color: COLOR_BORDER })
    .width('100%')
  }

  /**
   * 单个灯光设备详细卡片：开关切换、亮度滑块、
   * 色温预设按钮（暖光 / 自然 / 冷白）。
   */
  @Builder
  LightDeviceCard(device: DeviceSnapshot) {
    Column({ space: 12 }) {
      Row() {
        Column({ space: 3 }) {
          Text(device.name)
            .fontSize(17)
            .fontWeight(FontWeight.Medium)
            .fontColor(COLOR_TEXT)
          Text(`${this.roomName(device.room ?? 'living-room')} · ${this.formatStatus(device)}`)
            .fontSize(12)
            .fontColor(COLOR_TEXT_MUTED)
        }
        .layoutWeight(1)
        Toggle({ type: ToggleType.Switch, isOn: device.state.power ?? false })
          .onChange((value: boolean) => this.send(device.id, 'switch', { on: value } as SwitchPayload))
      }
      .width('100%')

      Row() {
        Text('亮度')
          .fontSize(12)
          .fontColor(COLOR_TEXT_MUTED)
        Blank()
        Text(`${device.state.brightness ?? 0}%`)
          .fontSize(12)
          .fontColor(COLOR_TEXT_MUTED)
      }
      .width('100%')

      Slider({
        value: device.state.brightness ?? 0,
        min: 0,
        max: 100,
        step: 5,
      })
        .blockColor(COLOR_PRIMARY)
        .trackColor(COLOR_SURFACE_WARM)
        .selectedColor(COLOR_PRIMARY)
        .onChange((value: number) => this.send(device.id, 'set-brightness', { brightness: Math.round(value) } as BrightnessPayload))

      Row({ space: 8 }) {
        Button('暖光')
          .fontSize(12)
          .fontColor(COLOR_TEXT)
          .height(36)
          .borderRadius(12)
          .backgroundColor(COLOR_SURFACE_WARM)
          .layoutWeight(1)
          .onClick(() => this.send(device.id, 'set-color-temperature', { colorTemperature: 2800 } as ColorTemperaturePayload))
        Button('自然')
          .fontSize(12)
          .fontColor(COLOR_TEXT)
          .height(36)
          .borderRadius(12)
          .backgroundColor(COLOR_SURFACE_WARM)
          .layoutWeight(1)
          .onClick(() => this.send(device.id, 'set-color-temperature', { colorTemperature: 3600 } as ColorTemperaturePayload))
        Button('冷白')
          .fontSize(12)
          .fontColor('#FFFFFF')
          .height(36)
          .borderRadius(12)
          .backgroundColor(COLOR_PRIMARY)
          .layoutWeight(1)
          .onClick(() => this.send(device.id, 'set-color-temperature', { colorTemperature: 5200 } as ColorTemperaturePayload))
      }
      .width('100%')
    }
    .padding(16)
    .borderRadius(16)
    .backgroundColor(COLOR_SURFACE)
    .border({ width: 1, color: COLOR_BORDER })
    .width('100%')
  }

  /** 门禁锁图标：圆形背景 + 锁定/解锁文字 */
  @Builder
  AccessLockIcon(locked: boolean) {
    Column({ space: 0 }) {
      Text(locked ? '∩' : '⌒')
        .fontSize(36)
        .fontColor('#FFFFFF')
        .fontWeight(FontWeight.Bold)
        .height(28)
        .textAlign(TextAlign.Center)
      Text(locked ? '锁' : '开')
        .fontSize(30)
        .fontColor(COLOR_PRIMARY)
        .fontWeight(FontWeight.Bold)
        .textAlign(TextAlign.Center)
        .width(58)
        .height(46)
        .borderRadius(12)
        .backgroundColor('#FFFFFF')
    }
    .alignItems(HorizontalAlign.Center)
  }

  /** 数字钥匙行：头像首字母 + 持有人信息 + 状态标签 */
  @Builder
  AccessKeyRow(key: AccessKey) {
    Row({ space: 12 }) {
      Text(key.holder.substring(0, 1))
        .fontSize(15)
        .fontColor('#FFFFFF')
        .fontWeight(FontWeight.Medium)
        .textAlign(TextAlign.Center)
        .width(38)
        .height(38)
        .borderRadius(19)
        .backgroundColor(COLOR_PRIMARY)
      Column({ space: 3 }) {
        Text(key.holder)
          .fontSize(16)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_TEXT)
        Text(this.accessKeySubtitle(key))
          .fontSize(12)
          .fontColor(COLOR_TEXT_MUTED)
      }
      .layoutWeight(1)
      Text(this.accessKeyStatus(key))
        .fontSize(12)
        .fontColor(COLOR_PRIMARY)
        .padding({ left: 9, right: 9, top: 5, bottom: 5 })
        .borderRadius(12)
        .backgroundColor(COLOR_PRIMARY_SOFT)
    }
    .padding(14)
    .borderRadius(16)
    .backgroundColor(COLOR_SURFACE)
    .border({ width: 1, color: COLOR_BORDER })
    .width('100%')
  }

  /** 其他入口点卡片：锁图标 + 名称状态 + 电量 */
  @Builder
  AccessPointCard(point: AccessPointSnapshot) {
    Row({ space: 12 }) {
      Text(point.locked ? '锁' : '开')
        .fontSize(16)
        .fontColor(COLOR_PRIMARY)
        .fontWeight(FontWeight.Medium)
        .textAlign(TextAlign.Center)
        .width(40)
        .height(40)
        .borderRadius(14)
        .backgroundColor(COLOR_PRIMARY_SOFT)
      Column({ space: 3 }) {
        Text(point.name)
          .fontSize(16)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_TEXT)
        Text(this.accessPointSubtitle(point))
          .fontSize(12)
          .fontColor(COLOR_TEXT_MUTED)
      }
      .layoutWeight(1)
      Text(`${point.battery}%`)
        .fontSize(12)
        .fontColor(COLOR_TEXT_MUTED)
    }
    .padding(14)
    .borderRadius(16)
    .backgroundColor(COLOR_SURFACE)
    .border({ width: 1, color: COLOR_BORDER })
    .width('100%')
  }

  /** 摄像头操作按钮（麦克风 / 快照 / 静音） */
  @Builder
  CameraActionButton(label: string, icon: string, selected: boolean) {
    Column({ space: 3 }) {
      Text(icon)
        .fontSize(12)
        .fontColor(selected ? '#FFFFFF' : COLOR_PRIMARY)
        .fontWeight(FontWeight.Medium)
        .textAlign(TextAlign.Center)
        .width('100%')
      Text(label)
        .fontSize(10)
        .fontColor(selected ? '#FFFFFF' : COLOR_TEXT_MUTED)
        .textAlign(TextAlign.Center)
        .width('100%')
    }
    .height(44)
    .padding({ top: 7, bottom: 6 })
    .borderRadius(14)
    .backgroundColor(selected ? COLOR_PRIMARY : COLOR_SURFACE_WARM)
    .layoutWeight(1)
  }

  /** 摄像头列表行：录制状态指示 + 名称位置 + 录像/停止按钮 */
  @Builder
  CameraRow(camera: CameraSnapshot) {
    Row({ space: 12 }) {
      Text(camera.recording ? 'REC' : 'CAM')
        .fontSize(12)
        .fontColor(camera.recording ? '#FFFFFF' : COLOR_PRIMARY)
        .fontWeight(FontWeight.Medium)
        .textAlign(TextAlign.Center)
        .width(42)
        .height(42)
        .borderRadius(14)
        .backgroundColor(camera.recording ? COLOR_PRIMARY : COLOR_PRIMARY_SOFT)
      Column({ space: 3 }) {
        Text(camera.name)
          .fontSize(16)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_TEXT)
        Text(`${camera.location} · ${this.cameraMotionText(camera)}`)
          .fontSize(12)
          .fontColor(COLOR_TEXT_MUTED)
      }
      .layoutWeight(1)
      Button(camera.recording ? '停止' : '录像')
        .fontSize(12)
        .fontColor(camera.recording ? '#FFFFFF' : COLOR_PRIMARY)
        .height(36)
        .borderRadius(12)
        .backgroundColor(camera.recording ? COLOR_PRIMARY : COLOR_PRIMARY_SOFT)
        .onClick(() => this.toggleCameraRecording(camera))
    }
    .padding(14)
    .borderRadius(16)
    .backgroundColor(COLOR_SURFACE)
    .border({ width: 1, color: COLOR_BORDER })
    .width('100%')
  }

  /** 指标药丸：标签 + 数值，均分宽度，暖色背景 */
  @Builder
  MetricPill(label: string, value: string) {
    Column({ space: 2 }) {
      Text(label)
        .fontSize(11)
        .fontColor(COLOR_TEXT_MUTED)
      Text(value)
        .fontSize(14)
        .fontWeight(FontWeight.Medium)
        .fontColor(COLOR_TEXT)
    }
    .padding(10)
    .borderRadius(12)
    .backgroundColor(COLOR_SURFACE_WARM)
    .layoutWeight(1)
  }

  /** 模式选择芯片：在家 / 离家 / 夜间，选中态为主色调 */
  @Builder
  ModeChip(label: string, selected: boolean) {
    Text(label)
      .fontSize(14)
      .fontColor(selected ? '#FFFFFF' : COLOR_TEXT)
      .textAlign(TextAlign.Center)
      .height(44)
      .layoutWeight(1)
      .borderRadius(14)
      .backgroundColor(selected ? COLOR_PRIMARY : COLOR_SURFACE)
      .border({ width: 1, color: selected ? COLOR_PRIMARY : COLOR_BORDER })
  }

  /** 区块标题：大标题 + 灰色副标题 */
  @Builder
  SectionHeader(title: string, subtitle: string) {
    Row() {
      Column({ space: 2 }) {
        Text(title)
          .fontSize(20)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_TEXT)
        Text(subtitle)
          .fontSize(12)
          .fontColor(COLOR_TEXT_MUTED)
      }
      Blank()
    }
    .width('100%')
  }

  /** 页面大标题：加粗主标题 + 副标题，用于通知/我的等页面 */
  @Builder
  PageTitle(title: string, subtitle: string) {
    Column({ space: 4 }) {
      Text(title)
        .fontSize(32)
        .fontWeight(FontWeight.Bold)
        .fontColor(COLOR_TEXT)
        .width('100%')
      Text(subtitle)
        .fontSize(14)
        .fontColor(COLOR_TEXT_MUTED)
        .width('100%')
    }
    .width('100%')
  }

  /** 家庭成员头像：圆形色块 + 首字 + 状态文字 */
  @Builder
  MemberAvatar(name: string, status: string) {
    Column({ space: 6 }) {
      Text(name)
        .fontSize(15)
        .fontColor('#FFFFFF')
        .fontWeight(FontWeight.Medium)
        .textAlign(TextAlign.Center)
        .width(52)
        .height(52)
        .borderRadius(26)
        .backgroundColor(COLOR_PRIMARY)
      Text(status)
        .fontSize(12)
        .fontColor(COLOR_TEXT_MUTED)
    }
    .layoutWeight(1)
  }
}
