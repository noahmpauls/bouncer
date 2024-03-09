import { BrowseEventType, type BouncerBrowseEvent, type BouncerStatusEvent, type BrowseNavigateEvent, type BrowseTabActivateEvent, type BrowseTabRemoveEvent } from "@bouncer/events";
import type { IGuard } from "@bouncer/guard";
import { FrameStatus, type IControllerMessenger, BrowserControllerMessenger } from "@bouncer/message";
import { PageAccess, PageEvent } from "@bouncer/page";
import { Sets } from "@bouncer/utils";
import { GuardPostings } from "./GuardPostings";
import { ActiveTabs } from "./ActiveTabs";


export class Controller {
  private readonly guards: IGuard[];
  private readonly messenger: IControllerMessenger;
  private guardPostings: GuardPostings;
  private activeTabs: ActiveTabs;
  
  // TODO: use simplified constructor syntax
  constructor(guards: IGuard[], messenger: IControllerMessenger, guardPostings: GuardPostings, activeTabs: ActiveTabs) {
    this.guards = guards;
    this.messenger = messenger;
    this.guardPostings = guardPostings;
    this.activeTabs = activeTabs;
  }
  
  static async fromBrowser(guards: IGuard[]): Promise<Controller> {
    return new Controller(
      guards,
      BrowserControllerMessenger,
      new GuardPostings(),
      await ActiveTabs.fromBrowser()
    );
  }

  handleStatus = (event: BouncerStatusEvent) => {
    const {
      time,
      tabId,
      frameId
    } = event;
    console.log(`controller got status request from ${tabId}-${frameId}`);
    const guards = this.guardPostings.frame(tabId, frameId);
    console.log(`  found ${guards.length} guards for ${tabId}-${frameId}`);
    if (guards.length > 0) {
      this.enforce(time, guards);
    }
    this.messageFrame(time, tabId, frameId);
  }

  handleBrowse = async (event: BouncerBrowseEvent) => {
    const { time, browseEvent } = event;
    switch (browseEvent.type) {
      case BrowseEventType.NAVIGATE:
        await this.handleNavigate(time, browseEvent);
        break;
      case BrowseEventType.TAB_ACTIVATE:
        this.handleTabActivate(time, browseEvent);
        break;
      case BrowseEventType.TAB_REMOVE:
        this.handleTabRemove(time, browseEvent);
        break;
    }
  }

  private async handleNavigate(time: Date, event: BrowseNavigateEvent) {
    const { tabId, frameId, url } = event;

    const fromGuards = new Set(this.guardPostings.frame(tabId, frameId));
    const toGuards = new Set(this.guards.filter(g => g.policy.appliesTo(url)));
    
    const allGuards = Sets.union(fromGuards, toGuards);
    this.enforce(time, [...allGuards]);

    const removed = Sets.difference(fromGuards, toGuards);
    for (const guard of removed) {
      this.guardPostings.dismiss(tabId, frameId, guard);
      if (!this.isGuardingActiveTab(guard)) {
        this.applyEvent(time, guard, PageEvent.HIDE);
      }
    }

    const added = Sets.difference(toGuards, fromGuards);
    for (const guard of added) {
      if (!this.isGuardingActiveTab(guard) && this.activeTabs.has(tabId)) {
        this.applyEvent(time, guard, PageEvent.SHOW);
      }
      this.guardPostings.assign(tabId, frameId, guard);
    }

    this.messageTab(time, tabId);
  }

  private async handleTabActivate(time: Date, event: BrowseTabActivateEvent) {
    const tabId = event.tabId;
    // when popping a tab out of a window, previous tab is same as activated tab
    const previousTabId = tabId !== event.previousTabId ? event.previousTabId : undefined;
    
    const previousGuards = this.guardPostings.tab(previousTabId);
    const newGuards = this.guardPostings.tab(tabId);

    this.enforce(time, [...previousGuards, ...newGuards]);

    this.activeTabs.add(tabId);
    this.activeTabs.remove(previousTabId);

    for (const guard of previousGuards) {
      if (!this.isGuardingActiveTab(guard)) {
        this.applyEvent(time, guard, PageEvent.HIDE);
      }
    }

    for (const guard of newGuards) {
      this.applyEvent(time, guard, PageEvent.SHOW);
    }

    this.messageTab(time, tabId);
  }

  private handleTabRemove(time: Date, event: BrowseTabRemoveEvent) {
    const { tabId } = event;
    const guards = this.guardPostings.tab(tabId);
    this.enforce(time, guards);

    this.activeTabs.remove(tabId);
    this.guardPostings.dismissAll(tabId);

    for (const guard of guards) {
      if (!this.isGuardingActiveTab(guard)) {
        this.applyEvent(time, guard, PageEvent.HIDE);
      }
    }
  }

  private isGuardingActiveTab(guard: IGuard): boolean {
    return this.guardPostings.isGuardingActiveTab(guard, this.activeTabs);
  }

  private enforce(time: Date, guards: IGuard[]) {
    for (const guard of guards) {
      const { page, policy } = guard;
      policy.enforce(time, page);
    }
  }

  private applyEvent(time: Date, guard: IGuard, event: PageEvent) {
    const { page, policy } = guard;
    page.recordEvent(time, event);
    policy.enforce(time, page);
  }

  private frameStatus(guards: IGuard[]) {
    if (guards.length === 0) {
      return FrameStatus.UNTRACKED;
    }
    const blocked = guards
      .map(g => g.page.access() === PageAccess.BLOCKED)
      .reduce((a, b) => a || b, false);

    return blocked ? FrameStatus.BLOCKED : FrameStatus.ALLOWED;
  }

  private getCheckTimes(time: Date, guards: IGuard[]) {
    return {
      viewtimeCheck: this.getViewtimeCheck(time, guards),
      windowCheck: this.getTimelineCheck(time, guards),
    }
  }

  private getViewtimeCheck(time: Date, guards: IGuard[]) {
    let checks = guards
      .map(g => g.policy.nextViewEvent(time, g.page))
      .filter(d => d !== null)
      .map(d => d!.getTime());
    return checks.length > 0
      ? new Date(Math.min(...checks))
      : undefined;
  }

  private getTimelineCheck(time: Date, guards: IGuard[]) {
    let checks = guards
      .map(g => g.policy.nextTimelineEvent(time, g.page))
      .filter(d => d !== null)
      .map(d => d!.getTime());
    return checks.length > 0
      ? new Date(Math.min(...checks))
      : undefined;
  }

  private async messageTab(time: Date, tabId: number) {
    const frames = this.guardPostings.guardedFrames(tabId);
    for (const frameId of frames) {
      this.messageFrame(time, tabId, frameId);
    }
  }

  private async messageFrame(time: Date, tabId: number, frameId: number) {
    console.log(`  messaging ${tabId}-${frameId}`);
    const guards = this.guardPostings.frame(tabId, frameId);
    const status = this.frameStatus(guards);
    console.log(`  sending status ${status} to ${tabId}-${frameId}`);
    switch (status) {
      case FrameStatus.UNTRACKED:
        this.messenger.send(tabId, frameId, {
          status: FrameStatus.UNTRACKED
        });
        break;
      case FrameStatus.ALLOWED:
        const checkTimes = this.getCheckTimes(time, guards);
        this.messenger.send(tabId, frameId, {
          status: FrameStatus.ALLOWED,
          ...checkTimes
        });
        break;
      case FrameStatus.BLOCKED:
        this.messenger.send(tabId, frameId, {
          status: FrameStatus.BLOCKED,
        })
        break;
    }
  }
}
