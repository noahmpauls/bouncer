import { WindowCooldownLimit } from "@bouncer/limit";
import { PageAccess, type PageAction, PageActionType } from "@bouncer/page";
import { describe, test, expect } from "@jest/globals";
import { pageMetrics, timeGenerator } from "@bouncer/test";


describe("WindowCooldownLimit action", () => {
  test("not visited", () => {
    const time = timeGenerator(new Date(0));
    const window = 1000;
    const cooldown = 500;
    const limit = new WindowCooldownLimit(window, cooldown);

    const page = pageMetrics({
      access: PageAccess.ALLOWED,
      msSinceInitialVisit: undefined,
      msSinceBlock: undefined,
      isShowing: false,
      msViewtime: 0,
      msSinceHide: undefined,
    });
    
    const actions = limit.actions(time(), page);
    const expectedActions: PageAction[] = [];
    expect(actions).toStrictEqual(expectedActions);

    const remaining = limit.remainingWindow(time(), page);
    const expectedRemaining = window;
    expect(remaining).toEqual(expectedRemaining);
  })
  

  test("since visit < limit", () => {
    const time = timeGenerator(new Date(0));
    const window = 1000;
    const cooldown = 500;
    const limit = new WindowCooldownLimit(window, cooldown);

    const msSinceVisit = window - 50;
    const page = pageMetrics({
      access: PageAccess.ALLOWED,
      msSinceInitialVisit: msSinceVisit,
      msSinceBlock: undefined,
      isShowing: false,
      msViewtime: 0,
      msSinceHide: undefined,
    });
    
    const actions = limit.actions(time(), page);
    const expectedActions: PageAction[] = [];
    expect(actions).toStrictEqual(expectedActions);

    const remaining = limit.remainingWindow(time(), page);
    const expectedRemaining = window - msSinceVisit;
    expect(remaining).toEqual(expectedRemaining);
  })
  

  test("since visit = limit", () => {
    const time = timeGenerator(new Date(0));
    const window = 1000;
    const cooldown = 500;
    const limit = new WindowCooldownLimit(window, cooldown);

    const msSinceVisit = window;
    const page = pageMetrics({
      access: PageAccess.ALLOWED,
      msSinceInitialVisit: msSinceVisit,
      msSinceBlock: undefined,
      isShowing: false,
      msViewtime: 0,
      msSinceHide: undefined,
    });
    
    const msCheck = 0;
    const actions = limit.actions(time(msCheck), page);
    const expectedActions: PageAction[] = [{
      type: PageActionType.BLOCK,
      time: time(msCheck),
    }];
    expect(actions).toStrictEqual(expectedActions);

    const remaining = limit.remainingWindow(time(msCheck), page);
    const expectedRemaining = 0;
    expect(remaining).toEqual(expectedRemaining);
  })
  

  test("allowed, since visit > limit, < cooldown", () => {
    const time = timeGenerator(new Date(0));
    const window = 1000;
    const cooldown = 500;
    const limit = new WindowCooldownLimit(window, cooldown);

    const msOver = 50;
    const msSinceVisit = window + msOver;
    const page = pageMetrics({
      access: PageAccess.ALLOWED,
      msSinceInitialVisit: msSinceVisit,
      msSinceBlock: undefined,
      isShowing: false,
      msViewtime: 0,
      msSinceHide: undefined,
    });
    
    const msCheck = 0;
    const actions = limit.actions(time(msCheck), page);
    const expectedActions: PageAction[] = [{
      type: PageActionType.BLOCK,
      time: time(msCheck - msOver),
    }];
    expect(actions).toStrictEqual(expectedActions);

    const remaining = limit.remainingWindow(time(msCheck), page);
    const expectedRemaining = 0;
    expect(remaining).toEqual(expectedRemaining);
  })
  

  test("allowed, since visit > limit, = cooldown", () => {
    const time = timeGenerator(new Date(0));
    const window = 1000;
    const cooldown = 500;
    const limit = new WindowCooldownLimit(window, cooldown);

    const msOver = cooldown;
    const msSinceVisit = window + msOver;
    const page = pageMetrics({
      access: PageAccess.ALLOWED,
      msSinceInitialVisit: msSinceVisit,
      msSinceBlock: undefined,
      isShowing: false,
      msViewtime: 0,
      msSinceHide: undefined,
    });
    
    const msCheck = 0;
    const actions = limit.actions(time(msCheck), page);
    const expectedActions: PageAction[] = [{
      type: PageActionType.RESET_INITIALVISIT,
      time: time(msCheck),
    }];
    expect(actions).toStrictEqual(expectedActions);

    const remaining = limit.remainingWindow(time(msCheck), page);
    const expectedRemaining = window;
    expect(remaining).toEqual(expectedRemaining);
  })
  

  test("allowed, visible, since visit > cooldown", () => {
    const time = timeGenerator(new Date(0));
    const window = 1000;
    const cooldown = 500;
    const limit = new WindowCooldownLimit(window, cooldown);

    const msOverCooldown = 100;
    const msSinceVisit = window + cooldown + msOverCooldown;
    const page = pageMetrics({
      access: PageAccess.ALLOWED,
      msSinceInitialVisit: msSinceVisit,
      msSinceBlock: undefined,
      isShowing: true,
      msViewtime: 300,
      msSinceHide: undefined,
    });
    
    const msCheck = 0;
    const actions = limit.actions(time(msCheck), page);
    const expectedActions: PageAction[] = [{
      type: PageActionType.RESET_INITIALVISIT,
      time: time(msCheck - msOverCooldown),
    }];
    expect(actions).toStrictEqual(expectedActions);

    const remaining = limit.remainingWindow(time(msCheck), page);
    const expectedRemaining = window - msOverCooldown;
    expect(remaining).toEqual(expectedRemaining);
  })


  test("allowed, hidden, since visit > cooldown", () => {
    const time = timeGenerator(new Date(0));
    const window = 1000;
    const cooldown = 500;
    const limit = new WindowCooldownLimit(window, cooldown);

    const msOverCooldown = 100;
    const msSinceVisit = window + cooldown + msOverCooldown;
    const page = pageMetrics({
      access: PageAccess.ALLOWED,
      msSinceInitialVisit: msSinceVisit,
      msSinceBlock: undefined,
      isShowing: false,
      msViewtime: 300,
      msSinceHide: 100,
    });
    
    const msCheck = 0;
    const actions = limit.actions(time(msCheck), page);
    const expectedActions: PageAction[] = [{
      type: PageActionType.RESET_INITIALVISIT,
      time: time(msCheck - msOverCooldown),
    }];
    expect(actions).toStrictEqual(expectedActions);

    const remaining = limit.remainingWindow(time(msCheck), page);
    const expectedRemaining = window - msOverCooldown;
    expect(remaining).toEqual(expectedRemaining);
  })
  

  test("blocked, since block < cooldown", () => {
    const time = timeGenerator(new Date(0));
    const window = 1000;
    const cooldown = 500;
    const limit = new WindowCooldownLimit(window, cooldown);

    const msSinceBlock = cooldown - 100;
    const page = pageMetrics({
      access: PageAccess.BLOCKED,
      msSinceInitialVisit: undefined,
      msSinceBlock: msSinceBlock,
      isShowing: false,
      msViewtime: 0,
      msSinceHide: undefined,
    });
    
    const msCheck = 0;
    const actions = limit.actions(time(msCheck), page);
    const expectedActions: PageAction[] = [];
    expect(actions).toStrictEqual(expectedActions);

    const remaining = limit.remainingWindow(time(msCheck), page);
    const expectedRemaining = 0;
    expect(remaining).toEqual(expectedRemaining);
  })
  
  
  test("blocked, since block = cooldown", () => {
    const time = timeGenerator(new Date(0));
    const window = 1000;
    const cooldown = 500;
    const limit = new WindowCooldownLimit(window, cooldown);

    const msSinceBlock = cooldown;
    const page = pageMetrics({
      access: PageAccess.BLOCKED,
      msSinceInitialVisit: undefined,
      msSinceBlock: msSinceBlock,
      isShowing: false,
      msViewtime: 0,
      msSinceHide: undefined,
    });
    
    const msCheck = 0;
    const actions = limit.actions(time(msCheck), page);

    const expectedActions: PageAction[] = [{
      type: PageActionType.UNBLOCK,
      time: time(msCheck),
    }];
    expect(actions).toStrictEqual(expectedActions);

    const remaining = limit.remainingWindow(time(msCheck), page);
    const expectedRemaining = 0;
    expect(remaining).toEqual(expectedRemaining);
  })
  

  test("blocked, since block > cooldown", () => {
    const time = timeGenerator(new Date(0));
    const window = 1000;
    const cooldown = 500;
    const limit = new WindowCooldownLimit(window, cooldown);

    const msSinceBlock = cooldown + 1;
    const page = pageMetrics({
      access: PageAccess.BLOCKED,
      msSinceInitialVisit: undefined,
      msSinceBlock: msSinceBlock,
      isShowing: false,
      msViewtime: 0,
      msSinceHide: undefined,
    });
    
    const msCheck = 0;
    const actions = limit.actions(time(msCheck), page);
    const expectedActions: PageAction[] = [{
      type: PageActionType.UNBLOCK,
      time: time(msCheck),
    }];
    expect(actions).toStrictEqual(expectedActions);

    const remaining = limit.remainingWindow(time(msCheck), page);
    const expectedRemaining = 0;
    expect(remaining).toEqual(expectedRemaining);
  })
})


describe("WindowCooldownLimit from/toObject", () => {
  test("from/toObject does not mutate", () => {
    const expected = new WindowCooldownLimit(1000, 5000).toObject();
    const actual = WindowCooldownLimit.fromObject(expected).toObject();
    expect(actual).toStrictEqual(expected);
  })
})