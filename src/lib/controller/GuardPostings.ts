import type { IGuard } from "@bouncer/guard";
import type { ILogger, ILogs } from "@bouncer/logs";
import { assert } from "@bouncer/utils";
import { Maps } from "@bouncer/utils";
import type { ActiveTabs } from "./ActiveTabs";

/**
 * Represents the assignment of guards to browser tabs and frames.
 */
export class GuardPostings {
  /** Tab -> Frames, Frame -> Guards */
  private readonly tabsToGuards: Map<number, Map<number, Set<IGuard>>>;
  /** Guard -> Tabs */
  private readonly guardsToTabs: Map<IGuard, Set<number>>;
  private readonly logger: ILogger;

  /**
   * @param postings postings of guards to specific tabs
   */
  constructor(
    postings: { tabId: number, frameId: number, guard: IGuard }[],
    logs: ILogs,
  ) {
    this.logger = logs.logger("GuardPostings");
    
    const tabsToGuards = new Map();
    const guardsToTabs = new Map();

    for (const { tabId, frameId, guard} of postings) {
      const tab = Maps.getOrDefault(tabsToGuards, tabId, new Map());
      const frame = Maps.getOrDefault(tab, frameId, new Set());
      frame.add(guard);

      const guardTabs = Maps.getOrDefault(guardsToTabs, guard, new Set());
      guardTabs.add(tabId);
    }

    this.tabsToGuards = tabsToGuards;
    this.guardsToTabs = guardsToTabs;

    this.checkRep();
  }

  private checkRep() {
    for (const [tabId, frames] of this.tabsToGuards.entries()) {
      assert(frames.size > 0, `tab ${tabId} cannot have 0 frames`);
      for (const [frameId, guards] of frames.entries()) {
        assert(guards.size > 0, `frame ${frameId} cannot have 0 guards`);
        for (const guard of guards) {
          assert((this.guardsToTabs.get(guard) ?? new Set()).has(tabId), `tab ${tabId} points to guard ${guard.id}; reverse must be true`);
        }
      }
    }

    for (const [guard, tabs] of this.guardsToTabs.entries()) {
      assert(tabs.size > 0, `guard ${guard.id} cannot have 0 tabs`);
      for (const tabId of tabs) {
        const tabGuards = new Set([...(this.tabsToGuards.get(tabId) ?? new Map<number, Set<IGuard>>()).values()].flatMap(s => [...s]));
        assert(tabGuards.has(guard), `guard ${guard.id} points to tab ${tabId}; reverse must be true`);
      }
    }
  }

  /**
   * Convert guard postings data to a GuardPostings instance.
   * 
   * @param obj data representing guard postings
   * @param guards guard objects
   */
  static fromObject(obj: GuardPostingsData, guards: IGuard[], logs: ILogs): GuardPostings {
    const withGuards = obj.map(o => {
      const guard = guards.find(g => g.id === o.guardId);
      if (guard === undefined) {
        throw new Error(`guard object not found for id ${o.guardId}`);
      }
      return  { ...o, guard }
    });
    return new GuardPostings(withGuards, logs);
  }

  /**
   * Get the guards assigned to a frame.
   * 
   * @param tabId 
   * @param frameId 
   * @returns guards assigned to the frame
   */
  frame(tabId: number, frameId: number): IGuard[] {
    const guards = this.tabsToGuards.get(tabId)?.get(frameId);
    if (guards === undefined) {
      return [];
    }
    return [...guards];
  }

  /**
   * Get the guards assigned to the frames in a tab.
   * 
   * @param tabId 
   * @returns guards assigned to the tab
   */
  tab(tabId: number | undefined): IGuard[] {
    if (tabId === undefined) {
      return [];
    }
    const frames = this.tabsToGuards.get(tabId);
    if (frames === undefined) {
      return [];
    }
    const guards = [...frames.values()].flatMap(g => [...g]);
    const deduplicatedGuards = [...new Set(guards)]
    return deduplicatedGuards;
  }

  /**
   * Check whether a guard is assigned to any active tabs.
   * 
   * @param guard 
   * @param activeTabs currently active tabs
   * @returns whether the guard is assigned to any active tabs
   */
  isGuardingActiveTab(guard: IGuard, activeTabs: ActiveTabs): boolean {
    const guardedTabs = [...this.guardsToTabs.get(guard) ?? []];
    return guardedTabs.some(t => activeTabs.has(t));
  }

