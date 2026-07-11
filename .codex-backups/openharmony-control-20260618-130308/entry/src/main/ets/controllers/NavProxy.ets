/**
 * Navigation 代理 — 替代 NavPathStack，将 push/pop 转发到 Index 的 @State currentSubPage。
 * 因为 ArkUI API 23 的 Navigation 组件有 bug（默认内容区不渲染），
 * 所以用 Stack 覆盖层 + NavProxy 替代 Navigation + NavPathStack。
 */
export class NavProxy {
  private _pushCb?: (name: string, param: Object | null) => void;
  private _popCb?: () => void;

  /** 由 Index 在 aboutToAppear 中注入回调 */
  setCallbacks(push: (name: string, param: Object | null) => void, pop: () => void): void {
    this._pushCb = push;
    this._popCb = pop;
  }

  pushPathByName(name: string, param: Object | null): void {
    this._pushCb?.(name, param);
  }

  pop(): void {
    this._popCb?.();
  }

  size(): number {
    return 0;
  }
}
