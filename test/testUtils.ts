import { BasicPage, IPage, IPageMetrics, PageAccess, PageEvent, PageReset } from "@bouncer/page"
import { BasicPageData } from "@bouncer/page/BasicPage";

type PageMutation = {
  type: PageEvent,
  offsetMs?: number,
  viewer?: string
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
    page.recordEvent(time, mutation.type, mutation.viewer ?? "");
  }
  return page;
}


export function pageMetrics(metrics: {
  access?: PageAccess,
  isShowing?: boolean,
  msSinceInitialVisit?: number | null,
  msViewtime?: number,
  msSinceBlock?: number | null,
  msSinceHide?: number | null,
  msSinceUpdate?: number | null,
}): IPageMetrics {
  return {
    access: () => metrics.access ?? PageAccess.ALLOWED,
    isShowing: () => metrics.isShowing ?? false,
    msSinceInitialVisit: (t) => metrics.msSinceInitialVisit ?? null,
    msViewtime: (t) => metrics.msViewtime ?? 0,
    msSinceBlock: (t) => metrics.msSinceBlock ?? null,
    msSinceHide: (t) => metrics.msSinceHide ?? null,
    msSinceUpdate: (t) => metrics.msSinceUpdate ?? null,
  }
}


export function timeGenerator(time: Date = new Date()) {
  return (offsetMs: number = 0) => new Date(time.getTime() + offsetMs);
}