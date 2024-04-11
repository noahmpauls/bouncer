import { ScheduledLimit } from "@bouncer/enforcer";
import { BasicGuard } from "@bouncer/guard";
import { AlwaysBlock, ViewtimeCooldownLimit, WindowCooldownLimit } from "@bouncer/limit";
import { NotMatcher, ExactHostnameMatcher, AndMatcher, FrameTypeMatcher, OrMatcher } from "@bouncer/matcher";
import { BasicPage } from "@bouncer/page";
import { BasicPolicy } from "@bouncer/policy";
import { AlwaysSchedule, MinuteSchedule } from "@bouncer/schedule";
import { describe, expect, test } from "@jest/globals";
import { Controller } from "./Controller";
import { GuardPostings } from "./GuardPostings";
import { ActiveTabs } from "./ActiveTabs";
import { MemoryLogs } from "@bouncer/logs";
import { ClientMessageType, type ControllerMessage, type IControllerMessenger, type ControllerStatusMessage, FrameStatus } from "@bouncer/message";
import { MS, type IClock } from "@bouncer/time";
import { timeGenerator } from "@bouncer/test";
import { BrowseEventType } from "@bouncer/events";
import { Configuration } from "@bouncer/config";

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

  constructor() { }

  send = (tabId: number, frameId: number, message: ControllerMessage): void => {
    this._lastMessage = { tabId, frameId, message };
  }

  get lastMessage() { return this._lastMessage };

  clear = () => this._lastMessage = undefined;
}

describe("Controller regressions", () => {
  test("strange matcher interference", () => {
    const hnGuard = new BasicGuard(
      "hn",
      new BasicPolicy(
        "Block HackerNews after 1 seconds",
        true,
        new ExactHostnameMatcher("news.ycombinator.com"),
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
          new ExactHostnameMatcher("example.com"),
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
      url: new URL("https://news.ycombinator.com"),
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
      url: new URL("moz-extension://bouncer/dist/ui/blocked/index.html"),
    });

    clock.value = time(3000);

    controller.handleBrowse({
      type: BrowseEventType.NAVIGATE,
      tabId: 1,
      frameId: 0,
      time: clock.time(),
      url: new URL("https://news.ycombinator.com"),
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
        new ExactHostnameMatcher("news.ycombinator.com"),
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
        new ExactHostnameMatcher("news.ycombinator.com"),
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
      url: new URL("https://news.ycombinator.com"),
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
      url: new URL("moz-extension://bouncer/dist/ui/blocked/index.html"),
    });

    clock.value = time(3000);

    controller.handleBrowse({
      type: BrowseEventType.NAVIGATE,
      tabId: 1,
      frameId: 0,
      time: clock.time(),
      url: new URL("https://news.ycombinator.com"),
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

  test("complex guard working multiple times in a row", () => {
    const guard = new BasicGuard(
      "complex",
      new BasicPolicy(
        "Complex matcher viewtime block",
        true,
        new AndMatcher([
          new FrameTypeMatcher("ROOT"),
          new NotMatcher(new OrMatcher([
            new ExactHostnameMatcher("example.com"),
            new ExactHostnameMatcher("www.microsoft.com"),
            new ExactHostnameMatcher("stackoverflow.com"),
          ]))
        ]),
        new ScheduledLimit(
          new MinuteSchedule(30, 10),
          new ViewtimeCooldownLimit(10000, 15000),
        ),
      ),
      new BasicPage(),
    );

    const guards = [guard];
    const time = timeGenerator(new Date("2024-01-01T00:00:40.000Z"));
    const clock = new DummyClock(time());
    const logs = new MemoryLogs(clock);
    const messenger = new DummyMessenger();
    const guardPostings = new GuardPostings([], logs);
    const activeTabs = new ActiveTabs([], logs);
    const configuration = Configuration.default();
    const controller = new Controller(configuration, guards, guardPostings, activeTabs, messenger, logs);

    const site = new URL("https://www.cnbc.com");
    const frame = { tabId: 1, frameId: 0 };

    controller.handleBrowse({
      type: BrowseEventType.TAB_ACTIVATE,
      time: clock.time(),
      ...frame,
    });

    controller.handleBrowse({
      type: BrowseEventType.NAVIGATE,
      time: clock.time(),
      url: site,
      ...frame,
    });

    controller.handleMessage({
      type: ClientMessageType.STATUS,
      time: clock.time().toISOString(),
      ...frame,
    });

    clock.value = time(MS.SECOND * 11); // 00:00:51

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
      url: new URL("moz-extension://bouncer/dist/ui/blocked/index.html"),
      ...frame,
    });

    clock.value = time(MS.SECOND * 45); // 00:01:25

    controller.handleBrowse({
      type: BrowseEventType.NAVIGATE,
      time: clock.time(),
      url: site,
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
    }

    clock.value = time(MS.SECOND * 61); // 00:01:41

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