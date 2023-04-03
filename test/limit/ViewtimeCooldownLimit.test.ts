import { LimitAction, ViewtimeCooldownLimit } from "@bouncer/limit";
import { describe, test, expect } from "@jest/globals";
import { BasicPage, PageEvent } from "@bouncer/page";
import { pageWithMutations } from "../testUtils";


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

  test("viewtime = 0", () => {
    const page = new BasicPage();

    const viewtime = 1000;
    const cooldown = 1000;
    const limit = new ViewtimeCooldownLimit(viewtime, cooldown);
    const action = limit.action(new Date(), page);

    const expected: LimitAction = {
      action: "NONE"
    };
    expect(action).toStrictEqual(expected);
  })

  test("viewtime < limit", () => {
    const startTime = new Date();
    const page = pageWithMutations(startTime, [
      { type: PageEvent.VISIT },
      { type: PageEvent.SHOW, offsetMs: 500 }
    ]);

    const viewtime = 1000;
    const cooldown = 1000;
    const limit = new ViewtimeCooldownLimit(viewtime, cooldown);
    const checkTime = new Date(startTime.getTime() + 750);
    const action = limit.action(checkTime, page);
    
    const expected: LimitAction = {
      action: "NONE",
    };
    expect(action).toStrictEqual(expected);
  })
  
  test("viewtime = limit", () => {
    
  })
  
  test("viewtime > limit, checktime < cooldown", () => {
    
  })
  
  test("viewtime > limit, checktime = cooldown", () => {
    
  })
  
  test("viewtime > limit, checktime > cooldown", () => {

  })
})