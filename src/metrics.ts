import { LimitAction } from "./limits";
import { OptionalProperties } from "./utils";


export type PageEvent = "SHOW" | "HIDE";


export type IStorableViewMetrics = {
  /**
  * Map of actions to the last time those actions were newly taken, in ms
  * since UNIX epoch.
  */
  readonly actionTimes: { readonly [key in LimitAction]?: number }
  
  /**
   * Total viewtime spent without being blocked, in ms.
   */
  readonly spentViewtime: number | null;
}


export type IViewMetrics = {
  /**
   * The last action taken on this limit.
   */
  lastAction(): LimitAction | null;

  /**
   * Time elapsed since last time associated limit switched action to "BLOCK",
   * in ms.
   * 
   * @param currentTime the current time in ms since UNIX epoch
   */
  timeSinceBlock(currentTime: number): number | null;

  /**
   * Amount of time in the current period between blocks spent viewing
   * resources associated with these metrics, in ms.
   * 
   * @param currentTime the current time in ms since UNIX epoch
   */
  spentViewtime(currentTime: number): number | null;
}


export type IManagedViewMetrics = IViewMetrics & {
  /**
   * Apply a limit action and update the metrics accordingly.
   * 
   * @param action limit action applied
   * @param time when the action was applied
   */
  recordAction(action: LimitAction, time: number): void;

  /**
   * Apply a user event and update the metrics accordingly.
   *
   * @param event user event applied
   * @param time when the event was applied
   */
  recordEvent(event: PageEvent, time: number): void;
  
  /**
   * Convert the current metrics object to a format suitable for storage.
   */
  storable(): IStorableViewMetrics;
}


export class ManagedViewMetrics implements IManagedViewMetrics {
  private storableMetrics: IStorableViewMetrics;

  constructor(metrics?: OptionalProperties<IStorableViewMetrics>) {
    this.storableMetrics = {
      actionTimes: metrics?.actionTimes ?? {},
      spentViewtime: metrics?.spentViewtime ?? null
    };
    this.checkRep();
  }
  
  checkRep() {
    
  }
  
  lastAction(): LimitAction | null {
    throw new Error("not implemented");
  }
  
  timeSinceBlock(currentTime: number): number | null {
    throw new Error("not implemented");
  }
  
  spentViewtime(): number | null {
    throw new Error("not implemented");
  }
  
  recordAction(action: LimitAction, time: number): void {
    throw new Error("not implemented");
  }
  
  recordEvent(event: PageEvent, time: number): void {
    throw new Error("not implemented");
  }
  
  storable(): IStorableViewMetrics {
    throw new Error("not implemented");
  }
}
