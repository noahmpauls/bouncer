import { BrowseEventType, type BrowseEvent, type BrowseNavigateEvent, type BrowseTabActivateEvent, type BrowseTabRemoveEvent } from "@bouncer/events";
import { BasicGuard, type IGuard } from "@bouncer/guard";
import { FrameStatus, type IControllerMessenger, type FrameMessage, type ClientStatusMessage, type FromFrame, ClientMessageType, type ClientPolicyCreateMessage, type ClientPoliciesGetMessage, ControllerMessageType, type ClientPolicyDeleteMessage } from "@bouncer/message";
import { BasicPage, PageAccess, PageEvent } from "@bouncer/page";
import { Sets } from "@bouncer/utils";
import { GuardPostings } from "./GuardPostings";
import { ActiveTabs } from "./ActiveTabs";
import { deserializePolicy, serializePolicy } from "@bouncer/policy";


export class Controller {
  
  constructor(
    private readonly guards: IGuard[],
    private guardPostings: GuardPostings,
    private activeTabs: ActiveTabs,
    private readonly messenger: IControllerMessenger,
  ) { }
  
  handleMessage = (message: FrameMessage) => {
    switch (message.type) {
      case (ClientMessageType.STATUS):
        this.handleStatus(message);
        break;
      case (ClientMessageType.POLICIES_GET):
        this.handlePoliciesGet(message);
        break;
      case (ClientMessageType.POLICY_CREATE):
        this.handlePolicyCreate(message);
        break;
      case (ClientMessageType.POLICY_DELETE):
        this.handlePolicyDelete(message);
        break;
      default:
        console.error(`controller: unable to handle message type ${message.type}`);
        break;
    }
  }

  private handleStatus = async (message: FromFrame<ClientStatusMessage>) => {
    const { time, tabId, frameId } = message;
    const guards = this.guardPostings.frame(tabId, frameId);
    if (guards.length > 0) {
      this.enforce(time, guards);
    }
    this.messageFrame(time, tabId, frameId);
  }

  private handlePoliciesGet = async(message: FromFrame<ClientPoliciesGetMessage>) => {
    const { tabId, frameId } = message;
    const policies = this.guards.map(g => ({ id: g.id, policy: serializePolicy(g.policy)}));
    this.messenger.send(tabId, frameId, {
      type: ControllerMessageType.POLICIES_GET,
      policies,
    });
  }

  private handlePolicyCreate = async (message: FromFrame<ClientPolicyCreateMessage>) => {
    const { policy } = message;
    const newGuard = new BasicGuard(crypto.randomUUID(), deserializePolicy(policy), new BasicPage());
    this.guards.push(newGuard);
    // TODO: add guard to existing frames? Then I would need to know URL of each frame...
  }

  private handlePolicyDelete = async (message: FromFrame<ClientPolicyDeleteMessage>) => {
    const { tabId, frameId, id } = message;
    const guardIndex = this.guards.findIndex(g => g.id === id);
    if (guardIndex !== -1) {
      const guard = this.guards[guardIndex];
      this.guardPostings.dismissGuard(guard);
      this.guards.splice(guardIndex, 1);
    }
    const policies = this.guards.map(g => ({ id: g.id, policy: serializePolicy(g.policy)}));
    this.messenger.send(tabId, frameId, {
      type: ControllerMessageType.POLICIES_GET,
      policies,
    });
  }

  handleBrowse = async (event: BrowseEvent) => {
    const { time } = event;
    switch (event.type) {
      case BrowseEventType.NAVIGATE:
        await this.handleNavigate(time, event);
        break;
      case BrowseEventType.TAB_ACTIVATE:
        this.handleTabActivate(time, event);
        break;
      case BrowseEventType.TAB_REMOVE:
        this.handleTabRemove(time, event);
        break;
    }
  }

  private async handleNavigate(time: Date, event: BrowseNavigateEvent) {
    const { tabId, frameId, url } = event;

    const oldGuards = new Set(this.guardPostings.frame(tabId, frameId));
    const newGuards = new Set(this.guards.filter(g => g.policy.appliesTo(url)));
    
    const allGuards = Sets.union(oldGuards, newGuards);
    this.enforce(time, [...allGuards]);

    const removed = Sets.difference(oldGuards, newGuards);
    for (const guard of removed) {
      this.guardPostings.dismiss(tabId, frameId, guard);
      if (!this.isGuardingActiveTab(guard)) {
        this.applyEvent(time, guard, PageEvent.HIDE);
      }
    }

    const added = Sets.difference(newGuards, oldGuards);
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
    this.guardPostings.dismissTab(tabId);

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
    const guards = this.guardPostings.frame(tabId, frameId);
    const status = this.frameStatus(guards);
    switch (status) {
      case FrameStatus.UNTRACKED:
        this.messenger.send(tabId, frameId, {
          type: ControllerMessageType.STATUS,
          status: FrameStatus.UNTRACKED
        });
        break;
      case FrameStatus.ALLOWED:
        const checkTimes = this.getCheckTimes(time, guards);
        this.messenger.send(tabId, frameId, {
          type: ControllerMessageType.STATUS,
          status: FrameStatus.ALLOWED,
          ...checkTimes
        });
        break;
      case FrameStatus.BLOCKED:
        this.messenger.send(tabId, frameId, {
          type: ControllerMessageType.STATUS,
          status: FrameStatus.BLOCKED,
        })
        break;
    }
  }
}
