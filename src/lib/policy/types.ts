import type { BrowseLocation } from "@bouncer/events";
import type { FrameType } from "@bouncer/matcher";
import type { IPage } from "@bouncer/page";
import type { BasicPolicyData } from "./BasicPolicy";

/**
 * Represents a policy.
 */
export interface IPolicy {
  /**
   * Human-readable name of the policy.
   */
  name: string;

  /**
   * Whether this policy is active.
   */
  active: boolean,

  /**
   * Whether the policy applies to the given frame.
   * 
   * @param location the frame's location
   * @returns whether the policy applies to the frame at the given locaiton
   */
  appliesTo(location: BrowseLocation): boolean;

  /**
   * Apply the policy to a page, potentially mutating the page.
   * 
   * @param time time to apply the policy at
   * @param page the page to apply the policy to
   */
  enforce(time: Date, page: IPage): void;

  /**
   * Get the datetime of the next policy event triggered by browsing activity.
   * Only events that aid block enforcement are considered; an event that
   * triggers an unblock is not.
   * 
   * @param time the current time
   * @param page the current page
   * @returns the date of the next enforcement event triggered by viewtime use
   */
  nextViewEvent(time: Date, page: IPage): Date | undefined;

  /**
   * Get the datetime of the next policy event triggered by the passage of time.
   * Only events that aid block enforcement are considered; an event that
   * triggers an unblock is not.
   * 
   * @param time the current time
   * @param page the current page
   * @returns the date of the next scheduled enforcement event
   */
  nextTimelineEvent(time: Date, page: IPage): Date | undefined;

  /**
   * Convert the policy to an object representation. The representation must
   * include a field "type" that indicates the type of policy represented.
   *
   * @returns object representing policy
   */
  toObject(): PolicyData;
}

/**
 * Union of all types that represent policies in their serialized form.
 */
export type PolicyData =
  BasicPolicyData;
