import { Configuration } from "@bouncer/config";
import { ScheduledLimit } from "@bouncer/enforcer";
import { BrowseEventType, FrameContext, PageOwner } from "@bouncer/events";
import { BasicGuard } from "@bouncer/guard";
import { AlwaysBlock, ViewtimeCooldownLimit, WindowCooldownLimit } from "@bouncer/limit";
import { MemoryLogs } from "@bouncer/logs";
import { AndMatcher, DomainMatcher, NotMatcher, PageOwnerMatcher } from "@bouncer/matcher";
import { ClientMessageType, type ControllerMessage, type ControllerStatusMessage, FrameStatus, type IControllerMessenger } from "@bouncer/message";
import { BasicPage } from "@bouncer/page";
import { BasicPolicy } from "@bouncer/policy";
import { AlwaysSchedule } from "@bouncer/schedule";
import { timeGenerator } from "@bouncer/test";
import type { IClock } from "@bouncer/time";
import { describe, expect, test } from "@jest/globals";
import { ActiveTabs } from "./ActiveTabs";
import { Controller } from "./Controller";
import { GuardPostings } from "./GuardPostings";

class DummyClock implements IClock {
  constructor(
    public value: Date,
  ) { }

  time = (): Date => {
    return this.value;
  }
}

class DummyMessenger implements IControllerMessenger {
  private _lastMessage: {
    tabId: number,
    frameId: number,
    message: ControllerMessage,
  } | undefined;

  send = (tabId: number, frameId: number, message: ControllerMessage): void => {
    this._lastMessage = { tabId, frameId, message };
  }

  get lastMessage() { return this._lastMessage };

  clear = () => this._lastMessage === undefined;
}

