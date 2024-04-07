import { ScheduledLimit } from "@bouncer/enforcer";
import { BasicGuard } from "@bouncer/guard";
import { AlwaysBlock, WindowCooldownLimit } from "@bouncer/limit";
import { NotMatcher, ExactHostnameMatcher } from "@bouncer/matcher";
import { BasicPage } from "@bouncer/page";
import { BasicPolicy } from "@bouncer/policy";
import { AlwaysSchedule } from "@bouncer/schedule";
import { describe, expect, test } from "@jest/globals";
import { Controller } from "./Controller";
import { GuardPostings } from "./GuardPostings";
import { ActiveTabs } from "./ActiveTabs";
import { MemoryLogs } from "@bouncer/logs";
import { ClientMessageType, type ControllerMessage, type IControllerMessenger, type ControllerStatusMessage, FrameStatus } from "@bouncer/message";
import type { IClock } from "@bouncer/time";
import { timeGenerator } from "@bouncer/test";
import { BrowseEventType } from "@bouncer/events";

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
    const controller = new Controller(guards, guardPostings, activeTabs, messenger, logs);

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
    const controller = new Controller(guards, guardPostings, activeTabs, messenger, logs);

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
})