import type { IPage } from "@bouncer/page";
import type { IPolicy } from "@bouncer/policy";
import type { BasicGuardData } from "./BasicGuard";

/**
 * Represents an agent that applies policies to pages.
 */
export interface IGuard {
  /**
   * Unique ID identifying a guard.
   */
  id: string,

  /**
   * Whether this guard is active.
   */
  active: boolean,

  /**
   * The guard's policy.
   */
  policy: IPolicy,

  /**
   * The guard's page tracking state.
   */
  page: IPage,

  /**
   * Convert the guard to an object representation. The representation must
   * include a field "type" that indicates the type of guard represented.
   *
   * @returns object representing guard
   */
  toObject(): GuardData,
}

/**
 * Union of all types that represent guards in their serialized form.
 */
export type GuardData =
  BasicGuardData;