describe("Controller regressions", () => {
  test("strange matcher interference", () => {
    const hnGuard = new BasicGuard(
      "hn",
      new BasicPolicy(
        "Block HackerNews after 1 seconds",
        true,
        new DomainMatcher("news.ycombinator.com", { include: [] }),
        new ScheduledLimit(
          new AlwaysSchedule(),
          new WindowCooldownLimit(1_000, 1_000)
        ),
      ),
      new BasicPage(),
    );
    const complexGuard = new BasicGuard(
      "complex",
      new BasicPolicy(
        "Complex matcher viewtime block",
        false,
        new NotMatcher(
          new DomainMatcher("example.com", { include: [] }),
        ),
        new ScheduledLimit(
          new AlwaysSchedule(),
          new AlwaysBlock(),
        ),
      ),
      new BasicPage(),
    )
    const guards = [hnGuard, complexGuard];
    const time = timeGenerator(new Date());
    const clock = new DummyClock(time());
    const logs = new MemoryLogs(clock);
    const messenger = new DummyMessenger();
    const guardPostings = new GuardPostings([], logs);
    const activeTabs = new ActiveTabs([], logs);
    const configuration = Configuration.default();
    const controller = new Controller(configuration, guards, guardPostings, activeTabs, messenger, logs);

    controller.handleBrowse({
      type: BrowseEventType.TAB_ACTIVATE,
      tabId: 1,
      time: clock.time(),
    });

    controller.handleBrowse({
      type: BrowseEventType.NAVIGATE,
      tabId: 1,
      frameId: 0,
      time: clock.time(),
      location: {
        url: new URL("https://news.ycombinator.com"),
        context: FrameContext.ROOT,
        owner: PageOwner.WEB,
      },
    });

    controller.handleMessage({
      type: ClientMessageType.STATUS,
      tabId: 1,
      frameId: 0,
      time: clock.time().toISOString(),
    });

    clock.value = time(1001);

    controller.handleMessage({
      type: ClientMessageType.STATUS,
      tabId: 1,
      frameId: 0,
      time: clock.time().toISOString(),
    });

    {
      const message = messenger.lastMessage?.message as ControllerStatusMessage;
      expect(message.status).toEqual(FrameStatus.BLOCKED);
    }

    controller.handleBrowse({
      type: BrowseEventType.NAVIGATE,
      tabId: 1,
      frameId: 0,
      time: clock.time(),
      location: {
        url: new URL("moz-extension://bouncer/dist/ui/blocked/index.html"),
        context: FrameContext.ROOT,
        owner: PageOwner.SELF,
      },
    });

    clock.value = time(3000);

    controller.handleBrowse({
      type: BrowseEventType.NAVIGATE,
      tabId: 1,
      frameId: 0,
      time: clock.time(),
      location: {
        url: new URL("https://news.ycombinator.com"),
        context: FrameContext.ROOT,
        owner: PageOwner.WEB,
      },
    });

    controller.handleMessage({
      type: ClientMessageType.STATUS,
      tabId: 1,
      frameId: 0,
      time: clock.time().toISOString(),
    });

    clock.value = time(4001);

    controller.handleMessage({
      type: ClientMessageType.STATUS,
      tabId: 1,
      frameId: 0,
      time: clock.time().toISOString(),
    });

    {
      const message = messenger.lastMessage?.message as ControllerStatusMessage;
      expect(message.status).toEqual(FrameStatus.BLOCKED);
    }
  });

  
  test("two equivalent policies, only one active", () => {
    const hn1Guard = new BasicGuard(
      "hn1",
      new BasicPolicy(
        "Block HackerNews after 1 seconds",
        true,
        new DomainMatcher("news.ycombinator.com", { include: [] }),
        new ScheduledLimit(
          new AlwaysSchedule(),
          new WindowCooldownLimit(1_000, 1_000)
        ),
      ),
      new BasicPage(),
    );
    const hn2Guard = new BasicGuard(
      "hn2",
      new BasicPolicy(
        "Block HackerNews after 1 seconds",
        false,
        new DomainMatcher("news.ycombinator.com", { include: [] }),
        new ScheduledLimit(
          new AlwaysSchedule(),
          new WindowCooldownLimit(1_000, 1_000)
        ),
      ),
      new BasicPage(),
    )
    const guards = [hn1Guard, hn2Guard];
    const time = timeGenerator(new Date());
    const clock = new DummyClock(time());
    const logs = new MemoryLogs(clock);
    const messenger = new DummyMessenger();
    const guardPostings = new GuardPostings([], logs);
    const activeTabs = new ActiveTabs([], logs);
    const configuration = Configuration.default();
    const controller = new Controller(configuration, guards, guardPostings, activeTabs, messenger, logs);

    controller.handleBrowse({
      type: BrowseEventType.TAB_ACTIVATE,
      tabId: 1,
      time: clock.time(),
    });

    controller.handleBrowse({
      type: BrowseEventType.NAVIGATE,
      tabId: 1,
      frameId: 0,
      time: clock.time(),
      location: {
        url: new URL("https://news.ycombinator.com"),
        context: FrameContext.ROOT,
        owner: PageOwner.WEB,
      },
    });

    controller.handleMessage({
      type: ClientMessageType.STATUS,
      tabId: 1,
      frameId: 0,
      time: clock.time().toISOString(),
    });

    clock.value = time(1001);

    controller.handleMessage({
      type: ClientMessageType.STATUS,
      tabId: 1,
      frameId: 0,
      time: clock.time().toISOString(),
    });

    {
      const message = messenger.lastMessage?.message as ControllerStatusMessage;
      expect(message.status).toEqual(FrameStatus.BLOCKED);
    }

    controller.handleBrowse({
      type: BrowseEventType.NAVIGATE,
      tabId: 1,
      frameId: 0,
      time: clock.time(),
      location: {
        url: new URL("moz-extension://bouncer/dist/ui/blocked/index.html"),
        context: FrameContext.ROOT,
        owner: PageOwner.SELF,
      },
    });

    clock.value = time(3000);

    controller.handleBrowse({
      type: BrowseEventType.NAVIGATE,
      tabId: 1,
      frameId: 0,
      time: clock.time(),
      location: {
        url: new URL("https://news.ycombinator.com"),
        context: FrameContext.ROOT,
        owner: PageOwner.WEB,
      },
    });

    controller.handleMessage({
      type: ClientMessageType.STATUS,
      tabId: 1,
      frameId: 0,
      time: clock.time().toISOString(),
    });

    clock.value = time(4001);

    controller.handleMessage({
      type: ClientMessageType.STATUS,
      tabId: 1,
      frameId: 0,
      time: clock.time().toISOString(),
    });

    {
      const message = messenger.lastMessage?.message as ControllerStatusMessage;
      expect(message.status).toEqual(FrameStatus.BLOCKED);
    }
  });

  test("can exclude pages owned by extension from guard", () => {
    const guard = new BasicGuard(
      "complex",
      new BasicPolicy(
        "not matcher",
        true,
        new AndMatcher([
          new NotMatcher(new PageOwnerMatcher(PageOwner.SELF)),          
          new NotMatcher(new DomainMatcher("example.com", { include: [] })),
        ]),
        new ScheduledLimit(
          new AlwaysSchedule(),
          new ViewtimeCooldownLimit(1_000, 1_000),
        ),
      ),
      new BasicPage(),
    );

    const guards = [guard];
    const time = timeGenerator(new Date("2024-01-01T00:00:00.000Z"));
    const clock = new DummyClock(time());
    const logs = new MemoryLogs(clock);
    const messenger = new DummyMessenger();
    const guardPostings = new GuardPostings([], logs);
    const activeTabs = new ActiveTabs([], logs);
    const configuration = Configuration.default();
    const controller = new Controller(configuration, guards, guardPostings, activeTabs, messenger, logs);

    const site = new URL("https://www.wikipedia.com");
    const frame = { tabId: 1, frameId: 0 };

    controller.handleBrowse({
      type: BrowseEventType.TAB_ACTIVATE,
      time: clock.time(),
      ...frame,
    });

    controller.handleBrowse({
      type: BrowseEventType.NAVIGATE,
      time: clock.time(),
      location: {
        url: site,
        context: FrameContext.ROOT,
        owner: PageOwner.WEB,
      },
      ...frame,
    });

    controller.handleMessage({
      type: ClientMessageType.STATUS,
      time: clock.time().toISOString(),
      ...frame,
    });

    clock.value = time(1_001); // 00:00:01.001

    controller.handleMessage({
      type: ClientMessageType.STATUS,
      time: clock.time().toISOString(),
      ...frame,
    });

    {
      const message = messenger.lastMessage?.message as ControllerStatusMessage;
      expect(message.status).toEqual(FrameStatus.BLOCKED);
    }

    controller.handleBrowse({
      type: BrowseEventType.NAVIGATE,
      time: clock.time(),
      location: {
        url: new URL("moz-extension://bouncer/dist/ui/blocked/index.html"),
        context: FrameContext.ROOT,
        owner: PageOwner.SELF,
      },
      ...frame,
    });

    clock.value = time(3_000); // 00:00:03

    controller.handleBrowse({
      type: BrowseEventType.NAVIGATE,
      time: clock.time(),
      location: {
        url: site,
        context: FrameContext.ROOT,
        owner: PageOwner.WEB,
      },
      ...frame,
    });

    controller.handleMessage({
      type: ClientMessageType.STATUS,
      time: clock.time().toISOString(),
      ...frame,
    });

    {
      const message = messenger.lastMessage?.message as ControllerStatusMessage;
      expect(message.status).toEqual(FrameStatus.ALLOWED);
      expect(guard.page.isShowing()).toBeTruthy();
    }

    clock.value = time(4_001); // 00:00:04.001

    controller.handleMessage({
      type: ClientMessageType.STATUS,
      time: clock.time().toISOString(),
      ...frame,
    });

    {
      const message = messenger.lastMessage?.message as ControllerStatusMessage;
      expect(message.status).toEqual(FrameStatus.BLOCKED);
    }
  });
})