import { LimitAction, WindowCooldownLimit } from "@bouncer/limit";
import { PageAccess, PageReset } from "@bouncer/page";
import { describe, test, expect } from "@jest/globals";
import { pageMetrics, timeGenerator } from "../testUtils";


describe("WindowCooldownLimit action", () => {
  test("not visited", () => {
    const time = timeGenerator(new Date(0));
    const window = 1000;
    const cooldown = 500;
    const limit = new WindowCooldownLimit(window, cooldown);

    const page = pageMetrics({
      access: PageAccess.ALLOWED,
      msSinceInitialVisit: null,
      msSinceBlock: null,
      isShowing: false,
      msViewtime: 0,
      msSinceHide: null,
    });
    
    const action = limit.action(time(), page);

    const expected: LimitAction = { action: "NONE" };
    expect(action).toStrictEqual(expected);
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
      msSinceBlock: null,
      isShowing: false,
      msViewtime: 0,
      msSinceHide: null,
    });
    
    const action = limit.action(time(), page);

    const expected: LimitAction = { action: "NONE" };
    expect(action).toStrictEqual(expected);
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
      msSinceBlock: null,
      isShowing: false,
      msViewtime: 0,
      msSinceHide: null,
    });
    
    const msCheck = 0;
    const action = limit.action(time(msCheck), page);

    const expected: LimitAction = { action: "BLOCK", time: time(msCheck) }
    expect(action).toStrictEqual(expected);
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
      msSinceBlock: null,
      isShowing: false,
      msViewtime: 0,
      msSinceHide: null,
    });
    
    const msCheck = 0;
    const action = limit.action(time(msCheck), page);

    const expected: LimitAction = { action: "BLOCK", time: time(msCheck - msOver) }
    expect(action).toStrictEqual(expected);
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
      msSinceBlock: null,
      isShowing: false,
      msViewtime: 0,
      msSinceHide: null,
    });
    
    const msCheck = 0;
    const action = limit.action(time(msCheck), page);

    const expected: LimitAction = { 
      action: "RESET",
      resets: [
        { type: PageReset.INITIALVISIT, time: time(msCheck) }
      ]
    }
    expect(action).toStrictEqual(expected);
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
      msSinceBlock: null,
      isShowing: true,
      msViewtime: 300,
      msSinceHide: null,
    });
    
    const msCheck = 0;
    const action = limit.action(time(msCheck), page);

    const expected: LimitAction = { 
      action: "RESET",
      resets: [
        { type: PageReset.INITIALVISIT, time: time(msCheck - msOverCooldown) }
      ]
    }
    expect(action).toStrictEqual(expected);
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
      msSinceBlock: null,
      isShowing: false,
      msViewtime: 300,
      msSinceHide: 100,
    });
    
    const msCheck = 0;
    const action = limit.action(time(msCheck), page);

    const expected: LimitAction = { 
      action: "RESET",
      resets: [
        { type: PageReset.INITIALVISIT, time: time(msCheck - msOverCooldown) }
      ]
    }
    expect(action).toStrictEqual(expected);
  })
  

  test("blocked, since block < cooldown", () => {
    const time = timeGenerator(new Date(0));
    const window = 1000;
    const cooldown = 500;
    const limit = new WindowCooldownLimit(window, cooldown);

    const msSinceBlock = cooldown - 100;
    const page = pageMetrics({
      access: PageAccess.BLOCKED,
      msSinceInitialVisit: null,
      msSinceBlock: msSinceBlock,
      isShowing: false,
      msViewtime: 0,
      msSinceHide: null,
    });
    
    const msCheck = 0;
    const action = limit.action(time(msCheck), page);

    const expected: LimitAction = { action: "NONE" };
    expect(action).toStrictEqual(expected);
  })
  
  
  test("blocked, since block = cooldown", () => {
    const time = timeGenerator(new Date(0));
    const window = 1000;
    const cooldown = 500;
    const limit = new WindowCooldownLimit(window, cooldown);

    const msSinceBlock = cooldown;
    const page = pageMetrics({
      access: PageAccess.BLOCKED,
      msSinceInitialVisit: null,
      msSinceBlock: msSinceBlock,
      isShowing: false,
      msViewtime: 0,
      msSinceHide: null,
    });
    
    const msCheck = 0;
    const action = limit.action(time(msCheck), page);

    const expected: LimitAction = { action: "UNBLOCK" };
    expect(action).toStrictEqual(expected);
  })
  

  test("blocked, since block > cooldown", () => {
    const time = timeGenerator(new Date(0));
    const window = 1000;
    const cooldown = 500;
    const limit = new WindowCooldownLimit(window, cooldown);

    const msSinceBlock = cooldown + 1;
    const page = pageMetrics({
      access: PageAccess.BLOCKED,
      msSinceInitialVisit: null,
      msSinceBlock: msSinceBlock,
      isShowing: false,
      msViewtime: 0,
      msSinceHide: null,
    });
    
    const msCheck = 0;
    const action = limit.action(time(msCheck), page);

    const expected: LimitAction = { action: "UNBLOCK" };
    expect(action).toStrictEqual(expected);
  })
})


describe("WindowCooldownLimit from/toObject", () => {
  test("from/toObject does not mutate", () => {
    const expected = new WindowCooldownLimit(1000, 5000).toObject();
    const actual = WindowCooldownLimit.fromObject(expected).toObject();
    expect(actual).toStrictEqual(expected);
  })
})