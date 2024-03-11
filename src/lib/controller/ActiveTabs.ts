import browser from "webextension-polyfill";

/**
 * Represents the set of browser tabs that are currently active; that is, the
 * topmost tab of each window.
 */
export class ActiveTabs {
  private readonly tabIds = new Set<number>();
  
  /**
   * @param tabIds active tab IDs
   */
  constructor(tabIds?: number[]) {
    if (tabIds !== undefined) {
      this.tabIds = new Set(tabIds);
    }
  };

  /**
   * Convert active tabs data to an ActiveTabs instance.
   * 
   * @param obj data representing active tabs
   */
  static fromObject(obj: number[]): ActiveTabs {
    return new ActiveTabs(obj);
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