  /**
   * Get the frames in a tab that are guarded.
   * 
   * @param tabId 
   * @returns frames in the tab that have a guard assigned
   */
  guardedFrames(tabId: number): number[] {
    const frames = this.tabsToGuards.get(tabId);
    if (frames === undefined) {
      return [];
    }
    return [...frames.keys()];
  }

  /**
   * Get the assignments for the given guard.
   *
   * @param guard
   */
  assignments(guard: IGuard): { tabId: number, frameId: number }[] {
    const tabs = this.guardsToTabs.get(guard) ?? new Set();

    // TODO: if guardsToTabs stored frames as well, this would be a lot easier
    // to do...
    const assignments: { tabId: number, frameId: number }[] = [];
    for (const tabId of tabs) {
      for (const [frameId, guards] of this.tabsToGuards.get(tabId) ?? []) {
        if (guards.has(guard)) {
          assignments.push({ tabId, frameId})
        }
      }
    }

    return assignments;
  }

  /**
   * Assign a guard to a frame.
   * 
   * @param tabId 
   * @param frameId 
   * @param guard 
   */
  assign(tabId: number, frameId: number, guard: IGuard): void {
    this.logger.info(`assigning guard ${guard.id.substring(0, 7)} to ${tabId}-${frameId}`);
    const tab = Maps.getOrDefault(this.tabsToGuards, tabId, new Map());
    const frame = Maps.getOrDefault(tab, frameId, new Set());
    frame.add(guard);

    const guardTabs = Maps.getOrDefault(this.guardsToTabs, guard, new Set());
    guardTabs.add(tabId);

    this.checkRep();
  }

  /**
   * Dismiss a guard from its assignment to a frame.
   * 
   * @param tabId 
   * @param frameId 
   * @param guard 
   */
  dismiss(tabId: number, frameId: number, guard: IGuard): void {
    this.logger.info(`dismissing guard ${guard.id.substring(0, 7)} from ${tabId}-${frameId}`);
    this.dismissTabsToGuards(tabId, frameId, guard);
    this.dismissGuardsToTabs(tabId, guard);
    this.checkRep();
  }

  private dismissTabsToGuards = (tabId: number, frameId: number, guard: IGuard): void => {
    const tab = this.tabsToGuards.get(tabId);
    if (tab === undefined) {
      return;
    }
    const frame = tab.get(frameId);
    if (frame === undefined) {
      return;
    }
    frame.delete(guard);
    if (frame.size > 0) {
      return;
    }
    tab.delete(frameId);
    if (tab.size > 0) {
      return;
    }
    this.tabsToGuards.delete(tabId);
  }

  private dismissGuardsToTabs = (tabId: number, guard: IGuard): void => {
    const guardTabs = this.guardsToTabs.get(guard);
    if (guardTabs === undefined) {
      this.checkRep();
      return;
    }
    guardTabs.delete(tabId);
    if (guardTabs.size > 0) {
      this.checkRep();
      return;
    }
    this.guardsToTabs.delete(guard);
  }

  /**
   * Dismiss all guards from their assignments to frames in a tab.
   * 
   * @param tabId 
   */
  dismissTab(tabId: number): void {
    this.logger.info(`dismissing all guards from tab ${tabId}`);
    const tabGuards = this.tab(tabId);
    for (const guard of tabGuards) {
      const guardTabs = this.guardsToTabs.get(guard);
      if (guardTabs !== undefined) {
        guardTabs.delete(tabId);
        if (guardTabs.size === 0) {
          this.guardsToTabs.delete(guard);
        }
      }
    }

    this.tabsToGuards.delete(tabId);
    this.checkRep();
  }

  /**
   * Dismiss a guard from all its assignments.
   * 
   * @param guard
   */
  dismissGuard(guard: IGuard): void {
    this.logger.info(`dismissing guard ${guard.id.substring(0, 7)} from all assigments`);
    const assignments = this.assignments(guard);

    for (const { tabId, frameId } of assignments) {
      this.dismiss(tabId, frameId, guard);
    }

    this.checkRep();
  }

  /**
   * Convert to an object representation.
   * 
   * @returns guard postings data
   */
  toObject(): GuardPostingsData {
    const data: GuardPostingsData = [];
    for (const [tabId, frames] of this.tabsToGuards.entries()) {
      for (const [frameId, guards] of frames) {
        for (const guard of guards) {
          data.push({ tabId, frameId, guardId: guard.id})
        }
      }
    }
    return data;
  }
}

type GuardPostingsData = { tabId: number, frameId: number, guardId: string }[];