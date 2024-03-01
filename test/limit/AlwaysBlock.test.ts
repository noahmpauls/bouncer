import { describe, test, expect } from "@jest/globals";
import { AlwaysBlock } from "@bouncer/limit";
import { BasicPage, type PageAction, PageActionType, PageEvent } from "@bouncer/page";
import { pageWithMutations } from "../testUtils";


describe("AlwaysBlock action", () => {
  test.each([
    { name: "fresh page", time: new Date(), page: new BasicPage(), }
  ])("$name", ({time, page}) => {
    const limit = new AlwaysBlock();
    
    const actions = limit.actions(time, page);

    const expected: PageAction[] = [{
      type: PageActionType.BLOCK,
      time
    }]
    expect(actions).toStrictEqual(expected);
  })
})

describe("AlwaysBlock remaining", () => {
  test("fresh page", () => {
    const page = new BasicPage();
    const time = new Date();

    const limit = new AlwaysBlock();
    const viewtime = limit.remainingViewtime(time, page);
    const window = limit.remainingWindow(time, page);
    
    const expected = Infinity;
    expect(viewtime).toEqual(expected);
    expect(window).toEqual(expected);
  })
  
  test("visited page", () => {
    const visitTime = new Date();
    const page = pageWithMutations(visitTime, [{ type: PageEvent.SHOW }]);

    const checkTime = new Date(visitTime.getTime() + 1000);
    const limit = new AlwaysBlock();
    const viewtime = limit.remainingViewtime(checkTime, page);
    const window = limit.remainingWindow(checkTime, page);

    const expected = Infinity;
    expect(viewtime).toEqual(expected);
    expect(window).toEqual(expected);
  })

  test("hidden page with viewtime", () => {
    const visitTime = new Date();
    const page = pageWithMutations(visitTime, [
      { type: PageEvent.SHOW },
      { type: PageEvent.HIDE, offsetMs: 1000 }
    ]);

    const checkTime = new Date(visitTime.getTime() + 2000);
    const limit = new AlwaysBlock();
    const viewtime = limit.remainingViewtime(checkTime, page);
    const window = limit.remainingWindow(checkTime, page);
    
    const expected = Infinity;
    expect(viewtime).toEqual(expected);
    expect(window).toEqual(expected);
  })

  test("visible page with viewtime", () => {
    const visitTime = new Date();
    const page = pageWithMutations(visitTime, [
      { type: PageEvent.SHOW },
    ]);

    const checkTime = new Date(visitTime.getTime() + 2000);
    const limit = new AlwaysBlock();
    const viewtime = limit.remainingViewtime(checkTime, page);
    const window = limit.remainingWindow(checkTime, page);
    
    const expected = Infinity;
    expect(viewtime).toEqual(expected);
    expect(window).toEqual(expected);
  })
})
