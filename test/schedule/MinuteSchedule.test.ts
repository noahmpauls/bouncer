import { DateTime } from "luxon";
import { BasicPage, PageAction, PageActionType } from "@bouncer/page";
import { MinuteSchedule } from "@bouncer/schedule/MinuteSchedule";
import { describe, test, expect } from "@jest/globals";


const REFTIME = DateTime.fromISO("2000-01-01");


describe("MinuteSchedule", () => {
  test("rejects invalid 1", () => {
    expect(() => {
      const schedule = new MinuteSchedule(0, 60);
    }).toThrow();
  })


  test("rejects invalid 2", () => {
    expect(() => {
      const schedule = new MinuteSchedule(-1, 59);
    }).toThrow();
  })
  

  test.each([
    { s: 1, ms: 0, contains: true },
    { s: 59, ms: 0, contains: true },
    { s: 45, ms: 0, contains: true },
    { s: 44, ms: 999, contains: true },
  ])("wrap-around all-inclusive contains $s s, $ms ms: $contains", ({ s, ms, contains }) => {
    const schedule = new MinuteSchedule(45, 45);

    const date = new Date(2000, 3, 12, 5, 15, s, ms);

    expect(schedule.contains(date)).toBe(contains);
  })


  test.each([
    { s: 34, ms: 0, contains: true },
    { s: 34, ms: 999, contains: true },
    { s: 35, ms: 0, contains: false },
    { s: 0, ms: 500, contains: false },
  ])("wrap-around gapped contains $s s, $ms ms: $contains", ({ s, ms, contains }) => {
    const schedule = new MinuteSchedule(34, 35);

    const date = new Date(2000, 3, 12, 5, 15, s, ms);

    expect(schedule.contains(date)).toBe(contains);
  })
  

  test("start in range", () => {
    const startSec = 30;
    const endSec = 59;
    const schedule = new MinuteSchedule(startSec, endSec);

    const page = new BasicPage();
    
    const startRange = REFTIME.set({ second: 0 }).toJSDate();
    const endRange = REFTIME.set({ second: startSec }).toJSDate();
    const actions = schedule.actions(startRange, endRange, page);

    const resetTime = REFTIME.set({ second: startSec }).toJSDate();
    const expected: PageAction[] = [
      { type: PageActionType.RESET_METRICS, time: resetTime }
    ];
    expect(actions).toStrictEqual(expected);
  })

  
  test("end in range", () => {
    const startSec = 59;
    const endSec = 30;
    const schedule = new MinuteSchedule(startSec, endSec);

    const page = new BasicPage();
    const startRange = REFTIME.set({ second: endSec - 1 }).toJSDate();
    const endRange = REFTIME.set({ second: endSec + 1 }).toJSDate();
    const actions = schedule.actions(startRange, endRange, page);

    const resetTime = REFTIME.set({ second: endSec }).toJSDate();
    const expected: PageAction[] = [
      { type: PageActionType.RESET_METRICS, time: resetTime }
    ];
    expect(actions).toStrictEqual(expected);
  })

  
  test("end then start in range, no gap", () => {
    const startSec = 10;
    const endSec = startSec;
    const schedule = new MinuteSchedule(startSec, endSec);

    const page = new BasicPage();
    
    const startRange = REFTIME.set({ second: endSec - 1 }).toJSDate();
    const endRange = REFTIME.set({ second: startSec + 1 }).toJSDate();
    const actions = schedule.actions(startRange, endRange, page);

    const resetTime = REFTIME.set({ second: startSec }).toJSDate();
    const expected: PageAction[] = [
      { type: PageActionType.RESET_METRICS, time: resetTime }
    ];
    expect(actions).toStrictEqual(expected);
  })


  test("end then start in range, gapped", () => {
    const startSec = 40;
    const endSec = 20;
    const schedule = new MinuteSchedule(startSec, endSec);

    const page = new BasicPage();
    
    const startRange = REFTIME.set({ second: endSec - 1 }).toJSDate();
    const endRange = REFTIME.set({ second: startSec + 1 }).toJSDate();
    const actions = schedule.actions(startRange, endRange, page);

    const resetTime = REFTIME.set({ second: startSec }).toJSDate();
    const expected: PageAction[] = [
      { type: PageActionType.RESET_METRICS, time: resetTime }
    ];
    expect(actions).toStrictEqual(expected);
  })


  test("start then end in range, gapped", () => {
    const startSec = 40;
    const endSec = 20;
    const schedule = new MinuteSchedule(startSec, endSec);

    const page = new BasicPage();
    
    const startRange = REFTIME.set({ second: startSec - 1 }).toJSDate();
    const endRange = REFTIME.plus({ minutes: 1 }).set({ second: endSec + 1 }).toJSDate();
    const actions = schedule.actions(startRange, endRange, page);

    const resetTime = REFTIME.plus({ minutes: 1 }).set({ second: endSec }).toJSDate();
    const expected: PageAction[] = [
      { type: PageActionType.RESET_METRICS, time: resetTime }
    ];
    expect(actions).toStrictEqual(expected);
  })


  test("start in range while blocked", () => {
    const startSec = 30;
    const endSec = 59;
    const schedule = new MinuteSchedule(startSec, endSec);

    const page = new BasicPage();
    page.recordAction(PageActionType.BLOCK, REFTIME.minus({ seconds: 1 }).toJSDate());
    
    const startRange = REFTIME.set({ second: 0 }).toJSDate();
    const endRange = REFTIME.set({ second: startSec }).toJSDate();
    const actions = schedule.actions(startRange, endRange, page);

    const resetTime = REFTIME.set({ second: startSec }).toJSDate();
    const expected: PageAction[] = [];
    expect(actions).toStrictEqual(expected);
  })

  
  test("end in range while blocked", () => {
    const startSec = 30;
    const endSec = 59;
    const schedule = new MinuteSchedule(startSec, endSec);

    const page = new BasicPage();
    page.recordAction(PageActionType.BLOCK, REFTIME.minus({ seconds: 1 }).toJSDate());
    
    const startRange = REFTIME.set({ second: endSec - 1 }).toJSDate();
    const endRange = DateTime.fromJSDate(startRange).plus({ seconds: 5 }).toJSDate();
    const actions = schedule.actions(startRange, endRange, page);

    const resetTime = REFTIME.set({ second: endSec }).toJSDate();
    const expected: PageAction[] = [
      { type: PageActionType.UNBLOCK, time: resetTime }
    ];
    expect(actions).toStrictEqual(expected);
  })

  
  test("end then start in range while blocked, no gap", () => {
    const startSec = 10;
    const endSec = startSec;
    const schedule = new MinuteSchedule(startSec, endSec);

    const page = new BasicPage();
    page.recordAction(PageActionType.BLOCK, REFTIME.minus({ seconds: 1 }).toJSDate());
    
    const startRange = REFTIME.set({ second: endSec - 1 }).toJSDate();
    const endRange = REFTIME.set({ second: startSec + 1 }).toJSDate();
    const actions = schedule.actions(startRange, endRange, page);

    const unblockTime = REFTIME.set({ second: endSec }).toJSDate();
    const resetTime = REFTIME.set({ second: startSec }).toJSDate();
    const expected: PageAction[] = [
      { type: PageActionType.RESET_METRICS, time: resetTime },
      { type: PageActionType.UNBLOCK, time: unblockTime }
    ];
    expect(sortPageActions(actions)).toStrictEqual(sortPageActions(expected));
  })


  test("end then start in range while blocked, gapped", () => {
    const startSec = 40;
    const endSec = 20;
    const schedule = new MinuteSchedule(startSec, endSec);

    const page = new BasicPage();
    page.recordAction(PageActionType.BLOCK, REFTIME.minus({ seconds: 1 }).toJSDate());
    
    const startRange = REFTIME.set({ second: endSec - 1 }).toJSDate();
    const endRange = REFTIME.set({ second: startSec + 1 }).toJSDate();
    const actions = schedule.actions(startRange, endRange, page);

    const unblockTime = REFTIME.set({ second: endSec }).toJSDate();
    const resetTime = REFTIME.set({ second: startSec }).toJSDate();
    const expected: PageAction[] = [
      { type: PageActionType.RESET_METRICS, time: resetTime },
      { type: PageActionType.UNBLOCK, time: unblockTime }
    ];
    expect(sortPageActions(actions)).toStrictEqual(sortPageActions(expected));
  })


  test("start then end in range while blocked", () => {
    const startSec = 40;
    const endSec = 20;
    const schedule = new MinuteSchedule(startSec, endSec);

    const page = new BasicPage();
    page.recordAction(PageActionType.BLOCK, REFTIME.minus({ seconds: 1 }).toJSDate());
    
    const startRange = REFTIME.set({ second: startSec - 1 }).toJSDate();
    const endRange = REFTIME.plus({ minutes: 1 }).set({ second: endSec + 1 }).toJSDate();
    const actions = schedule.actions(startRange, endRange, page);

    const unblockTime = REFTIME.plus({ minutes: 1 }).set({ second: endSec }).toJSDate();
    const expected: PageAction[] = [
      { type: PageActionType.UNBLOCK, time: unblockTime }
    ];
    expect(actions).toStrictEqual(expected);
  })

  
  test("multiple starts and ends", () => {
    const startSec = 15;
    const endSec = 45;
    const schedule = new MinuteSchedule(startSec, endSec);

    const page = new BasicPage();
    const startRange = REFTIME.set({ second: startSec + 1 }).toJSDate();
    const endRange = REFTIME.plus({ minutes: 15 }).set({ second: startSec + 1 }).toJSDate();
    const actions = schedule.actions(startRange, endRange, page);
    
    const resetTime = REFTIME.plus({ minutes: 15 }).set({ second: startSec }).toJSDate();
    const expected: PageAction[] = [
      { type: PageActionType.RESET_METRICS, time: resetTime }
    ];
    expect(actions).toStrictEqual(expected);
  })


  test("multiple starts and ends while blocked", () => {
    const startSec = 15;
    const endSec = 45;
    const schedule = new MinuteSchedule(startSec, endSec);

    const page = new BasicPage();
    page.recordAction(PageActionType.BLOCK, REFTIME.minus({ seconds: 1 }).toJSDate());
    const startRange = REFTIME.set({ second: startSec + 1 }).toJSDate();
    const endRange = REFTIME.plus({ minutes: 15 }).set({ second: startSec + 1 }).toJSDate();
    const actions = schedule.actions(startRange, endRange, page);
    
    const unblockTime = REFTIME.plus({ minutes: 14 }).set({ second: endSec }).toJSDate(); 
    const resetTime = REFTIME.plus({ minutes: 15 }).set({ second: startSec }).toJSDate();
    const expected: PageAction[] = [
      { type: PageActionType.UNBLOCK, time: unblockTime },
      { type: PageActionType.RESET_METRICS, time: resetTime }
    ];
    expect(actions).toStrictEqual(expected);
  })
})


describe("MinuteSchedule from/toObject", () => {
  test("from/toObject does not mutate", () => {
    const expected = new MinuteSchedule(0, 59).toObject();
    const actual = MinuteSchedule.fromObject(expected).toObject();
    expect(actual).toStrictEqual(actual);
  });
});


function sortPageActions(actions: PageAction[]): PageAction[] {
  return actions.sort((a, b) => a.type.localeCompare(b.type)).sort((a, b) => a.time.getTime() - b.time.getTime());
}
