import { describe, test, expect } from "@jest/globals";
import { ScheduledLimit } from "@bouncer/enforcer";
import { ViewtimeCooldownLimit, WindowCooldownLimit } from "@bouncer/limit";
import { BasicPage, PageAccess, PageEvent } from "@bouncer/page";
import { AlwaysSchedule, PeriodicSchedule } from "@bouncer/schedule";
import { timeGenerator } from "./testUtils";


describe("ScheduledLimit -> WindowCooldownLimit", () => {
  test("doesn't block after waiting window and cooldown", () => {
    const enforcer = new ScheduledLimit(new AlwaysSchedule(), new WindowCooldownLimit(1000, 1000));
    const page = new BasicPage();

    // visit and show
    page.recordEvent(new Date(0), PageEvent.VISIT, "a");
    page.recordEvent(new Date(0), PageEvent.SHOW, "a");
    page.recordEvent(new Date(900), PageEvent.HIDE, "a");
    enforcer.applyTo(new Date(900), page);

    expect(page.access()).toEqual(PageAccess.ALLOWED);

    // wait until after window and cooldown to enforce
    enforcer.applyTo(new Date(2001), page);
    expect(page.access()).toEqual(PageAccess.ALLOWED);
  });

  test("blocks for correct cooldown", () => {
    const enforcer = new ScheduledLimit(new AlwaysSchedule(), new WindowCooldownLimit(1000, 1000));
    const page = new BasicPage();

    // visit and show
    page.recordEvent(new Date(0), PageEvent.VISIT, "a");
    page.recordEvent(new Date(0), PageEvent.SHOW, "a");
    page.recordEvent(new Date(900), PageEvent.HIDE, "a");
    enforcer.applyTo(new Date(900), page);

    expect(page.access()).toEqual(PageAccess.ALLOWED);

    // wait until after window and cooldown to enforce
    enforcer.applyTo(new Date(1500), page);
    expect(page.access()).toEqual(PageAccess.BLOCKED);
    enforcer.applyTo(new Date(2001), page);
    expect(page.access()).toEqual(PageAccess.ALLOWED);
  });
});


describe("ScheduledLimit -> ViewtimeCooldownLimit", () => {
  test("doesn't block after waiting viewtime and cooldown", () => {
    const enforcer = new ScheduledLimit(new AlwaysSchedule(), new ViewtimeCooldownLimit(1000, 1000));
    const page = new BasicPage();

    page.recordEvent(new Date(0), PageEvent.VISIT, "a");
    page.recordEvent(new Date(0), PageEvent.SHOW, "a");
    page.recordEvent(new Date(1100), PageEvent.HIDE, "a");

    enforcer.applyTo(new Date(2101), page);
    expect(page.access()).toEqual(PageAccess.ALLOWED);
  });

  test("blocks for correct cooldown", () => {
    const enforcer = new ScheduledLimit(new AlwaysSchedule(), new ViewtimeCooldownLimit(1000, 1000));
    const page = new BasicPage();

    page.recordEvent(new Date(0), PageEvent.VISIT, "a");
    page.recordEvent(new Date(0), PageEvent.SHOW, "a");
    page.recordEvent(new Date(1100), PageEvent.HIDE, "a");
    
    enforcer.applyTo(new Date(1500), page);
    expect(page.access()).toEqual(PageAccess.BLOCKED);

    enforcer.applyTo(new Date(2101), page);
    expect(page.access()).toEqual(PageAccess.ALLOWED);
  });
});

describe("regression tests", () => {
  test("AlwaysSchedule and ViewtimeCooldownLimit produces proper nextViewEvent", () => {
    const schedule = new AlwaysSchedule();

    const duration = 10_000, cooldown = 10_000;
    const limit = new ViewtimeCooldownLimit(duration, cooldown);
    const enforcer = new ScheduledLimit(schedule, limit);

    const startTime = new Date("2023-04-26T18:00:00.000Z");
    const t = timeGenerator(startTime);

    const page = new BasicPage();

    // first show
    page.recordEvent(t(0), PageEvent.VISIT, "");
    page.recordEvent(t(0), PageEvent.SHOW, "");

    enforcer.applyTo(t(50), page);
    expect(page.access()).toEqual(PageAccess.ALLOWED);
    expect(page.msViewtime(t(50))).toEqual(50);
    const nextViewEvent = enforcer.nextViewEvent(t(50), page);
    expect(nextViewEvent).toEqual(t(10_000));

    enforcer.applyTo(t(10_050), page);
    expect(page.access()).toEqual(PageAccess.BLOCKED);
  });

  test("AlwaysSchedule and WindowCooldownLimit produces proper nextTimelineEvent", () => {
    const schedule = new AlwaysSchedule();

    const duration = 10_000, cooldown = 10_000;
    const limit = new WindowCooldownLimit(duration, cooldown);
    const enforcer = new ScheduledLimit(schedule, limit);

    const startTime = new Date("2023-04-26T18:00:00.000Z");
    const t = timeGenerator(startTime);

    const page = new BasicPage();

    // first show
    page.recordEvent(t(0), PageEvent.VISIT, "");
    page.recordEvent(t(0), PageEvent.SHOW, "");

    enforcer.applyTo(t(50), page);
    expect(page.access()).toEqual(PageAccess.ALLOWED);
    expect(page.msViewtime(t(50))).toEqual(50);
    const nextTimelineEvent = enforcer.nextTimelineEvent(t(50), page);
    expect(nextTimelineEvent).toEqual(t(10_000));

    enforcer.applyTo(t(10_050), page);
    expect(page.access()).toEqual(PageAccess.BLOCKED);
  });

  test("enforcer with PeriodicSchedule and WindowCooldownLimit gives proper timeline events", () => {
    const schedule = new PeriodicSchedule("day", [ { start: 0, end: 0 } ]);

    const duration = 10_000, cooldown = 10_000;
    const limit = new WindowCooldownLimit(duration, cooldown);
    const enforcer = new ScheduledLimit(schedule, limit);

    const startTime = new Date("2024-01-16T18:00:00.000Z");
    const t = timeGenerator(startTime);

    const page = new BasicPage();

    page.recordEvent(t(0), PageEvent.VISIT, "");
    page.recordEvent(t(0), PageEvent.SHOW, "");

    const nextTimelineEvent = enforcer.nextTimelineEvent(startTime, page);
    expect(nextTimelineEvent!.getTime() - startTime.getTime()).toEqual(duration);
  });
})
