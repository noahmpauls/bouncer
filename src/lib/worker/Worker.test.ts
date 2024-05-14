import { DummyEvents } from "@bouncer/events"
import { Worker } from "./Worker"
import { BouncerContext, LogsContext, WorkerContext } from "@bouncer/data"
import { MemoryStorage } from "@bouncer/storage"
import { ConfigContext } from "@bouncer/data/ConfigContext"
import { LogsStorageWriter, MemoryLogs } from "@bouncer/logs"
import type { IClock } from "@bouncer/time"
import { BasicGuard, serializeGuard } from "@bouncer/guard"
import { BasicPolicy } from "@bouncer/policy"
import { DomainMatcher } from "@bouncer/matcher"
import { ScheduledLimit } from "@bouncer/enforcer"
import { AlwaysSchedule } from "@bouncer/schedule"
import { ViewtimeCooldownLimit } from "@bouncer/limit"
import { BasicPage, PageAccess } from "@bouncer/page"
import { describe, expect, test } from "@jest/globals"
import { Controller } from "@bouncer/controller"

class DummyClock implements IClock {
  constructor(
    public value: Date,
  ) { }

  time = (): Date => {
    return this.value;
  }
}

describe("Worker", () => {
  test("pages are closed on browser close", async () => {
    const clock = new DummyClock(new Date("2024-05-01T00:00:00Z"));

    const buckets = {
      durable: new MemoryStorage(),
      session: new MemoryStorage(),
    }

    const events = new DummyEvents(clock, "https://bouncer");

    const logs = new MemoryLogs(clock);

    const guard = new BasicGuard(
      "guard",
      new BasicPolicy(
        "test guard",
        true,
        new DomainMatcher("exmaple.com", { include: [] }),
        new ScheduledLimit(
          new AlwaysSchedule(),
          new ViewtimeCooldownLimit(
            30_000,
            10_000,
          )
        )
      ),
      new BasicPage(),
    );

    const fallbacks = {
      activeTabs: { value: [] },
      activityLatest: { value: undefined },
      activityStarted: { value: false },
      guardPostings: { value: [] },
      guards: { value: [serializeGuard(guard)] },
    }

    const workerContext = new WorkerContext(
      () => new ConfigContext(buckets.durable),
      (config) => new LogsContext(
        logs,
        new LogsStorageWriter(config, buckets.durable),
      ),
      (logs) => BouncerContext.new(buckets, fallbacks, logs)
    );

    const worker = new Worker(
      events,
      workerContext,
      async (context) => {
        const { configuration, guards, guardPostings, activeTabs, browseActivity } = await context.fetch();
        const messenger = { send: () => { } }
        return new Controller(configuration, guards, guardPostings, activeTabs, browseActivity, messenger, clock, logs);
      }
    );

    worker.start();

    // 00:00:00 navigate to example.com
    await events.triggerActivated({ tabId: 1 });
    await events.triggerCommitted({ tabId: 1, frameId: 0, url: "https://exmaple.com", timeStamp: clock.time().getTime() });

    // 00:00:15 heartbeat
    clock.value = new Date(clock.value.getTime() + 15_000);
    await events.triggerAlarm({ name: "HEARTBEAT" });

    // browser session ends
    worker.stop();
    await worker.clear();
    buckets.session.clear();

    // 00:00:31 navigate to example.com
    clock.value = new Date(clock.value.getTime() + 16_000);
    worker.start();
    await events.triggerActivated({ tabId: 1 });
    await events.triggerCommitted({ tabId: 1, frameId: 0, url: "https://exmaple.com", timeStamp: clock.time().getTime() });

    // expect that example.com is still viewable
    const testGuard = await workerContext.fetch().then(data => data.guards.filter(g => g.id === "guard")[0]);
    expect(testGuard.page.access()).toEqual(PageAccess.ALLOWED);
  });
})