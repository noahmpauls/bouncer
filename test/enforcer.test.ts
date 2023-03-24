import { describe, test, expect } from "@jest/globals";
import { ScheduledLimit } from "../src/enforcer";
import { ViewtimeCooldownLimit, WindowCooldownLimit } from "../src/limit";
import { BasicPage, PageAccess, PageEvent } from "../src/page";
import { AlwaysSchedule } from "../src/lib/schedule";


describe("ScheduledLimit -> WindowCooldownLimit", () => {
  test("doesn't block after waiting window and cooldown", () => {
    const enforcer = new ScheduledLimit(new AlwaysSchedule(), new WindowCooldownLimit(1000, 1000));
    const page = new BasicPage();

    // visit and show
    page.recordEvent(new Date(0), PageEvent.VISIT, "a");
    page.recordEvent(new Date(0), PageEvent.SHOW, "a");
    page.recordEvent(new Date(900), PageEvent.HIDE, "a");
    enforcer.applyTo(new Date(900), page);

    expect(page.checkAccess(new Date(900))).toEqual(PageAccess.ALLOWED);

    // wait until after window and cooldown to enforce
    enforcer.applyTo(new Date(2001), page);
    expect(page.checkAccess(new Date(2001))).toEqual(PageAccess.ALLOWED);
  });

  test("blocks for correct cooldown", () => {
    const enforcer = new ScheduledLimit(new AlwaysSchedule(), new WindowCooldownLimit(1000, 1000));
    const page = new BasicPage();

    // visit and show
    page.recordEvent(new Date(0), PageEvent.VISIT, "a");
    page.recordEvent(new Date(0), PageEvent.SHOW, "a");
    page.recordEvent(new Date(900), PageEvent.HIDE, "a");
    enforcer.applyTo(new Date(900), page);

    expect(page.checkAccess(new Date(900))).toEqual(PageAccess.ALLOWED);

    // wait until after window and cooldown to enforce
    enforcer.applyTo(new Date(1500), page);
    expect(page.checkAccess(new Date(1500))).toEqual(PageAccess.BLOCKED);
    enforcer.applyTo(new Date(2001), page);
    expect(page.checkAccess(new Date(2001))).toEqual(PageAccess.ALLOWED);
  });
});


describe("ScheduledLimit -> ViewtimeCooldownLimit", () => {
  test("doesn't block after waiting viewtime and cooldown", () => {
    const enforcer = new ScheduledLimit(new AlwaysSchedule(), new ViewtimeCooldownLimit(1000, 1000));
    const page = new BasicPage();

    page.recordEvent(new Date(0), PageEvent.VISIT, "a");
    page.recordEvent(new Date(0), PageEvent.SHOW, "a");
    page.recordEvent(new Date(1100), PageEvent.HIDE, "a");

    enforcer.applyTo(new Date(2001), page);
    expect(page.checkAccess(new Date(2001))).toEqual(PageAccess.ALLOWED);
  });

  test("blocks for correct cooldown", () => {
    const enforcer = new ScheduledLimit(new AlwaysSchedule(), new ViewtimeCooldownLimit(1000, 1000));
    const page = new BasicPage();

    page.recordEvent(new Date(0), PageEvent.VISIT, "a");
    page.recordEvent(new Date(0), PageEvent.SHOW, "a");
    page.recordEvent(new Date(1100), PageEvent.HIDE, "a");
    
    enforcer.applyTo(new Date(1500), page);
    expect(page.checkAccess(new Date(1500))).toEqual(PageAccess.BLOCKED);

    enforcer.applyTo(new Date(2001), page);
    expect(page.checkAccess(new Date(2001))).toEqual(PageAccess.ALLOWED);
  });
});
