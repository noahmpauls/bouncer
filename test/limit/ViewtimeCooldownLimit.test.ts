import { LimitAction, ViewtimeCooldownLimit } from "@bouncer/limit";
import { describe, test, expect } from "@jest/globals";
import { BasicPage, PageAccess, PageEvent, PageReset } from "@bouncer/page";
import { pageMetrics, timeGenerator } from "../testUtils";


describe("ViewtimeCooldownLimit action", () => {
  /**
   * Partitions
   * ----------
   * 
   *  page:
   *    access:
   *      [ ] allowed
   *      [ ] blocked
   *    msViewtime:
   *      amount:
   *        [ ] 0
   *        [ ] > 0
   *      compared to limit:
   *        [ ] < viewtime
   *        [ ] = viewtime
   *        [ ] > viewtime
   *          [ ] < cooldown
   *          [ ] = cooldown
   *          [ ] > cooldown
   *    msSinceHide:
   *      value:
   *        [ ] null
   *        [ ] number
   *      compared to limit:
   *        [ ] < viewtime
   *        [ ] = viewtime
   *        [ ] > viewtime
   *          [ ] < cooldown
   *          [ ] = cooldown
   *          [ ] > cooldown
   */

  test("allowed, viewtime = 0", () => {
    const viewtime = 1000;
    const cooldown = 500;
    const limit = new ViewtimeCooldownLimit(viewtime, cooldown);
    const page = pageMetrics({
      access: PageAccess.ALLOWED,
      isShowing: false,
      msViewtime: 0,
      msSinceInitialVisit: null,
      msSinceBlock: null,
      msSinceHide: null,
    });

    const action = limit.action(new Date(), page);

    const expected: LimitAction = {
      action: "NONE"
    };
    expect(action).toStrictEqual(expected);
  })


  test("allowed, viewtime < limit", () => {
    const viewtime = 1000;
    const cooldown = 500;
    const limit = new ViewtimeCooldownLimit(viewtime, cooldown);
    const page = pageMetrics({
      access: PageAccess.ALLOWED,
      isShowing: true,
      msViewtime: 500,
      msSinceInitialVisit: 1500,
      msSinceBlock: null,
      msSinceHide: null,
    });

    const action = limit.action(new Date(), page);

    const expected: LimitAction = {
      action: "NONE"
    };
    expect(action).toStrictEqual(expected);
  })
  

  test("allowed, viewtime = limit", () => {
    const time = timeGenerator();
    const viewtime = 1000;
    const cooldown = 500;
    const limit = new ViewtimeCooldownLimit(viewtime, cooldown);
    
    const msSinceHide = 50;
    const page = pageMetrics({
      access: PageAccess.ALLOWED,
      isShowing: false,
      msViewtime: 1000,
      msSinceInitialVisit: 30_000,
      msSinceBlock: null,
      msSinceHide,
    });

    const action = limit.action(time(), page);

    const expected: LimitAction = {
      action: "BLOCK",
      time: time(-msSinceHide),
    };
    expect(action).toStrictEqual(expected);
  })
  

  test("allowed, viewtime > limit, checktime < cooldown", () => {
    const time = timeGenerator();
    const viewtime = 1000;
    const cooldown = 500;
    const limit = new ViewtimeCooldownLimit(viewtime, cooldown);

    const msTimeOver = 1;
    const page = pageMetrics({
      access: PageAccess.ALLOWED,
      isShowing: true,
      msViewtime: viewtime + msTimeOver,
      msSinceInitialVisit: null,
      msSinceBlock: null,
      msSinceHide: null,
    });

    const msCheck = viewtime + msTimeOver;
    const action = limit.action(time(msCheck), page);

    const expected: LimitAction = {
      action: "BLOCK",
      time: time(msCheck),
    };
    expect(action).toStrictEqual(expected);
  })
  

  test("allowed, viewtime > limit, checktime = cooldown", () => {
    const time = timeGenerator();
    const viewtime = 1000;
    const cooldown = 500;
    const limit = new ViewtimeCooldownLimit(viewtime, cooldown);

    const msTimeOver = 250;
    const msViewtime = viewtime + msTimeOver;
    const page = pageMetrics({
      access: PageAccess.ALLOWED,
      isShowing: false,
      msViewtime: msViewtime,
      msSinceInitialVisit: null,
      msSinceBlock: null,
      msSinceHide: cooldown,
    });

    const msCheck = msViewtime + cooldown;
    const action = limit.action(time(msCheck), page);

    const expected: LimitAction = {
      action: "RESET",
      resets: [
        { type: PageReset.VIEWTIME, time: time(msCheck) }
      ]
    };
    expect(action).toStrictEqual(expected);
  })
  

  test("allowed, hidden, viewtime > limit, checktime > cooldown", () => {
    const time = timeGenerator(new Date(0));
    const viewtime = 1000;
    const cooldown = 500;
    const limit = new ViewtimeCooldownLimit(viewtime, cooldown);

    const msTimeOver = 1;
    const msOverCooldown = 20;
    const page = pageMetrics({
      access: PageAccess.ALLOWED,
      isShowing: false,
      msViewtime: viewtime + msTimeOver,
      msSinceInitialVisit: null,
      msSinceBlock: null,
      msSinceHide: cooldown + msOverCooldown,
    });

    const msCheck = viewtime + msTimeOver + cooldown + msOverCooldown;
    const action = limit.action(time(msCheck), page);

    const expected: LimitAction = {
      action: "RESET",
      resets: [
        { type: PageReset.VIEWTIME, time: time(msCheck - msOverCooldown) }
      ]
    };
    expect(action).toStrictEqual(expected);
  })


  test("allowed, visible, viewtime > limit + cooldown", () => {
    const time = timeGenerator(new Date(0));
    const viewtime = 1000;
    const cooldown = 500;
    const limit = new ViewtimeCooldownLimit(viewtime, cooldown);

    const msTimeOver = 1;
    const msViewtime = viewtime + cooldown + msTimeOver;
    const page = pageMetrics({
      access: PageAccess.ALLOWED,
      isShowing: true,
      msViewtime: msViewtime,
      msSinceInitialVisit: null,
      msSinceBlock: null,
      msSinceHide: null,
    });

    const msCheck = msViewtime;
    const action = limit.action(time(msCheck), page);

    const expected: LimitAction = {
      action: "BLOCK",
      time: time(msCheck)
    };
    expect(action).toStrictEqual(expected);
  })


  test("blocked, checktime < cooldown", () => {
    const time = timeGenerator();
    const viewtime = 1000;
    const cooldown = 500;
    const limit = new ViewtimeCooldownLimit(viewtime, cooldown);

    const page = pageMetrics({
      access: PageAccess.BLOCKED,
      msSinceBlock: cooldown - 1,
      isShowing: false,
      msViewtime: 0,
      msSinceInitialVisit: null,
      msSinceHide: null,
    });
    
    const msCheck = viewtime + cooldown - 1;
    const action = limit.action(time(msCheck), page);
    
    const expected: LimitAction = {
      action: "NONE"
    }
    expect(action).toStrictEqual(expected);
  })
  

  test("blocked, checktime = cooldown", () => {
    const time = timeGenerator();
    const viewtime = 1000;
    const cooldown = 500;
    const limit = new ViewtimeCooldownLimit(viewtime, cooldown);

    const page = pageMetrics({
      access: PageAccess.BLOCKED,
      msSinceBlock: cooldown,
      isShowing: false,
      msViewtime: 0,
      msSinceInitialVisit: null,
      msSinceHide: null,
    });
    
    const msCheck = viewtime + cooldown;
    const action = limit.action(time(msCheck), page);
    
    const expected: LimitAction = {
      action: "UNBLOCK"
    }
    expect(action).toStrictEqual(expected);
  })
  

  test("blocked, checktime > cooldown", () => {
    const time = timeGenerator();
    const viewtime = 1000;
    const cooldown = 500;
    const limit = new ViewtimeCooldownLimit(viewtime, cooldown);

    const page = pageMetrics({
      access: PageAccess.BLOCKED,
      msSinceBlock: cooldown + 1,
      isShowing: false,
      msViewtime: 0,
      msSinceInitialVisit: null,
      msSinceHide: null,
    });
    
    const msCheck = viewtime + cooldown;
    const action = limit.action(time(msCheck), page);
    
    const expected: LimitAction = {
      action: "UNBLOCK"
    }
    expect(action).toStrictEqual(expected);
  })
})


describe("ViewtimeCooldownLimit from/toObject", () => {
  test("from/toObject does not mutate", () => {
    const expected = new ViewtimeCooldownLimit(1000, 5000).toObject();
    const actual = ViewtimeCooldownLimit.fromObject(expected).toObject();
    expect(actual).toStrictEqual(expected);
  })
})
