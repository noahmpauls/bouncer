import { describe, test, expect } from "@jest/globals";
import { BasicPage, IPage, PageAccess, PageEvent, PageReset } from "@bouncer/page";
import { BasicPageData } from "@bouncer/page/BasicPage";


type ObservedPage = {
  access: ReturnType<IPage["checkAccess"]>,
  isShowing: ReturnType<IPage["isShowing"]>,
  msSinceInitialVisit: ReturnType<IPage["msSinceInitialVisit"]>,
  msViewtime: ReturnType<IPage["msViewtime"]>
  msSinceBlock: ReturnType<IPage["msSinceBlock"]>,
  msSinceHide: ReturnType<IPage["msSinceHide"]>
}

type ExpectedObservedPage = Partial<ObservedPage>;

function observePage(page: IPage, time: Date): ObservedPage {
  return {
    access: page.checkAccess(time),
    isShowing: page.isShowing(time),
    msSinceInitialVisit: page.msSinceInitialVisit(time),
    msViewtime: page.msViewtime(time),
    msSinceBlock: page.msSinceBlock(time),
    msSinceHide: page.msSinceHide(time)
  }
}


function timeGenerator(time: Date = new Date()) {
  return (offsetMs: number = 0) => new Date(time.getTime() + offsetMs);
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
    }
    expect(observed).toMatchObject(expected);
  })
  
  
  test("visited, no viewtime", () => {
    const time = timeGenerator();
    const page = new BasicPage();
    page.recordEvent(time(), PageEvent.VISIT, "");
    const msFromVisit = 500;
    const observed = observePage(page, time(msFromVisit));
    
    const expected: ExpectedObservedPage = {
      access: PageAccess.ALLOWED,
      isShowing: false,
      msSinceInitialVisit: msFromVisit,
      msViewtime: 0,
      msSinceBlock: null,
      msSinceHide: null
    }
    expect(observed).toMatchObject(expected);
  })
  

  test("show before visit", () => {
    const time = timeGenerator();
    const page = new BasicPage();
    page.recordEvent(time(), PageEvent.SHOW, "");
    const msFromShow = 100;
    const observed = observePage(page, time(msFromShow));

    const expected: ExpectedObservedPage = {
      access: PageAccess.ALLOWED,
      isShowing: true,
      msSinceInitialVisit: null,
      msViewtime: msFromShow,
      msSinceBlock: null,
      msSinceHide: null,
    }
    expect(observed).toMatchObject(expected);
  })


  test("hide before show", () => {
    const time = timeGenerator();
    const page = new BasicPage();
    page.recordEvent(time(), PageEvent.VISIT, "");
    page.recordEvent(time(100), PageEvent.HIDE, "");
    const msFromVisit = 200;
    const observed = observePage(page, time(msFromVisit));

    const expected: ExpectedObservedPage = {
      access: PageAccess.ALLOWED,
      isShowing: false,
      msSinceInitialVisit: msFromVisit,
      msViewtime: 0,
      msSinceBlock: null,
      msSinceHide: null,
    }
    expect(observed).toMatchObject(expected);
  })
  

  test("show and hide before visit", () => {
    const time = timeGenerator();
    const page = new BasicPage();
    page.recordEvent(time(), PageEvent.SHOW, "");
    const msViewtime = 100
    page.recordEvent(time(msViewtime), PageEvent.HIDE, "");
    const msFromShow = 200;
    const observed = observePage(page, time(msFromShow));

    const expected: ExpectedObservedPage = {
      access: PageAccess.ALLOWED,
      isShowing: false,
      msSinceInitialVisit: null,
      msViewtime: msViewtime,
      msSinceBlock: null,
      msSinceHide: msFromShow - msViewtime,
    }
    expect(observed).toMatchObject(expected);
  })


  test("view session: show time before hide time", () => {
    const time = timeGenerator();
    const page = new BasicPage();
    const msViewtime = 10_000;
    page.recordEvent(time(), PageEvent.SHOW, "");
    page.recordEvent(time(msViewtime), PageEvent.HIDE, "");
    const msObserveDelay = 0;
    const observed = observePage(page, time(msViewtime + msObserveDelay));
    
    const expected: ExpectedObservedPage = {
      isShowing: false,
      msViewtime: msViewtime,
      msSinceHide: msObserveDelay,
    };
    expect(observed).toMatchObject(expected);
  })
  

  test("view session: show time = hide time", () => {
    const time = timeGenerator();
    const page = new BasicPage();
    const msViewtime = 0;
    page.recordEvent(time(), PageEvent.SHOW, "");
    page.recordEvent(time(msViewtime), PageEvent.HIDE, "");
    const msObserveDelay = 100;
    const observed = observePage(page, time(msViewtime + msObserveDelay));
    
    const expected: ExpectedObservedPage = {
      isShowing: false,
      msViewtime: msViewtime,
      msSinceHide: msObserveDelay,
    };
    expect(observed).toMatchObject(expected);
  })
  

  test("view session: show time after hide time", () => {
    const time = timeGenerator();
    const page = new BasicPage();
    const msViewtime = -10_000;
    page.recordEvent(time(), PageEvent.SHOW, "");
    page.recordEvent(time(msViewtime), PageEvent.HIDE, "");
    const msObserveDelay = 100_000;
    const observed = observePage(page, time(msViewtime + msObserveDelay));
    
    const expected: ExpectedObservedPage = {
      isShowing: true,
      msViewtime: msObserveDelay,
      msSinceHide: null,
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
    const page = new BasicPage();
    for (const session of sessions) {
      expect(session.start).toBeLessThanOrEqual(session.end);
      page.recordEvent(time(session.start), PageEvent.SHOW, "");
      page.recordEvent(time(session.end), PageEvent.HIDE, "");
    }
    const observed = observePage(page, time());

    const totalViewtime = sessions.map(s => Math.max(0, s.end - s.start)).reduce((a, b) => a + b, 0);
    const expected: ExpectedObservedPage = {
      isShowing: false,
      msViewtime: totalViewtime,
    };
    expect(observed).toMatchObject(expected);
  })


  test("concurrent viewers small", () => {
    const time = timeGenerator();
    const page = new BasicPage();
    page.recordEvent(time(), PageEvent.SHOW, "A");
    page.recordEvent(time(1000), PageEvent.SHOW, "B");
    page.recordEvent(time(2000), PageEvent.HIDE, "A");

    const msShowingObserve = 5_000;
    const observedShowing = observePage(page, time(msShowingObserve));
    const expectedShowing: ExpectedObservedPage = {
      isShowing: true,
      msViewtime: msShowingObserve,
      msSinceHide: null
    };
    expect(expectedShowing).toMatchObject(expectedShowing);

    const msHide = 10_000;
    page.recordEvent(time(msHide), PageEvent.HIDE, "B");
    const msHiddenObserve = 20_000;
    const observedHidden = observePage(page, time(msHiddenObserve));
    const expectedHidden: ExpectedObservedPage = {
      isShowing: false,
      msViewtime: msHide,
      msSinceHide: msHiddenObserve - msHide
    };
    expect(observedHidden).toMatchObject(expectedHidden);
  })
  

  test("concurrent viewers big", () => {
    const events = [
      { viewer: "A", event: PageEvent.SHOW, time: 0 },
      { viewer: "B", event: PageEvent.SHOW, time: 100 },
      { viewer: "C", event: PageEvent.SHOW, time: 200 },
      { viewer: "B", event: PageEvent.HIDE, time: 300 },
      { viewer: "A", event: PageEvent.HIDE, time: 400 },
      { viewer: "D", event: PageEvent.SHOW, time: 500 },
      { viewer: "C", event: PageEvent.HIDE, time: 600 },
      { viewer: "E", event: PageEvent.SHOW, time: 700 },
      { viewer: "E", event: PageEvent.HIDE, time: 800 },
      { viewer: "D", event: PageEvent.HIDE, time: 900 },
    ];
    const time = timeGenerator();
    const page = new BasicPage();
    for (const event of events) {
      page.recordEvent(time(event.time), event.event, event.viewer);
    }
    const msLastHide = Math.max(...events.map(e => e.time));
    const msObserveDelay = 100;
    const observed = observePage(page, time(msLastHide + msObserveDelay));

    const expected: ExpectedObservedPage = {
      isShowing: false,
      msViewtime: msLastHide,
      msSinceHide: msObserveDelay,
    };
    expect(observed).toMatchObject(expected);
  })
  

  test("multiple consecutive visits, forward in time", () => {
    const visitTimes = [100, 200];
    const time = timeGenerator();
    const page = new BasicPage();
    for (const visitTime of visitTimes) {
      page.recordEvent(time(visitTime), PageEvent.VISIT, "");
    }
    const msObserve = 500;
    const observed = observePage(page, time(msObserve));

    const expected: ExpectedObservedPage = {
      msSinceInitialVisit: msObserve - Math.min(...visitTimes)
    };
    expect(observed).toMatchObject(expected);
  })


  test("multiple consecutive visits, back in time", () => {
    const visitTimes = [200, 100];
    const time = timeGenerator();
    const page = new BasicPage();
    for (const visitTime of visitTimes) {
      page.recordEvent(time(visitTime), PageEvent.VISIT, "");
    }
    const msObserve = 500;
    const observed = observePage(page, time(msObserve));

    const expected: ExpectedObservedPage = {
      msSinceInitialVisit: msObserve - Math.min(...visitTimes)
    };
    expect(observed).toMatchObject(expected);
  })
  

  test("multiple consecutive shows, forward in time", () => {
    const showTimes = [100, 200];
    const time = timeGenerator();
    const page = new BasicPage();
    for (const showTime of showTimes) {
      page.recordEvent(time(showTime), PageEvent.SHOW, "");
    }
    const msObserve = 500;
    const observed = observePage(page, time(msObserve));

    const expected: ExpectedObservedPage = {
      msViewtime: msObserve - Math.min(...showTimes)
    };
    expect(observed).toMatchObject(expected);
  })


  test("multiple consecutive shows, back in time", () => {
    const showTimes = [200, 100];
    const time = timeGenerator();
    const page = new BasicPage();
    for (const showTime of showTimes) {
      page.recordEvent(time(showTime), PageEvent.SHOW, "");
    }
    const msObserve = 500;
    const observed = observePage(page, time(msObserve));

    const expected: ExpectedObservedPage = {
      msViewtime: msObserve - Math.min(...showTimes)
    };
    expect(observed).toMatchObject(expected);
  })
  

  test("multiple consecutive hides, forward in time", () => {
    const hideTimes = [100, 200];
    const time = timeGenerator();
    const page = new BasicPage();
    page.recordEvent(time(), PageEvent.SHOW, "");
    for (const hideTime of hideTimes) {
      page.recordEvent(time(hideTime), PageEvent.HIDE, "");
    }
    const msObserve = 500;
    const observed = observePage(page, time(msObserve));

    const expected: ExpectedObservedPage = {
      msViewtime: hideTimes[0],
    };
    expect(observed).toMatchObject(expected);
  })


  test("multiple consecutive hides, back in time", () => {
    const hideTimes = [200, 100];
    const time = timeGenerator();
    const page = new BasicPage();
    page.recordEvent(time(), PageEvent.SHOW, "");
    for (const hideTime of hideTimes) {
      page.recordEvent(time(hideTime), PageEvent.HIDE, "");
    }
    const msObserve = 500;
    const observed = observePage(page, time(msObserve));

    const expected: ExpectedObservedPage = {
      msViewtime: hideTimes[0],
    };
    expect(observed).toMatchObject(expected);
  })
  

  test("reset viewtime after only visited", () => {
    const time = timeGenerator();
    const page = new BasicPage();
    page.recordEvent(time(), PageEvent.VISIT, "");
    const msReset = 500;
    page.recordReset(time(msReset), PageReset.VIEWTIME, time(msReset));
    const msObserve = 1000;
    const observed = observePage(page, time(msObserve))
    
    const expected: ExpectedObservedPage = {
      msSinceInitialVisit: msObserve,
      msSinceHide: null
    };
    expect(observed).toMatchObject(expected);
  })


  /**
   * Reset application time is before the time of the last show, in which
   * case the reset should have no effect since viewtime events occurred
   * after the reset.
   * 
   * Ugh, this is dangerous. We can't do the same thing after a hide.
   */
  test("reset viewtime while visible, reset applied before last show", () => {
    throw new Error("not implemented");
  })
  
  
  test("reset viewtime while visible, resetTime after last show", () => {
    const time = timeGenerator();
    const page = new BasicPage();
    page.recordEvent(time(), PageEvent.SHOW, "");
    const msReset = 2000;
    const msObserve = 5000;
    page.recordReset(time(msObserve), PageReset.VIEWTIME, time(msReset));
    const observed = observePage(page, time(msObserve));

    const expected: ExpectedObservedPage = {
      isShowing: true,
      msViewtime: msObserve - msReset,
      msSinceHide: null
    }
    expect(observed).toMatchObject(expected);
  })
  
  
  test("reset viewtime while visible, resetTime before last show", () => {
    const time = timeGenerator();
    const page = new BasicPage();
    page.recordEvent(time(), PageEvent.SHOW, "");
    const msReset = -1000;
    const msObserve = 5000;
    page.recordReset(time(msObserve), PageReset.VIEWTIME, time(msReset));
    const observed = observePage(page, time(msObserve));

    const expected: ExpectedObservedPage = {
      isShowing: true,
      msViewtime: msObserve,
      msSinceHide: null
    }
    expect(observed).toMatchObject(expected);
  })


  test("reset viewtime after show and hide, reset after start and hide", () => {
    const time = timeGenerator();
    const page = new BasicPage();
    page.recordEvent(time(), PageEvent.SHOW, "");
    const msHide = 5000;
    page.recordEvent(time(msHide), PageEvent.HIDE, "");
    const msReset = 5500;
    const msObserve = 6000;
    page.recordReset(time(msObserve), PageReset.VIEWTIME, time(msReset));
    const observed = observePage(page, time(msObserve));
    
    const expected: ExpectedObservedPage = {
      isShowing: false,
      msViewtime: msHide,
      msSinceHide: msObserve - msHide,
    };
    expect(observed).toMatchObject(expected);
  })


  /**
   * Reseting viewtime after a view session, but the reset time is prior to the
   * hide time of the session. In this case, the effective start time of the
   * session is the reset time, and viewtime is altered accordingly.
   */
  test("reset viewtime after show and hide, reset before hide and after start", () => {
    const time = timeGenerator();
    const page = new BasicPage();
    page.recordEvent(time(), PageEvent.SHOW, "");
    const msHide = 5000;
    page.recordEvent(time(msHide), PageEvent.HIDE, "");
    const msReset = 4000;
    const msObserve = 6000;
    page.recordReset(time(msObserve), PageReset.VIEWTIME, time(msReset));
    const observed = observePage(page, time(msObserve));
    
    const expected: ExpectedObservedPage = {
      isShowing: false,
      msViewtime: msHide - msReset,
      msSinceHide: msObserve - msHide,
    };
    expect(observed).toMatchObject(expected);
  })
  

  test("reset initial visit after only visited", () => {
    const time = timeGenerator();
    const page = new BasicPage();
    page.recordEvent(time(), PageEvent.VISIT, "");
    const msReset = 100;
    page.recordReset(time(200), PageReset.INITIALVISIT, time(msReset));
    const msObserve = 300; 
    const observed = observePage(page, time(msObserve));
    
    const expected: ExpectedObservedPage = {
      msSinceInitialVisit: null,
    };
    expect(observed).toMatchObject(expected);
  })
  

  /**
   * If reset is applied before the initial visit, the reset has no effect.
   * Does this even make sense for this to happen?
   */
  test("reset initial visit after only visited, applied before visit", () => {
    const time = timeGenerator();
    const page = new BasicPage();
    page.recordEvent(time(), PageEvent.VISIT, "");
    page.recordReset(time(-100), PageReset.INITIALVISIT, time(-200));
    const msObserve = 200; 
    const observed = observePage(page, time(msObserve));

    const expected: ExpectedObservedPage = {
      msSinceInitialVisit: 0
    };
    expect(observed).toMatchObject(expected);
  })


  test("reset initial visit while visible", () => {
    const time = timeGenerator();
    const page = new BasicPage();
    page.recordEvent(time(), PageEvent.VISIT, "");
    const msShow = 150;
    page.recordEvent(time(msShow), PageEvent.SHOW, "");
    const msReset = 200;
    page.recordReset(time(250), PageReset.INITIALVISIT, time(msReset));
    const msObserve = 300; 
    const observed = observePage(page, time(msObserve));
    
    const expected: ExpectedObservedPage = {
      isShowing: true,
      msViewtime: msObserve - msShow,
      msSinceInitialVisit: msObserve - msShow
    };
    expect(observed).toMatchObject(expected);
  })
  

  test("reset initial visit after show and hide", () => {
    const time = timeGenerator();
    const page = new BasicPage();
    page.recordEvent(time(), PageEvent.VISIT, "");
    const msShow = 150;
    page.recordEvent(time(msShow), PageEvent.SHOW, "");
    const msHide = 175;
    page.recordEvent(time(msHide), PageEvent.HIDE, "");
    const msReset = 200;
    page.recordReset(time(250), PageReset.INITIALVISIT, time(msReset));
    const msObserve = 300; 
    const observed = observePage(page, time(msObserve));
    
    const expected: ExpectedObservedPage = {
      isShowing: false,
      msViewtime: msHide - msShow,
      msSinceInitialVisit: null,
    };
    expect(observed).toMatchObject(expected);
  })


  test("block fresh page", () => {
        throw new Error("not implemented");
  })
  

  test("block after visit", () => {
        throw new Error("not implemented");
  })
  

  test("block while visible", () => {
    throw new Error("not implemented");
  })
  

  test("block after viewtime accrued", () => {
        throw new Error("not implemented");
  })


  test("block after visit and viewtime accrued", () => {
    throw new Error("not implemented");
  })


  test("visit while blocked", () => {
        throw new Error("not implemented");
  })
  

  test("show while blocked", () => {
        throw new Error("not implemented");
  })
  

  test("show and hide while blocked", () => {
        throw new Error("not implemented");
  })
  

  test("reset viewtime while blocekd", () => {
        throw new Error("not implemented");
  })
  
  
  test("reset initial visit while blocked", () => {
        throw new Error("not implemented");
  })
  

  test("unblock before block", () => {
        throw new Error("not implemented");
  })


  test("block and unblock at same time", () => {
        throw new Error("not implemented");
  })


  test("unblock after block", () => {
        throw new Error("not implemented");
  })
  

  test("unblock when not blocked", () => {
        throw new Error("not implemented");
  })
})


describe("BasicPage from/toObject", () => {

  test("from/toObject does not mutate", () => {
    throw new Error("not implemented");
  })
})
