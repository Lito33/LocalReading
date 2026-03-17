import { common } from '@kit.AbilityKit';

export class GlobalContext {
  private static instance: GlobalContext;
  private _context?: common.UIAbilityContext;

  private constructor() {}

  public static getInstance(): GlobalContext {
    if (!GlobalContext.instance) {
      GlobalContext.instance = new GlobalContext();
    }
    return GlobalContext.instance;
  }

  public setContext(context: common.UIAbilityContext): void {
    this._context = context;
  }

  public getContext(): common.UIAbilityContext {
    if (!this._context) {
      throw new Error('Global context not set. Call setContext first.');
    }
    return this._context;
  }
}