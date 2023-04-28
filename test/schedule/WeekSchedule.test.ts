import { WeekSchedule } from "@bouncer/schedule";
import { describe, test, expect } from "@jest/globals";
import { timeGenerator } from "../testUtils";
import { BasicPage, PageEvent } from "@bouncer/page";

describe("regression", () => {
  test("correct actions", () => {
    const DAY_MS =  24 * 60 * 60 * 1000;
    const schedule = new WeekSchedule (
      [
        { start: (3 * DAY_MS), end: (4 * DAY_MS) },
      ]
    );

    const startTime = new Date("2023-04-26T18:00:00.000Z");
    const t = timeGenerator(startTime);

    const page = new BasicPage();

    // first show
    page.recordEvent(t(0), PageEvent.VISIT, "");
    page.recordEvent(t(0), PageEvent.SHOW, "");

    const actions = schedule.actions(t(0), t(50), page);
    expect(actions).toStrictEqual([]);
  })

  test("correct actions 2", () => {
    const DAY_MS =  24 * 60 * 60 * 1000;
    const schedule = new WeekSchedule (
      [
        { start: (5 * DAY_MS), end: (6 * DAY_MS) },
      ]
    );

    const startTime = new Date("2023-04-26T18:00:00.000Z");
    const t = timeGenerator(startTime);

    const page = new BasicPage();

    // first show
    page.recordEvent(t(0), PageEvent.VISIT, "");
    page.recordEvent(t(0), PageEvent.SHOW, "");

    const actions = schedule.actions(t(0), t(50), page);
    expect(actions).toStrictEqual([]);
  })

  test("correct actions", () => {
    const DAY_MS =  24 * 60 * 60 * 1000;
    const schedule = new WeekSchedule (
      [
        { start: (3 * DAY_MS), end: (4 * DAY_MS) },
        { start: (5 * DAY_MS), end: (6 * DAY_MS) },
      ]
    );

    const startTime = new Date("2023-04-26T18:00:00.000Z");
    const t = timeGenerator(startTime);

    const page = new BasicPage();

    // first show
    page.recordEvent(t(0), PageEvent.VISIT, "");
    page.recordEvent(t(0), PageEvent.SHOW, "");

    const actions = schedule.actions(t(0), t(50), page);
    expect(actions).toStrictEqual([]);
  })
})
