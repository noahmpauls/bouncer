import { BrowseEventType, type BrowseEvent, type BrowseNavigateEvent, type BrowseTabActivateEvent, type BrowseTabRemoveEvent } from "@bouncer/events";
import { BasicGuard, type IGuard } from "@bouncer/guard";
import { FrameStatus, type IControllerMessenger, type FrameMessage, type ClientStatusMessage, type FromFrame, ClientMessageType, type ClientPolicyCreateMessage, type ClientPoliciesGetMessage, ControllerMessageType, type ClientPolicyDeleteMessage, type ClientPolicyUpdateMessage, type ClientPageResetMessage, type ClientConfigGetMessage, type ClientConfigUpdateMessage, BrowserControllerMessenger } from "@bouncer/message";
import { BasicPage, PageAccess, PageActionType, PageEvent } from "@bouncer/page";
import { Sets } from "@bouncer/utils";
import { deserializePolicy, serializePolicy } from "@bouncer/policy";
import type { FrameType } from "@bouncer/matcher";
import type { ILogger, ILogs } from "@bouncer/logs";
import type { GuardPostings } from "./GuardPostings";
import type { ActiveTabs } from "./ActiveTabs";
import type { IConfiguration } from "@bouncer/config";


export class Controller {
  private readonly logger: ILogger;
  
  constructor(
    private readonly configuration: IConfiguration,
    private readonly guards: IGuard[],
    private readonly guardPostings: GuardPostings,
    private readonly activeTabs: ActiveTabs,
    private readonly messenger: IControllerMessenger,
    logs: ILogs,
  ) {
    this.logger = logs.logger("Controller");
  }

  static browser = (
    configuration: IConfiguration,
    guards: IGuard[],
    guardPostings: GuardPostings,
    activeTabs: ActiveTabs,
    logs: ILogs,
  ): Controller => {
    return new Controller(
      configuration,
      guards,
      guardPostings,
      activeTabs,
      new BrowserControllerMessenger(logs),
      logs,
    );
  }
  
