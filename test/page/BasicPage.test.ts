import { describe, test, expect } from "@jest/globals";
import { BasicPage, type IPage, PageAccess, PageActionType, type PageEvent, PageEventType } from "@bouncer/page";
import { timeGenerator } from "../testUtils";


type ObservedPage = {
  access: ReturnType<IPage["access"]>,
  isShowing: ReturnType<IPage["isShowing"]>,
  msSinceInitialVisit: ReturnType<IPage["msSinceInitialVisit"]>,
  msViewtime: ReturnType<IPage["msViewtime"]>
  msSinceBlock: ReturnType<IPage["msSinceBlock"]>,
  msSinceHide: ReturnType<IPage["msSinceHide"]>,
  msSinceUpdate: ReturnType<IPage["msSinceHide"]>,
}

type ExpectedObservedPage = Partial<ObservedPage>;

function observePage(page: IPage, time: Date): ObservedPage {
  return {
    access: page.access(),
    isShowing: page.isShowing(),
    msSinceInitialVisit: page.msSinceInitialVisit(time),
    msViewtime: page.msViewtime(time),
    msSinceBlock: page.msSinceBlock(time),
    msSinceHide: page.msSinceHide(time),
    msSinceUpdate: page.msSinceUpdate(time),
  }
}


describe("BasicPage", () => {
  
  test("fresh page", () => {
    const page = new BasicPage();
    const observed = observePage(page, new Date());
    const expected: ExpectedObservedPage = {
      access: PageAccess.ALLOWED,
      isShowing: false,
      msSinceInitialVisit: null,
      msViewtime: 0,
      msSinceBlock: null,
      msSinceHide: null,
      msSinceUpdate: null,
    }
    expect(observed).toMatchObject(expected);
  })
  
  
  test("visited, no viewtime", () => {
    const time = timeGenerator();
    const frame = { tabId: 0, frameId: 0 };
    const page = new BasicPage();
    page.recordEvent(time(), { type: PageEventType.FRAME_OPEN, frame });
    const msFromVisit = 500;
    const observed = observePage(page, time(msFromVisit));
    
    const expected: ExpectedObservedPage = {
      access: PageAccess.ALLOWED,
      isShowing: false,
      msSinceInitialVisit: msFromVisit,
      msViewtime: 0,
      msSinceBlock: null,
      msSinceHide: null,
      msSinceUpdate: msFromVisit,
    }
    expect(observed).toMatchObject(expected);
  })
  

  test("show before visit", () => {
    const time = timeGenerator();
    const frame = { tabId: 0, frameId: 0 };
    const page = new BasicPage();
    page.recordEvent(time(), { type: PageEventType.FRAME_SHOW, frame });
    const msFromShow = 100;
    const observed = observePage(page, time(msFromShow));

    const expected: ExpectedObservedPage = {
      access: PageAccess.ALLOWED,
      isShowing: true,
      msSinceInitialVisit: null,
      msViewtime: msFromShow,
      msSinceBlock: null,
      msSinceHide: null,
      msSinceUpdate: msFromShow,
    }
    expect(observed).toMatchObject(expected);
  })


  test("hide before show", () => {
    const time = timeGenerator();
    const frame = { tabId: 0, frameId: 0 };
    const page = new BasicPage();
    page.recordEvent(time(), { type: PageEventType.FRAME_OPEN, frame });
    page.recordEvent(time(100), { type: PageEventType.FRAME_HIDE, frame });
    const msFromVisit = 200;
    const observed = observePage(page, time(msFromVisit));

    const expected: ExpectedObservedPage = {
      access: PageAccess.ALLOWED,
      isShowing: false,
      msSinceInitialVisit: msFromVisit,
      msViewtime: 0,
      msSinceBlock: null,
      msSinceHide: null,
      msSinceUpdate: msFromVisit,
    }
    expect(observed).toMatchObject(expected);
  })
  

  test("show and hide before visit", () => {
    const time = timeGenerator();
    const frame = { tabId: 0, frameId: 0 };
    const page = new BasicPage();
    page.recordEvent(time(), { type: PageEventType.FRAME_SHOW, frame });
    const msViewtime = 100
    page.recordEvent(time(msViewtime), { type: PageEventType.TAB_CLOSE, tab: frame });
    const msFromShow = 200;
    const observed = observePage(page, time(msFromShow));

    const expected: ExpectedObservedPage = {
      access: PageAccess.ALLOWED,
      isShowing: false,
      msSinceInitialVisit: null,
      msViewtime: msViewtime,
      msSinceBlock: null,
      msSinceHide: msFromShow - msViewtime,
      msSinceUpdate: msFromShow - msViewtime,
    }
    expect(observed).toMatchObject(expected);
  })


  test("view session: show time before hide time", () => {
    const time = timeGenerator();
    const frame = { tabId: 0, frameId: 0 };
    const page = new BasicPage();
    const msViewtime = 10_000;
    page.recordEvent(time(), { type: PageEventType.FRAME_SHOW, frame });
    page.recordEvent(time(msViewtime), { type: PageEventType.FRAME_HIDE, frame });
    const msObserveDelay = 0;
    const observed = observePage(page, time(msViewtime + msObserveDelay));
    
    const expected: ExpectedObservedPage = {
      isShowing: false,
      msViewtime: msViewtime,
      msSinceHide: msObserveDelay,
      msSinceUpdate: msObserveDelay,
    };
    expect(observed).toMatchObject(expected);
  })
  

  test("view session: show time = hide time", () => {
    const time = timeGenerator();
    const frame = { tabId: 0, frameId: 0 };
    const page = new BasicPage();
    const msViewtime = 0;
    page.recordEvent(time(), { type: PageEventType.FRAME_SHOW, frame });
    page.recordEvent(time(msViewtime), { type: PageEventType.TAB_CLOSE, tab: frame });
    const msObserveDelay = 100;
    const observed = observePage(page, time(msViewtime + msObserveDelay));
    
    const expected: ExpectedObservedPage = {
      isShowing: false,
      msViewtime: msViewtime,
      msSinceHide: msObserveDelay,
      msSinceUpdate: msObserveDelay,
    };
    expect(observed).toMatchObject(expected);
  })
  

  test("view session: show time after hide time", () => {
    const time = timeGenerator();
    const frame = { tabId: 0, frameId: 0 };
    const page = new BasicPage();
    const msViewtime = -10_000;
    page.recordEvent(time(), { type: PageEventType.FRAME_SHOW, frame });
    page.recordEvent(time(msViewtime), { type: PageEventType.FRAME_HIDE, frame });
    const msObserveDelay = 100_000;
    const observed = observePage(page, time(msObserveDelay));
    
    const expected: ExpectedObservedPage = {
      isShowing: false,
      msViewtime: 0,
      msSinceHide: msObserveDelay - msViewtime,
      msSinceUpdate: msObserveDelay,
    };
    expect(observed).toMatchObject(expected);
  })


  test("multiple sequential view sessions", () => {
    const sessions = [
      { start: 0, end: 12_000 },
      { start: 40_000, end: 41_000 },
      { start: -100, end: -100 },
    ];
    const time = timeGenerator();
    const frame = { tabId: 0, frameId: 0 };
    const page = new BasicPage();
    for (const session of sessions) {
      expect(session.start).toBeLessThanOrEqual(session.end);
      page.recordEvent(time(session.start), { type: PageEventType.FRAME_SHOW, frame });
      page.recordEvent(time(session.end), { type: PageEventType.FRAME_HIDE, frame });
    }
    const msObserve = 1_000_000;
    const observed = observePage(page, time(msObserve));

    const totalViewtime = sessions.map(s => Math.max(0, s.end - s.start)).reduce((a, b) => a + b, 0);
    const expected: ExpectedObservedPage = {
      isShowing: false,
      msViewtime: totalViewtime,
      msSinceUpdate: msObserve - Math.max(...sessions.map(s => Math.max(s.start, s.end))),
    };
    expect(observed).toMatchObject(expected);
  })
  

  test("shows from different viewers", () => {
    const time = timeGenerator();
    const frameA = { tabId: 0, frameId: 0 };
    const frameB = { tabId: 0, frameId: 1 };
    const page = new BasicPage();
    const msShowA = 1000;
    const msShowB = msShowA + 1;
    page.recordEvent(time(msShowA), { type: PageEventType.FRAME_SHOW, frame: frameA });
    page.recordEvent(time(msShowB), { type: PageEventType.FRAME_SHOW, frame: frameB });
    const msObserve = msShowB + 1;
    const observed = observePage(page, time(msObserve));

    const expected: ExpectedObservedPage = {
      isShowing: true,
      msViewtime: msObserve - msShowA,
      msSinceUpdate: msObserve - msShowB,
    }
    expect(observed).toMatchObject(expected);
  })


  test("concurrent viewers small", () => {
    const time = timeGenerator();
    const frameA = { tabId: 0, frameId: 0 };
    const frameB = { tabId: 1, frameId: 0 };
    const page = new BasicPage();
    page.recordEvent(time(), { type: PageEventType.FRAME_SHOW, frame: frameA });
    page.recordEvent(time(1000), { type: PageEventType.FRAME_SHOW, frame: frameB });
    const msFirstHide = 2000;
    page.recordEvent(time(msFirstHide), { type: PageEventType.TAB_CLOSE, tab: frameA });

    const msShowingObserve = 5_000;
    const observedShowing = observePage(page, time(msShowingObserve));
    const expectedShowing: ExpectedObservedPage = {
      isShowing: true,
      msViewtime: msShowingObserve,
      msSinceHide: null,
      msSinceUpdate: msShowingObserve - msFirstHide,
    };
    expect(observedShowing).toMatchObject(expectedShowing);

    const msLastHide = 10_000;
    page.recordEvent(time(msLastHide), { type: PageEventType.FRAME_HIDE, frame: frameB });
    const msHiddenObserve = 20_000;
    const observedHidden = observePage(page, time(msHiddenObserve));
    const expectedHidden: ExpectedObservedPage = {
      isShowing: false,
      msViewtime: msLastHide,
      msSinceHide: msHiddenObserve - msLastHide,
      msSinceUpdate: msHiddenObserve - msLastHide,
    };
    expect(observedHidden).toMatchObject(expectedHidden);
  })
  

  test("concurrent viewers big", () => {
    const frames = {
      A: { tabId: 0, frameId: 0 },
      B: { tabId: 0, frameId: 1 },
      C: { tabId: 1, frameId: 0 },
      D: { tabId: 1, frameId: 1 },
      E: { tabId: 2, frameId: 0 },
    }
    const events: { event: PageEvent, time: number }[] = [
      { event: { type: PageEventType.FRAME_SHOW, frame: frames.A }, time: 0 },
      { event: { type: PageEventType.FRAME_SHOW, frame: frames.B }, time: 100 },
      { event: { type: PageEventType.FRAME_SHOW, frame: frames.C }, time: 200 },
      { event: { type: PageEventType.FRAME_HIDE, frame: frames.B }, time: 300 },
      { event: { type: PageEventType.FRAME_HIDE, frame: frames.A }, time: 400 },
      { event: { type: PageEventType.FRAME_SHOW, frame: frames.D }, time: 500 },
      { event: { type: PageEventType.FRAME_SHOW, frame: frames.E }, time: 700 },
      { event: { type: PageEventType.FRAME_HIDE, frame: frames.E }, time: 800 },
      { event: { type: PageEventType.TAB_CLOSE, tab: frames.D }, time: 900 },
    ];
    const time = timeGenerator();
    const page = new BasicPage();
    for (const event of events) {
      page.recordEvent(time(event.time), event.event);
    }
    const msLastHide = Math.max(...events.map(e => e.time));
    const msObserveDelay = 100;
    const observed = observePage(page, time(msLastHide + msObserveDelay));

    const expected: ExpectedObservedPage = {
      isShowing: false,
      msViewtime: msLastHide,
      msSinceHide: msObserveDelay,
      msSinceUpdate: msObserveDelay,
    };
    expect(observed).toMatchObject(expected);
  })
  

  test("multiple consecutive visits, forward in time", () => {
    const visitTimes = [100, 200];
    const time = timeGenerator();
    const frame = { tabId: 0, frameId: 0 };
    const page = new BasicPage();
    for (const visitTime of visitTimes) {
      page.recordEvent(time(visitTime), { type: PageEventType.FRAME_OPEN, frame });
    }
    const msObserve = 500;
    const observed = observePage(page, time(msObserve));

    const expected: ExpectedObservedPage = {
      msSinceInitialVisit: msObserve - visitTimes[0],
      msSinceUpdate: msObserve - visitTimes[0],
    };
    expect(observed).toMatchObject(expected);
  })


  test("multiple consecutive visits, back in time", () => {
    const visitTimes = [200, 100];
    const time = timeGenerator();
    const frame = { tabId: 0, frameId: 0 };
    const page = new BasicPage();
    for (const visitTime of visitTimes) {
      page.recordEvent(time(visitTime), { type: PageEventType.FRAME_OPEN, frame });
    }
    const msObserve = 500;
    const observed = observePage(page, time(msObserve));

    const expected: ExpectedObservedPage = {
      msSinceInitialVisit: msObserve - visitTimes[0],
      msSinceUpdate: msObserve - visitTimes[0],
    };
    expect(observed).toMatchObject(expected);
  })
  

  test("multiple consecutive shows, forward in time", () => {
    const showTimes = [100, 200];
    const time = timeGenerator();
    const frame = { tabId: 0, frameId: 0 };
    const page = new BasicPage();
    for (const showTime of showTimes) {
      page.recordEvent(time(showTime), { type: PageEventType.FRAME_SHOW, frame });
    }
    const msObserve = 500;
    const observed = observePage(page, time(msObserve));

    const expected: ExpectedObservedPage = {
      msViewtime: msObserve - showTimes[0],
      msSinceUpdate: msObserve - showTimes[0],
    };
    expect(observed).toMatchObject(expected);
  })


  test("multiple consecutive shows, back in time", () => {
    const showTimes = [200, 100];
    const time = timeGenerator();
    const frame = { tabId: 0, frameId: 0 };
    const page = new BasicPage();
    for (const showTime of showTimes) {
      page.recordEvent(time(showTime), { type: PageEventType.FRAME_SHOW, frame });
    }
    const msObserve = 500;
    const observed = observePage(page, time(msObserve));

    const expected: ExpectedObservedPage = {
      msViewtime: msObserve - showTimes[0],
      msSinceUpdate: msObserve - showTimes[0],
    };
    expect(observed).toMatchObject(expected);
  })
  

  test("multiple consecutive hides, forward in time", () => {
    const hideTimes = [100, 200];
    const time = timeGenerator();
    const frame = { tabId: 0, frameId: 0 };
    const page = new BasicPage();
    page.recordEvent(time(), { type: PageEventType.FRAME_SHOW, frame });
    for (const hideTime of hideTimes) {
      page.recordEvent(time(hideTime), { type: PageEventType.FRAME_HIDE, frame });
    }
    const msObserve = 500;
    const observed = observePage(page, time(msObserve));

    const expected: ExpectedObservedPage = {
      msViewtime: hideTimes[0],
      msSinceUpdate: msObserve - hideTimes[0],
    };
    expect(observed).toMatchObject(expected);
  })


  test("multiple consecutive hides, back in time", () => {
    const hideTimes = [200, 100];
    const time = timeGenerator();
    const frame = { tabId: 0, frameId: 0 };
    const page = new BasicPage();
    page.recordEvent(time(), { type: PageEventType.FRAME_SHOW, frame });
    for (const hideTime of hideTimes) {
      page.recordEvent(time(hideTime), { type: PageEventType.FRAME_HIDE, frame });
    }
    const msObserve = 500;
    const observed = observePage(page, time(msObserve));

    const expected: ExpectedObservedPage = {
      msViewtime: hideTimes[0],
      msSinceUpdate: msObserve - hideTimes[0],
    };
    expect(observed).toMatchObject(expected);
  })
  

  test("reset viewtime after only visited", () => {
    const time = timeGenerator();
    const frame = { tabId: 0, frameId: 0 };
    const page = new BasicPage();
    page.recordEvent(time(), { type: PageEventType.FRAME_OPEN, frame });
    const msReset = 500;
    page.recordAction(PageActionType.RESET_VIEWTIME, time(msReset));
    const msObserve = 1000;
    const observed = observePage(page, time(msObserve))
    
    const expected: ExpectedObservedPage = {
      msSinceInitialVisit: msObserve,
      msSinceHide: null,
      msSinceUpdate: msObserve - msReset,
    };
    expect(observed).toMatchObject(expected);
  })


  test("reset viewtime while visible, resetTime after last show", () => {
    const time = timeGenerator();
    const frame = { tabId: 0, frameId: 0 };
    const page = new BasicPage();
    page.recordEvent(time(), { type: PageEventType.FRAME_SHOW, frame });
    const msReset = 2000;
    page.recordAction(PageActionType.RESET_VIEWTIME, time(msReset));
    const msObserve = 5000;
    const observed = observePage(page, time(msObserve));

    const expected: ExpectedObservedPage = {
      isShowing: true,
      msViewtime: msObserve - msReset,
      msSinceHide: null,
      msSinceUpdate: msObserve - msReset,
    }
    expect(observed).toMatchObject(expected);
  })
  
  
  test("reset viewtime while visible, resetTime before last show", () => {
    const time = timeGenerator();
    const frame = { tabId: 0, frameId: 0 };
    const page = new BasicPage();
    page.recordEvent(time(), { type: PageEventType.FRAME_SHOW, frame });
    const msReset = -1000;
    const msObserve = 5000;
    page.recordAction(PageActionType.RESET_VIEWTIME, time(msReset));
    const observed = observePage(page, time(msObserve));

    const expected: ExpectedObservedPage = {
      isShowing: true,
      msViewtime: msObserve,
      msSinceHide: null,
      msSinceUpdate: msObserve,
    }
    expect(observed).toMatchObject(expected);
  })
  
  
  /**
   * DISCLAIMER for the next two tests:
   * 
   * This tests whether the page keeps a detailed history. The most recent view
   * session is complete when the reset is applied, but the reset time is in
   * the middle of that view session, so in theory the reset splits the view
   * session, and the effective viewtime is the length of the latter split.
   * 
   * In reality, we don't need pages to be that complex. The rule is that a
   * reset can only take an open view session for context; if a reset should
   * have been applied in the middle of a view session, it's too late to do it
   * afterwards.
   */


  test("reset viewtime after show and hide, resetTime after show and hide", () => {
    const time = timeGenerator();
    const frame = { tabId: 0, frameId: 0 };
    const page = new BasicPage();
    page.recordEvent(time(), { type: PageEventType.FRAME_SHOW, frame });
    const msHide = 5000;
    page.recordEvent(time(msHide), { type: PageEventType.FRAME_HIDE, frame });
    const msReset = 5500;
    page.recordAction(PageActionType.RESET_VIEWTIME, time(msReset));
    const msObserve = 6000;
    const observed = observePage(page, time(msObserve));
    
    const expected: ExpectedObservedPage = {
      isShowing: false,
      msViewtime: 0,
      msSinceHide: msObserve - msHide,
      msSinceUpdate: msObserve - msReset,
    };
    expect(observed).toMatchObject(expected);
  })


  test("reset viewtime after show and hide, resetTime before hide and after show", () => {
    const time = timeGenerator();
    const frame = { tabId: 0, frameId: 0 };
    const page = new BasicPage();
    page.recordEvent(time(), { type: PageEventType.FRAME_SHOW, frame });
    const msHide = 5000;
    page.recordEvent(time(msHide), { type: PageEventType.TAB_CLOSE, tab: frame });
    const msReset = 4000;
    const msObserve = 6000;
    page.recordAction(PageActionType.RESET_VIEWTIME, time(msReset));
    const observed = observePage(page, time(msObserve));
    
    const expected: ExpectedObservedPage = {
      isShowing: false,
      msViewtime: 0,
      msSinceHide: msObserve - msHide,
      msSinceUpdate: msObserve - msHide,
    };
    expect(observed).toMatchObject(expected);
  })
  

  test("reset initial visit after only visited", () => {
    const time = timeGenerator();
    const frame = { tabId: 0, frameId: 0 };
    const page = new BasicPage();
    page.recordEvent(time(), { type: PageEventType.FRAME_OPEN, frame });
    const msReset = 100;
    page.recordAction(PageActionType.RESET_INITIALVISIT, time(msReset));
    const msObserve = 300; 
    const observed = observePage(page, time(msObserve));
    
    const expected: ExpectedObservedPage = {
      msSinceInitialVisit: null,
      msSinceUpdate: msObserve - msReset,
    };
    expect(observed).toMatchObject(expected);
  })
  

  test("reset initial visit while visible, resetTime after show", () => {
    const time = timeGenerator();
    const frame = { tabId: 0, frameId: 0 };
    const page = new BasicPage();
    page.recordEvent(time(), { type: PageEventType.FRAME_OPEN, frame });
    const msShow = 150;
    page.recordEvent(time(msShow), { type: PageEventType.FRAME_SHOW, frame });
    const msReset = 200;
    page.recordAction(PageActionType.RESET_INITIALVISIT, time(msReset));
    const msObserve = 300; 
    const observed = observePage(page, time(msObserve));
    
    const expected: ExpectedObservedPage = {
      isShowing: true,
      msViewtime: msObserve - msShow,
      msSinceInitialVisit: msObserve - msReset,
      msSinceUpdate: msObserve - msReset,
    };
    expect(observed).toMatchObject(expected);
  })


  test("reset initial visit while visible, resetTime before show", () => {
    const time = timeGenerator();
    const frame = { tabId: 0, frameId: 0 };
    const page = new BasicPage();
    page.recordEvent(time(), { type: PageEventType.FRAME_OPEN, frame });
    const msShow = 150;
    page.recordEvent(time(msShow), { type: PageEventType.FRAME_SHOW, frame });
    const msReset = 100;
    page.recordAction(PageActionType.RESET_INITIALVISIT, time(msReset));
    const msObserve = 300;
    const observed = observePage(page, time(msObserve));
    
    const expected: ExpectedObservedPage = {
      isShowing: true,
      msViewtime: msObserve - msShow,
      msSinceInitialVisit: msObserve - msShow,
      msSinceUpdate: msObserve - msShow,
    };
    expect(observed).toMatchObject(expected);
  })
  

  test("reset initial visit after show and hide", () => {
    const time = timeGenerator();
    const frame = { tabId: 0, frameId: 0 };
    const page = new BasicPage();
    page.recordEvent(time(), { type: PageEventType.FRAME_OPEN, frame });
    const msShow = 150;
    page.recordEvent(time(msShow), { type: PageEventType.FRAME_SHOW, frame });
    const msHide = 175;
    page.recordEvent(time(msHide), { type: PageEventType.FRAME_HIDE, frame });
    const msReset = 200;
    page.recordAction(PageActionType.RESET_INITIALVISIT, time(msReset));
    const msObserve = 300; 
    const observed = observePage(page, time(msObserve));
    
    const expected: ExpectedObservedPage = {
      isShowing: false,
      msViewtime: msHide - msShow,
      msSinceInitialVisit: null,
      msSinceUpdate: msObserve - msReset,
    };
    expect(observed).toMatchObject(expected);
  })


  test("block fresh page", () => {
    const time = timeGenerator();
    const page = new BasicPage();
    page.recordAction(PageActionType.BLOCK, time());
    const msObserve = 25;
    const observed = observePage(page, time(msObserve));

    const expected: ExpectedObservedPage = {
      access: PageAccess.BLOCKED,
      msSinceBlock: msObserve,
      msSinceUpdate: msObserve,
      isShowing: false,
      msSinceInitialVisit: null,
      msSinceHide: null,
      msViewtime: 0,
    }
    expect(observed).toMatchObject(expected);
  })
  

  test("block after visit", () => {
    const time = timeGenerator();
    const frame = { tabId: 0, frameId: 0 };
    const page = new BasicPage();
    page.recordEvent(time(), { type: PageEventType.FRAME_OPEN, frame });
    page.recordAction(PageActionType.BLOCK, time());
    const msObserve = 25;
    const observed = observePage(page, time(msObserve));

    const expected: ExpectedObservedPage = {
      access: PageAccess.BLOCKED,
      msSinceBlock: msObserve,
      msSinceUpdate: msObserve,
      isShowing: false,
      msSinceInitialVisit: null,
      msSinceHide: null,
      msViewtime: 0,
    }
    expect(observed).toMatchObject(expected);
  })
  

  test("block while visible", () => {
    const time = timeGenerator();
    const frame = { tabId: 0, frameId: 0 };
    const page = new BasicPage();
    page.recordEvent(time(), { type: PageEventType.FRAME_SHOW, frame });
    page.recordAction(PageActionType.BLOCK, time());
    const msObserve = 25;
    const observed = observePage(page, time(msObserve));

    const expected: ExpectedObservedPage = {
      access: PageAccess.BLOCKED,
      msSinceBlock: msObserve,
      msSinceUpdate: msObserve,
      isShowing: false,
      msSinceInitialVisit: null,
      msSinceHide: null,
      msViewtime: 0,
    }
    expect(observed).toMatchObject(expected);
  })
  

  test("block after viewtime accrued", () => {
    const time = timeGenerator();
    const frame = { tabId: 0, frameId: 0 };
    const page = new BasicPage();
    page.recordEvent(time(), { type: PageEventType.FRAME_SHOW, frame });
    const viewtime = 1234;
    page.recordEvent(time(viewtime), { type: PageEventType.TAB_CLOSE, tab: frame });
    const msBlock = viewtime + 1;
    page.recordAction(PageActionType.BLOCK, time(msBlock));
    const msObserve = msBlock;
    const observed = observePage(page, time(msObserve));

    const expected: ExpectedObservedPage = {
      access: PageAccess.BLOCKED,
      msSinceBlock: msObserve - msBlock,
      msSinceUpdate: msObserve - msBlock,
      isShowing: false,
      msSinceInitialVisit: null,
      msSinceHide: null,
      msViewtime: 0,
    }
    expect(observed).toMatchObject(expected);
  })


  test("block after visit and viewtime accrued", () => {
    const time = timeGenerator();
    const frame = { tabId: 0, frameId: 0 };
    const page = new BasicPage();
    page.recordEvent(time(), { type: PageEventType.FRAME_OPEN, frame });
    page.recordEvent(time(), { type: PageEventType.FRAME_SHOW, frame });
    const viewtime = 1234;
    page.recordEvent(time(viewtime), { type: PageEventType.FRAME_HIDE, frame });
    const msBlock = viewtime + 1;
    page.recordAction(PageActionType.BLOCK, time(msBlock));
    const msObserve = msBlock - 1;
    const observed = observePage(page, time(msObserve));

    const expected: ExpectedObservedPage = {
      access: PageAccess.BLOCKED,
      msSinceBlock: 0,
      msSinceUpdate: 0,
      isShowing: false,
      msSinceInitialVisit: null,
      msSinceHide: null,
      msViewtime: 0,
    }
    expect(observed).toMatchObject(expected);
  })


  test("visit while blocked", () => {
    const time = timeGenerator();
    const frame = { tabId: 0, frameId: 0 };
    const page = new BasicPage();
    page.recordAction(PageActionType.BLOCK, time());
    const msVisit = 30;
    page.recordEvent(time(msVisit), { type: PageEventType.FRAME_OPEN, frame });
    const msObserve = 60;
    const observed = observePage(page, time(msObserve));

    const expected: ExpectedObservedPage = {
      access: PageAccess.BLOCKED,
      msSinceBlock: msObserve,
      msSinceInitialVisit: null,
      msSinceUpdate: msObserve,
    }
    expect(observed).toMatchObject(expected);
  })
  

  test("show while blocked", () => {
    const time = timeGenerator();
    const frame = { tabId: 0, frameId: 0 };
    const page = new BasicPage();
    page.recordAction(PageActionType.BLOCK, time());
    const msShow = 2;
    page.recordEvent(time(msShow), { type: PageEventType.FRAME_SHOW, frame });
    const msObserve = 5;
    const observed = observePage(page, time(msObserve));

    const expected: ExpectedObservedPage = {
      access: PageAccess.BLOCKED,
      msSinceBlock: msObserve,
      isShowing: false,
      msViewtime: 0,
      msSinceUpdate: msObserve,
    }
    expect(observed).toMatchObject(expected);
  })
  

  test("show and hide while blocked", () => {
    const time = timeGenerator();
    const frame = { tabId: 0, frameId: 0 };
    const page = new BasicPage();
    page.recordAction(PageActionType.BLOCK, time());
    page.recordEvent(time(), { type: PageEventType.FRAME_SHOW, frame });
    const msHide = 5;
    page.recordEvent(time(msHide), { type: PageEventType.FRAME_HIDE, frame });
    const msObserve = 10;
    const observed = observePage(page, time(msObserve));

    const expected: ExpectedObservedPage = {
      access: PageAccess.BLOCKED,
      msSinceBlock: msObserve,
      isShowing: false,
      msViewtime: 0,
      msSinceUpdate: msObserve,
    }
    expect(observed).toMatchObject(expected);
  })
  

  test("reset viewtime while blocekd", () => {
    const time = timeGenerator();
    const page = new BasicPage();
    page.recordAction(PageActionType.BLOCK, time());
    const msReset = 100_000;
    page.recordAction(PageActionType.RESET_VIEWTIME, time(msReset));
    const msObserve = msReset;
    const observed = observePage(page, time(msObserve));

    const expected: ExpectedObservedPage = {
      access: PageAccess.BLOCKED,
      msSinceBlock: msObserve,
      isShowing: false,
      msSinceInitialVisit: null,
      msSinceHide: null,
      msViewtime: 0,
      msSinceUpdate: msObserve,
    }
    expect(observed).toMatchObject(expected);
  })
  
  
  test("reset initial visit while blocked", () => {
    const time = timeGenerator();
    const page = new BasicPage();
    page.recordAction(PageActionType.BLOCK, time());
    const msReset = 100_000;
    page.recordAction(PageActionType.RESET_INITIALVISIT, time(msReset));
    const msObserve = msReset;
    const observed = observePage(page, time(msObserve));

    const expected: ExpectedObservedPage = {
      access: PageAccess.BLOCKED,
      msSinceBlock: msObserve,
      isShowing: false,
      msSinceInitialVisit: null,
      msSinceHide: null,
      msViewtime: 0,
      msSinceUpdate: msObserve,
    }
    expect(observed).toMatchObject(expected);
  })
  

  test("unblock before block", () => {
    const time = timeGenerator();
    const page = new BasicPage();
    page.recordAction(PageActionType.UNBLOCK, time(-10));
    page.recordAction(PageActionType.BLOCK, time());
    const observed = observePage(page, time());

    const expected: ExpectedObservedPage = {
      access: PageAccess.BLOCKED,
      msSinceBlock: 0,
      isShowing: false,
      msSinceInitialVisit: null,
      msSinceHide: null,
      msViewtime: 0,
      msSinceUpdate: 0,
    }
    expect(observed).toMatchObject(expected);
  })


  test("unblock after block", () => {
    const time = timeGenerator();
    const page = new BasicPage();
    page.recordAction(PageActionType.BLOCK, time());
    const msUnblock = 800;
    page.recordAction(PageActionType.UNBLOCK, time(msUnblock));
    const msObserve = msUnblock + 10;
    const observed = observePage(page, time(msObserve));

    const expected: ExpectedObservedPage = {
      access: PageAccess.ALLOWED,
      msSinceBlock: null,
      isShowing: false,
      msSinceInitialVisit: null,
      msSinceHide: null,
      msViewtime: 0,
      msSinceUpdate: msObserve - msUnblock,
    }
    expect(observed).toMatchObject(expected);
  })


  test("unblock when not blocked; visited and viewed", () => {
    const time = timeGenerator();
    const frame = { tabId: 0, frameId: 0 };
    const page = new BasicPage();
    page.recordEvent(time(), { type: PageEventType.FRAME_OPEN, frame });
    page.recordEvent(time(), { type: PageEventType.FRAME_SHOW, frame });
    const viewtime = 1;
    page.recordEvent(time(viewtime), { type: PageEventType.FRAME_HIDE, frame });
    const msUnblock = viewtime + 3;
    page.recordAction(PageActionType.UNBLOCK, time(msUnblock));
    const msObserve = 500;
    const observed = observePage(page, time(msObserve));

    const expected: ExpectedObservedPage = {
      access: PageAccess.ALLOWED,
      msSinceBlock: null,
      isShowing: false,
      msSinceInitialVisit: msObserve,
      msSinceHide: msObserve - viewtime,
      msViewtime: viewtime,
      msSinceUpdate: msObserve - viewtime,
    }
    expect(observed).toMatchObject(expected);
  })
})


