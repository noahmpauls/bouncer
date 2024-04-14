import { ViewtimeCooldownLimit } from "@bouncer/limit";
import { PageAccess, type PageAction, PageActionType } from "@bouncer/page";
import { pageMetrics, timeGenerator } from "@bouncer/test";
import { describe, expect, test } from "@jest/globals";


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
   *        [ ] undefined
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
      msSinceInitialVisit: undefined,
      msSinceBlock: undefined,
      msSinceHide: undefined,
    });

    const actions = limit.actions(new Date(), page);

    const expected: PageAction[] = [];
    expect(actions).toStrictEqual(expected);
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
      msSinceBlock: undefined,
      msSinceHide: undefined,
    });

    const actions = limit.actions(new Date(), page);

    const expected: PageAction[] = [];
    expect(actions).toStrictEqual(expected);
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
      msSinceBlock: undefined,
      msSinceHide,
    });

    const actions = limit.actions(time(), page);

    const expected: PageAction[] = [{
      type: PageActionType.BLOCK,
      time: time(-msSinceHide),
    }];
    expect(actions).toStrictEqual(expected);
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
      msSinceInitialVisit: undefined,
      msSinceBlock: undefined,
      msSinceHide: undefined,
    });

    const msCheck = viewtime + msTimeOver;
    const actions = limit.actions(time(msCheck), page);

    const expected: PageAction[] = [{
      type: PageActionType.BLOCK,      
      time: time(msCheck),
    }];
    expect(actions).toStrictEqual(expected);
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
      msSinceInitialVisit: undefined,
      msSinceBlock: undefined,
      msSinceHide: cooldown,
    });

    const msCheck = msViewtime + cooldown;
    const actions = limit.actions(time(msCheck), page);

    const expected: PageAction[] = [{
      type: PageActionType.RESET_VIEWTIME,
      time: time(msCheck),
    }];
    expect(actions).toStrictEqual(expected);
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
      msSinceInitialVisit: undefined,
      msSinceBlock: undefined,
      msSinceHide: cooldown + msOverCooldown,
    });

    const msCheck = viewtime + msTimeOver + cooldown + msOverCooldown;
    const actions = limit.actions(time(msCheck), page);

    const expected: PageAction[] = [{
      type: PageActionType.RESET_VIEWTIME,
      time: time(msCheck - msOverCooldown)
    }];
    expect(actions).toStrictEqual(expected);
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
      msSinceInitialVisit: undefined,
      msSinceBlock: undefined,
      msSinceHide: undefined,
    });

    const msCheck = msViewtime;
    const actions = limit.actions(time(msCheck), page);

    const expected: PageAction[] = [{
      type: PageActionType.BLOCK,      
      time: time(msCheck),
    }];
    expect(actions).toStrictEqual(expected);
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
      msSinceInitialVisit: undefined,
      msSinceHide: undefined,
    });
    
    const msCheck = viewtime + cooldown - 1;
    const actions = limit.actions(time(msCheck), page);
    
    const expected: PageAction[] = [];
    expect(actions).toStrictEqual(expected);
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
      msSinceInitialVisit: undefined,
      msSinceHide: undefined,
    });
    
    const msCheck = viewtime + cooldown;
    const actions = limit.actions(time(msCheck), page);
    
    const expected: PageAction[] = [{
      type: PageActionType.UNBLOCK,
      time: time(msCheck),
    }];
    expect(actions).toStrictEqual(expected);
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
      msSinceInitialVisit: undefined,
      msSinceHide: undefined,
    });
    
    const msCheck = viewtime + cooldown;
    const actions = limit.actions(time(msCheck), page);
    
    const expected: PageAction[] = [{
      type: PageActionType.UNBLOCK,
      time: time(msCheck),
    }];
    expect(actions).toStrictEqual(expected);
  })
})


describe("remainingViewtime", () => {
  test("non-zero viewtime", () => {
    const viewtime = 1000;
    const limit = new ViewtimeCooldownLimit(1000, Number.POSITIVE_INFINITY);

    const pageViewtime = 50;
    const page = pageMetrics({
      access: PageAccess.ALLOWED,
      msSinceBlock: undefined,
      isShowing: false,
      msViewtime: pageViewtime,
      msSinceInitialVisit: 100,
      msSinceHide: 200,
    });

    const remainingViewtime = limit.remainingViewtime(new Date(), page);
    const expected = viewtime - pageViewtime;
    expect(remainingViewtime).toEqual(expected);
  })
})


describe("ViewtimeCooldownLimit from/toObject", () => {
  test("from/toObject does not mutate", () => {
    const expected = new ViewtimeCooldownLimit(1000, 5000).toObject();
    const actual = ViewtimeCooldownLimit.fromObject(expected).toObject();
    expect(actual).toStrictEqual(expected);
  })
})
