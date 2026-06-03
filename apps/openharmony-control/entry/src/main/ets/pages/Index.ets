import { DeviceSnapshot } from '../model/device-view-model';
import {
  AccessKey,
  AccessOverview,
  AccessPointSnapshot,
  BrightnessPayload,
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

const COLOR_BG: string = '#FAF5EE';
const COLOR_SURFACE: string = '#FFFFFF';
const COLOR_SURFACE_WARM: string = '#F6F0E8';
const COLOR_PRIMARY: string = '#C2652A';
const COLOR_PRIMARY_SOFT: string = '#FBE8D8';
const COLOR_TEXT: string = '#3A302A';
const COLOR_TEXT_MUTED: string = '#605850';
const COLOR_BORDER: string = '#D8D0C8';

@Entry
@Component
struct Index {
  private readonly api: DeviceApi = new DeviceApi('http://10.0.2.2:3443');
  @State currentTab: number = 0;
  @State activePage: string = 'home';
  @State devices: DeviceSnapshot[] = [];
  @State scenes: SceneSnapshot[] = [];
  @State history: CommandHistoryEntry[] = [];
  @State feedback: string = '';
  @State accessOverview: AccessOverview = {
    primary: { id: 'front-door', name: 'Front Door', locked: true, battery: 100 },
    keys: [],
    accessPoints: [],
  };
  @State summary: HomeSummary = {
    mode: 'home',
    security: { label: '正在连接', secure: true },
    devices: { total: 0, online: 0, offline: 0, warning: 0 },
    lighting: { active: 0 },
    climate: { temperature: 0, humidity: 0, label: '舒适' },
    environment: { aqi: 0, label: '优秀' },
    alerts: [],
  };

  async aboutToAppear(): Promise<void> {
    await this.refreshAll();
  }

  async refreshAll(): Promise<void> {
    try {
      this.summary = await this.api.getSummary();
      this.devices = await this.api.listDevices();
      this.scenes = await this.api.listScenes();
      this.history = await this.api.listHistory(8);
      this.accessOverview = await this.api.getAccessOverview();
      if (this.feedback === '控制中心暂不可用') {
        this.feedback = '';
      }
    } catch (error) {
      this.feedback = '控制中心暂不可用';
    }
  }

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

  findDevice(deviceId: string): DeviceSnapshot | undefined {
    return this.devices.find((device: DeviceSnapshot) => device.id === deviceId);
  }

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

  repeatText(scene: SceneSnapshot): string {
    if (scene.repeat.length === 0) {
      return '不重复';
    }
    return scene.repeat.join(' ');
  }

  accessKeyStatus(key: AccessKey): string {
    if (key.status === 'temporary') {
      return '临时';
    }
    if (key.status === 'expired') {
      return '已过期';
    }
    return '可用';
  }

  accessKeySubtitle(key: AccessKey): string {
    if (key.expiresAt !== undefined) {
      return `${key.role} · 限时通行`;
    }
    return key.role;
  }

  accessPointSubtitle(point: AccessPointSnapshot): string {
    return `${point.locked ? '已上锁' : '未上锁'} · ${point.battery}% 电量`;
  }

  lightDevices(): DeviceSnapshot[] {
    return this.devices.filter((device: DeviceSnapshot) => device.kind === 'light');
  }

  roomLights(room: string): DeviceSnapshot[] {
    return this.lightDevices().filter((device: DeviceSnapshot) => device.room === room);
  }

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

  roomActive(room: string): number {
    return this.roomLights(room).filter((device: DeviceSnapshot) => device.state.power === true).length;
  }

  roomBrightness(room: string): number {
    const activeLights = this.roomLights(room).filter((device: DeviceSnapshot) => device.state.power === true);
    if (activeLights.length === 0) {
      return 0;
    }
    const total = activeLights.reduce((sum: number, device: DeviceSnapshot) => sum + (device.state.brightness ?? 0), 0);
    return Math.round(total / activeLights.length);
  }

  async toggleRoom(room: string, on: boolean): Promise<void> {
    const lights = this.roomLights(room);
    for (const light of lights) {
      await this.send(light.id, 'switch', { on } as SwitchPayload);
    }
  }

  async setRoomBrightness(room: string, brightness: number): Promise<void> {
    const lights = this.roomLights(room);
    for (const light of lights) {
      await this.send(light.id, 'switch', { on: true } as SwitchPayload);
      await this.send(light.id, 'set-brightness', { brightness } as BrightnessPayload);
    }
  }

  build() {
    Column() {
      Scroll() {
        Column({ space: 16 }) {
          if (this.activePage === 'lighting') {
            this.LightingTab()
          } else if (this.activePage === 'access') {
            this.AccessTab()
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

      this.BottomTabs()
    }
    .width('100%')
    .height('100%')
    .backgroundColor(COLOR_BG)
  }

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
