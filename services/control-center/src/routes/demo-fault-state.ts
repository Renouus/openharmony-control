/** 演示故障注入状态（模块级可变） */
export type DemoFaultState = {
  /** 安全演示模式：为 true 时拒绝所有命令 */
  forceUnauthorizedCommands: boolean;
};

/** 创建默认故障状态（安全模式关闭） */
export function createDemoFaultState(): DemoFaultState {
  return { forceUnauthorizedCommands: false };
}
