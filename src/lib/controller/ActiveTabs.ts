import type { ILogger, ILogs } from "@bouncer/logs";

/**
 * Represents the set of browser tabs that are currently active; that is, the
 * topmost tab of each window.
 */
export class ActiveTabs {
  private readonly tabIds = new Set<number>();
  private readonly logger: ILogger;
  
  /**
   * @param tabIds active tab IDs
   */
  constructor(tabIds: number[], logs: ILogs) {
    this.logger = logs.logger("ActiveTabs");
    if (tabIds !== undefined) {
      this.tabIds = new Set(tabIds);
    }
    this.logger.error("ActiveTabs initialized");
  };

  /**
   * Convert active tabs data to an ActiveTabs instance.
   * 
   * @param obj data representing active tabs
   */
  static fromObject(obj: number[], logs: ILogs): ActiveTabs {
    return new ActiveTabs(obj, logs);
  }

  private checkRep() { }

  /**
   * Check whether a tab is active.
   * 
   * @param tabId 
   * @returns whether the given tab is active
   */
  has(tabId: number): boolean {
    return this.tabIds.has(tabId);
  }

  /**
   * Activate a tab.
   * 
   * @param tabId 
   */
  add(tabId: number): void {
    this.tabIds.add(tabId);
    this.checkRep();
  }

  /**
   * Deactivate a tab.
   * 
   * @param tabId 
   */
  remove(tabId: number | undefined): void {
    if (tabId !== undefined) {
      this.tabIds.delete(tabId);
    }
    this.checkRep();
  }

  /**
   * Convert to an object representation.
   * 
   * @returns active tab data
   */
  toObject(): number[] {
    return [...this.tabIds];
  }  
}