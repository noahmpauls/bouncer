import { BasicPage, type IPage, type IPageMetrics, PageAccess, type PageEvent } from "@bouncer/page"

type PageMutation = {
  type: PageEvent,
  offsetMs?: number,
}


/**
 * Create a page that, starting from a fresh state, has the given mutations
 * applied to it.
 * 
 * Mutations are applied at an offset time relative to the given start time. If
 * no offset is given, the event occurs at the start time. Providing a viewer
 * that triggered the event is optional, and if omitted this will default to
 * the empty string.
 * 
 * @param startTime reference time for mutation offsets
 * @param mutations mutations to apply, in order
 * @returns a fresh page, mutated with the given operations
 */
export function pageWithMutations(startTime: Date, mutations: PageMutation[]): IPage {
  const page = new BasicPage();
  const startTimeMs = startTime.getTime();
  for (const mutation of mutations) {
    const time = new Date(startTimeMs + (mutation.offsetMs ?? 0));
    page.recordEvent(time, mutation.type);
  }
  return page;
}


export function pageMetrics(metrics: {
  access?: PageAccess,
  isShowing?: boolean,
  msSinceInitialVisit?: number | undefined,
  msViewtime?: number,
  msSinceBlock?: number | undefined,
  msSinceHide?: number | undefined,
  msSinceUpdate?: number | undefined,
}): IPageMetrics {
  return {
    access: () => metrics.access ?? PageAccess.ALLOWED,
    isShowing: () => metrics.isShowing ?? false,
    msSinceInitialVisit: (t) => metrics.msSinceInitialVisit,
    msViewtime: (t) => metrics.msViewtime ?? 0,
    msSinceBlock: (t) => metrics.msSinceBlock,
    msSinceHide: (t) => metrics.msSinceHide,
    msSinceUpdate: (t) => metrics.msSinceUpdate,
  }
}


export function timeGenerator(time: Date = new Date()) {
  return (offsetMs = 0) => new Date(time.getTime() + offsetMs);
}