describe("regression", () => {
  test("viewtime accrual", () => {
    const startTime = new Date("2023-04-26T18:00:00.000Z");
    const t = timeGenerator(startTime);
    const frame = { tabId: 0, frameId: 0 };

    const page = new BasicPage();

    // first show
    page.recordEvent(t(0), { type: PageEventType.FRAME_OPEN, frame });
    page.recordEvent(t(0), { type: PageEventType.FRAME_SHOW, frame });

    expect(page.isShowing()).toBe(true);
    expect(page.msViewtime(t(50))).toEqual(50);
  })
})


describe("BasicPage from/toObject", () => {

  test("from/toObject does not mutate", () => {
    const frames = {
      A: { tabId: 0, frameId: 0 },
      B: { tabId: 0, frameId: 1 },
      C: { tabId: 1, frameId: 2 },
    }
    const time = timeGenerator();
    const page = new BasicPage();
    page.recordEvent(time(), { type: PageEventType.FRAME_OPEN, frame: frames.A });
    page.recordEvent(time(), { type: PageEventType.FRAME_SHOW, frame: frames.B });
    page.recordEvent(time(5), { type: PageEventType.FRAME_SHOW, frame: frames.C });
    page.recordEvent(time(10), { type: PageEventType.TAB_CLOSE, tab: frames.B });
    const expected = page.toObject();
    const actual = BasicPage.fromObject(expected).toObject();
    expect(actual).toStrictEqual(expected);
  })
})
