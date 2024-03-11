import type { IGuard } from "@bouncer/guard";
import { assert } from "@bouncer/utils";
import type { ActiveTabs } from "./ActiveTabs";
import { Maps } from "@bouncer/utils/Maps";

/**
 * Represents the assignment of guards to browser tabs and frames.
 */
export class GuardPostings {
  /** Tab -> Frames, Frame -> Guards */
  private readonly tabsToGuards: Map<number, Map<number, Set<IGuard>>>;
  /** Guard -> Tabs */
  private readonly guardsToTabs: Map<IGuard, Set<number>>;

  /**
   * @param postings postings of guards to specific tabs
   */
  constructor(postings: { tabId: number, frameId: number, guard: IGuard }[]) {
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
  static fromObject(obj: GuardPostingsData, guards: IGuard[]): GuardPostings {
    const withGuards = obj.map(o => ({
      ...o,
      guard: guards.find(g => g.id === o.guardId),
    }));
    const notFound = withGuards.filter(o => o.guard === undefined);
    if (notFound.length > 0) {
      throw new Error(`guard object not found for ids ${notFound.map(o => o.guardId).join(',')}`);
    }
    return new GuardPostings(withGuards as any);
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
   * Assign a guard to a frame.
   * 
   * @param tabId 
   * @param frameId 
   * @param guard 
   */
  assign(tabId: number, frameId: number, guard: IGuard): void {
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

    const guardTabs = this.guardsToTabs.get(guard);
    if (guardTabs === undefined) {
      return;
    }
    guardTabs.delete(tabId);
    if (guardTabs.size > 0) {
      return;
    }
    this.guardsToTabs.delete(guard);
    this.checkRep();
  }

  /**
   * Dismiss all guards from their assignments to frames in a tab.
   * 
   * @param tabId 
   */
  dismissAll(tabId: number): void {
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