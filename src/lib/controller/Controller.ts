import { BrowseEventType, type BrowseEvent, type BrowseNavigateEvent, type BrowseTabActivateEvent, type BrowseTabRemoveEvent } from "@bouncer/events";
import { BasicGuard, type IGuard } from "@bouncer/guard";
import { FrameStatus, type IControllerMessenger, type FrameMessage, type ClientStatusMessage, type FromFrame, ClientMessageType, type ClientPolicyCreateMessage, type ClientPoliciesGetMessage, ControllerMessageType, type ClientPolicyDeleteMessage, type ClientPolicyUpdateMessage, type ClientPageResetMessage } from "@bouncer/message";
import { BasicPage, PageAccess, PageActionType, PageEvent } from "@bouncer/page";
import { Sets } from "@bouncer/utils";
import { deserializePolicy, serializePolicy } from "@bouncer/policy";
import type { FrameType } from "@bouncer/matcher";
import type { IBouncerContext } from "@bouncer/data";
import type { ILogger, ILogs } from "@bouncer/logs";


export class Controller {
  private readonly logger: ILogger;
  
  constructor(
    private readonly context: IBouncerContext,
    private readonly messenger: IControllerMessenger,
    logs: ILogs,
  ) {
    this.logger = logs.logger("Controller");
  }
  
  handleMessage = async (message: FrameMessage) => {
    this.logger.info("handling message");
    switch (message.type) {
      case (ClientMessageType.STATUS):
        await this.handleStatus(message);
        break;
      case (ClientMessageType.POLICIES_GET):
        await this.handlePoliciesGet(message);
        break;
      case (ClientMessageType.POLICY_CREATE):
        await this.handlePolicyCreate(message);
        break;
      case (ClientMessageType.POLICY_UPDATE):
        await this.handlePolicyUpdate(message);
        break;
      case (ClientMessageType.POLICY_DELETE):
        await this.handlePolicyDelete(message);
        break;
      case (ClientMessageType.PAGE_RESET):
        await this.handlePageReset(message);
        break;
      default:
        console.error(`controller: unable to handle message type ${(message as any).type}`);
        break;
    }
    this.context.commit();
  }

  private handleStatus = async (message: FromFrame<ClientStatusMessage>) => {
    const { guardPostings } = await this.context.fetch();
    const { tabId, frameId } = message;
    const time = new Date(message.time);
    const guards = guardPostings.frame(tabId, frameId);
    if (guards.length > 0) {
      this.enforce(time, guards);
    }
    this.messageFrame(time, tabId, frameId);
  }

  private handlePoliciesGet = async (message: FromFrame<ClientPoliciesGetMessage>) => {
    const { guards } = await this.context.fetch();
    const { tabId, frameId } = message;
    const policies = guards.map(g => ({ id: g.id, policy: serializePolicy(g.policy)}));
    this.messenger.send(tabId, frameId, {
      type: ControllerMessageType.POLICIES_GET,
      policies,
    });
  }

  private handlePolicyCreate = async (message: FromFrame<ClientPolicyCreateMessage>) => {
    const { guards } = await this.context.fetch();
    const { tabId, frameId, policy } = message;
    const newGuard = new BasicGuard(crypto.randomUUID(), deserializePolicy(policy), new BasicPage());
    guards.push(newGuard);
    // TODO: add guard to existing frames? Then I would need to know URL of each frame...
    const policies = guards.map(g => ({ id: g.id, policy: serializePolicy(g.policy)}));
    this.messenger.send(tabId, frameId, {
      type: ControllerMessageType.POLICIES_GET,
      policies,
    });
  }

  private handlePolicyUpdate = async (message: FromFrame<ClientPolicyUpdateMessage>) => {
    const { guards } = await this.context.fetch();
    const { tabId, frameId, id, policy } = message;
    const guard = guards.find(g => g.id === id);
    if (guard !== undefined) {
      guard.policy = deserializePolicy(policy);
      this.messageGuard(new Date(), guard);
    }
    const policies = guards.map(g => ({ id: g.id, policy: serializePolicy(g.policy)}));
    this.messenger.send(tabId, frameId, {
      type: ControllerMessageType.POLICIES_GET,
      policies,
    });
  }

  private handlePolicyDelete = async (message: FromFrame<ClientPolicyDeleteMessage>) => {
    const { guards, guardPostings } = await this.context.fetch();
    const { tabId, frameId, id } = message;
    const guardIndex = guards.findIndex(g => g.id === id);
    if (guardIndex !== -1) {
      const guard = guards[guardIndex];
      guardPostings.dismissGuard(guard);
      guards.splice(guardIndex, 1);
    }
    const policies = guards.map(g => ({ id: g.id, policy: serializePolicy(g.policy)}));
    this.messenger.send(tabId, frameId, {
      type: ControllerMessageType.POLICIES_GET,
      policies,
    });
  }

  private handlePageReset = async (message: FromFrame<ClientPageResetMessage>) => {
    const { guards } = await this.context.fetch();
    const { id } = message;
    const time = new Date();
    const guard = guards.find(g => g.id === id);
    if (guard !== undefined) {
      guard.page.recordAction(PageActionType.RESET_METRICS, time);
      guard.page.recordAction(PageActionType.UNBLOCK, time);
    }
  }

  handleBrowse = async (event: BrowseEvent) => {
    const { time } = event;
    switch (event.type) {
      case BrowseEventType.NAVIGATE:
        await this.handleNavigate(time, event);
        break;
      case BrowseEventType.TAB_ACTIVATE:
        await this.handleTabActivate(time, event);
        break;
      case BrowseEventType.TAB_REMOVE:
        await this.handleTabRemove(time, event);
        break;
    }
    this.context.commit();
  }

