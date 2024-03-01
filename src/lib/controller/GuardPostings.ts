import type { IGuard } from "@bouncer/guard";
import { assert } from "@bouncer/utils";
import type { ActiveTabs } from "./ActiveTabs";

/**
 * Represents the assignment of guards to browser tabs and frames.
 */
export class GuardPostings {
  private readonly tabsToGuards: Map<number, Map<number, Set<IGuard>>> = new Map();
  private readonly guardsToTabs: Map<IGuard, Set<number>> = new Map();

  constructor() {
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
    let tab = this.tabsToGuards.get(tabId);
    if (tab === undefined) {
      tab = new Map();
      this.tabsToGuards.set(tabId, tab);
    }
    let frame = tab.get(frameId);
    if (frame === undefined) {
      frame = new Set();
      tab.set(frameId, frame);
    }
    frame.add(guard);
    
    let guardTabs = this.guardsToTabs.get(guard);
    if (guardTabs === undefined) {
      guardTabs = new Set();
      this.guardsToTabs.set(guard, guardTabs);
    }
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
}