  handleMessage = (message: FrameMessage) => {
    const { tabId, frameId, type } = message;
    this.logger.info(`message ${type} from ${tabId}-${frameId}`);
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
      case (ClientMessageType.POLICY_UPDATE):
        this.handlePolicyUpdate(message);
        break;
      case (ClientMessageType.POLICY_DELETE):
        this.handlePolicyDelete(message);
        break;
      case (ClientMessageType.PAGE_RESET):
        this.handlePageReset(message);
        break;
      case (ClientMessageType.CONFIG_GET):
        this.handleConfigGet(message);
        break;
      case (ClientMessageType.CONFIG_UPDATE):
        this.handleConfigUpdate(message);
        break;
      default:
        this.logger.error(`no handler for message type ${(message as any).type}`);
        break;
    }
  }

  private handleStatus = (message: FromFrame<ClientStatusMessage>) => {
    const { tabId, frameId } = message;
    const time = new Date(message.time);
    const guards = this.guardPostings.frame(tabId, frameId);
    if (guards.length > 0) {
      this.enforce(time, guards);
    }
    this.messageFrame(time, tabId, frameId);
  }

  private handlePoliciesGet = (message: FromFrame<ClientPoliciesGetMessage>) => {
    const { tabId, frameId } = message;
    const policies = this.guards.map(g => ({ id: g.id, policy: serializePolicy(g.policy)}));
    this.messenger.send(tabId, frameId, {
      type: ControllerMessageType.POLICIES_GET,
      policies,
    });
  }

  private handlePolicyCreate = (message: FromFrame<ClientPolicyCreateMessage>) => {
    const { tabId, frameId, policy } = message;
    const newGuard = new BasicGuard(crypto.randomUUID(), deserializePolicy(policy), new BasicPage());
    this.guards.push(newGuard);
    // TODO: add guard to existing frames? Then I would need to know URL of each frame...
    const policies = this.guards.map(g => ({ id: g.id, policy: serializePolicy(g.policy)}));
    this.messenger.send(tabId, frameId, {
      type: ControllerMessageType.POLICIES_GET,
      policies,
    });
  }

  private handlePolicyUpdate = (message: FromFrame<ClientPolicyUpdateMessage>) => {
    const { tabId, frameId, id, policy } = message;
    const guard = this.guards.find(g => g.id === id);
    if (guard !== undefined) {
      guard.policy = deserializePolicy(policy);
      this.messageGuard(new Date(), guard);
    }
    const policies = this.guards.map(g => ({ id: g.id, policy: serializePolicy(g.policy)}));
    this.messenger.send(tabId, frameId, {
      type: ControllerMessageType.POLICIES_GET,
      policies,
    });
  }

  private handlePolicyDelete = (message: FromFrame<ClientPolicyDeleteMessage>) => {
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

  private handlePageReset = (message: FromFrame<ClientPageResetMessage>) => {
    const { id } = message;
    const time = new Date();
    const guard = this.guards.find(g => g.id === id);
    if (guard !== undefined) {
      guard.page.recordAction(PageActionType.RESET_METRICS, time);
      guard.page.recordAction(PageActionType.UNBLOCK, time);
    }
  }

  private handleConfigGet = (message: FromFrame<ClientConfigGetMessage>) => {
    const { tabId, frameId } = message;
    this.messenger.send(tabId, frameId, {
      type: ControllerMessageType.CONFIG_GET,
      config: this.configuration,
    });
  }

  private handleConfigUpdate = (message: FromFrame<ClientConfigUpdateMessage>) => {
    const { tabId, frameId, config } = message;
    if (config.maxLogs !== undefined) {
      this.configuration.maxLogs = config.maxLogs;
    }
    this.messenger.send(tabId, frameId, {
      type: ControllerMessageType.CONFIG_GET,
      config: this.configuration,
    });
  }

  handleBrowse = (event: BrowseEvent) => {
    const { tabId, type } = event;
    this.logger.debug(`event ${type} from ${tabId}`);
    const { time } = event;
    switch (event.type) {
      case BrowseEventType.NAVIGATE:
        this.handleNavigate(time, event);
        break;
      case BrowseEventType.TAB_ACTIVATE:
        this.handleTabActivate(time, event);
        break;
      case BrowseEventType.TAB_REMOVE:
        this.handleTabRemove(time, event);
        break;
    }
  }

  private handleNavigate = (time: Date, event: BrowseNavigateEvent) => {
    const { tabId, frameId, location } = event;
    this.logger.info(`${tabId}-${frameId} nagivates to ${location.url}`);

    const oldGuards = new Set(this.guardPostings.frame(tabId, frameId));
    const newGuards = new Set(this.guards.filter(g => g.policy.appliesTo(location)));
    
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

  private handleTabActivate = (time: Date, event: BrowseTabActivateEvent) => {
    const { tabId, previousTabId } = event;
    this.logger.info(`${tabId} activates`);
    
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

  private handleTabRemove = (time: Date, event: BrowseTabRemoveEvent) => {
    const { tabId } = event;
    this.logger.info(`${tabId} deactivates`);
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

  private isGuardingActiveTab = (guard: IGuard): boolean => {
    return this.guardPostings.isGuardingActiveTab(guard, this.activeTabs);
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
    const frames = this.guardPostings.guardedFrames(tabId);
    for (const frameId of frames) {
      this.messageFrame(time, tabId, frameId);
    }
  }

  private messageGuard = async (time: Date, guard: IGuard) => {
    const assignments = this.guardPostings.assignments(guard);
    for (const { tabId, frameId } of assignments) {
      this.messageFrame(time, tabId, frameId);
    }
  }

  private messageFrame = async (time: Date, tabId: number, frameId: number) => {
    const guards = this.guardPostings.frame(tabId, frameId);
    const status = this.frameStatus(guards);
    this.logger.info(`sending status ${status} to ${tabId}-${frameId}`);
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