  private handleNavigate = async (time: Date, event: BrowseNavigateEvent) => {
    const { guards, guardPostings, activeTabs } = await this.context.fetch();
    const { tabId, frameId, url } = event;
    const frameType: FrameType = frameId === 0 ? "ROOT" : "CHILD";

    const oldGuards = new Set(guardPostings.frame(tabId, frameId));
    const newGuards = new Set(guards.filter(g => g.policy.appliesTo(url, frameType)));
    
    const allGuards = Sets.union(oldGuards, newGuards);
    this.enforce(time, [...allGuards]);

    const removed = Sets.difference(oldGuards, newGuards);
    for (const guard of removed) {
      guardPostings.dismiss(tabId, frameId, guard);
      if (!guardPostings.isGuardingActiveTab(guard, activeTabs)) {
        this.applyEvent(time, guard, PageEvent.HIDE);
      }
    }

    const added = Sets.difference(newGuards, oldGuards);
    for (const guard of added) {
      const guardingActiveTab = guardPostings.isGuardingActiveTab(guard, activeTabs);
      if (!guardingActiveTab && activeTabs.has(tabId)) {
        this.applyEvent(time, guard, PageEvent.SHOW);
      }
      guardPostings.assign(tabId, frameId, guard);
    }

    this.messageTab(time, tabId);
  }

  private handleTabActivate = async (time: Date, event: BrowseTabActivateEvent) => {
    const { guardPostings, activeTabs } = await this.context.fetch();
    const tabId = event.tabId;
    // when popping a tab out of a window, previous tab is same as activated tab
    const previousTabId = tabId !== event.previousTabId ? event.previousTabId : undefined;
    
    const previousGuards = guardPostings.tab(previousTabId);
    const newGuards = guardPostings.tab(tabId);

    this.enforce(time, [...previousGuards, ...newGuards]);

    activeTabs.add(tabId);
    activeTabs.remove(previousTabId);

    for (const guard of previousGuards) {
      if (!guardPostings.isGuardingActiveTab(guard, activeTabs)) {
        this.applyEvent(time, guard, PageEvent.HIDE);
      }
    }

    for (const guard of newGuards) {
      this.applyEvent(time, guard, PageEvent.SHOW);
    }

    this.messageTab(time, tabId);
  }

  private handleTabRemove = async (time: Date, event: BrowseTabRemoveEvent) => {
    const { guardPostings, activeTabs } = await this.context.fetch();
    const { tabId } = event;
    const guards = guardPostings.tab(tabId);
    this.enforce(time, guards);

    activeTabs.remove(tabId);
    guardPostings.dismissTab(tabId);

    for (const guard of guards) {
      if (!guardPostings.isGuardingActiveTab(guard, activeTabs)) {
        this.applyEvent(time, guard, PageEvent.HIDE);
      }
    }
  }

  private enforce = (time: Date, guards: IGuard[]) => {
    for (const guard of guards) {
      const { page, policy } = guard;
      policy.enforce(time, page);
    }
  }

  private applyEvent = (time: Date, guard: IGuard, event: PageEvent) => {
    const { page, policy } = guard;
    page.recordEvent(time, event);
    policy.enforce(time, page);
  }

  private frameStatus = (guards: IGuard[]) => {
    if (guards.length === 0) {
      return FrameStatus.UNTRACKED;
    }
    const blocked = guards
      .filter(g => g.policy.active)
      .map(g => g.page.access() === PageAccess.BLOCKED)
      .reduce((a, b) => a || b, false);

    return blocked ? FrameStatus.BLOCKED : FrameStatus.ALLOWED;
  }

  private getCheckTimes = (time: Date, guards: IGuard[]) => {
    return {
      viewtimeCheck: this.getViewtimeCheck(time, guards),
      windowCheck: this.getTimelineCheck(time, guards),
    }
  }

  private getViewtimeCheck = (time: Date, guards: IGuard[]) => {
    let checks = guards
      .filter(g => g.policy.active)
      .map(g => g.policy.nextViewEvent(time, g.page))
      .filter(d => d !== undefined)
      .map(d => d!.getTime());
    return checks.length > 0
      ? new Date(Math.min(...checks))
      : undefined;
  }

  private getTimelineCheck = (time: Date, guards: IGuard[]) => {
    let checks = guards
      .filter(g => g.policy.active)
      .map(g => g.policy.nextTimelineEvent(time, g.page))
      .filter(d => d !== undefined)
      .map(d => d!.getTime());
    return checks.length > 0
      ? new Date(Math.min(...checks))
      : undefined;
  }

  private messageTab = async (time: Date, tabId: number) => {
    const { guardPostings } = await this.context.fetch();
    const frames = guardPostings.guardedFrames(tabId);
    for (const frameId of frames) {
      this.messageFrame(time, tabId, frameId);
    }
  }

  private messageGuard = async (time: Date, guard: IGuard) => {
    const { guardPostings } = await this.context.fetch();
    const assignments = guardPostings.assignments(guard);
    for (const { tabId, frameId } of assignments) {
      this.messageFrame(time, tabId, frameId);
    }
  }

  private messageFrame = async (time: Date, tabId: number, frameId: number) => {
    const { guardPostings } = await this.context.fetch();
    const guards = guardPostings.frame(tabId, frameId);
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
          windowCheck: checkTimes.windowCheck?.toISOString(),
          viewtimeCheck: checkTimes.viewtimeCheck?.toISOString(),
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
