import { assert } from "@bouncer/utils";
import type { IMatcher } from "./types";
import type { BrowseLocation } from "@bouncer/events";

/**
 * Matches URL query parameter key/value pairs. If any query parameter matches,
 * the location matches.
 * 
 * This is a test matcher to help prevent things like Google searches for news,
 * which I find myself mindlessly making when I'm wandering off task. It isn't
 * very robust just yet.
 */
export class QueryParamsMatcher implements IMatcher {
  private readonly params: Map<string, Set<string>>

  constructor(params: Record<string, string[]>) {
    this.params = new Map(Object.entries(params)
      .map(([key, values]) => [key, new Set(values)]));
  }

  /**
   * Convert an object to this type of matcher.
   * 
   * @param obj object data representing matcher
   * @returns matcher
   */
  static fromObject(obj: QueryParamsMatcherData): QueryParamsMatcher {
    assert(obj.type === "QueryParams", `cannot make QueryParams from data with type ${obj.type}`);
    return new QueryParamsMatcher(obj.data.params);
  }

  matches = (location: BrowseLocation): boolean => {
    const params = location.url.searchParams;
    for (const [key, value] of params) {
      if (this.params.get(key)?.has(value)) {
        return true;
      }
    }
    return false;
  }

  toObject = (): QueryParamsMatcherData => {
    const params = Object.fromEntries(
      [...this.params.entries()]
        .map(([key, values]) => [key, [...values]])
    );
    return {
      type: "QueryParams",
      data: { params, },
    }
  }
}

export type QueryParamsMatcherData = {
  type: "QueryParams",
  data: {
    params: Record<string, string[]>,
  }
}
