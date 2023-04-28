import type { IPolicy } from "@bouncer/policy";

/**
 * Represents a data context that exposes entities related to Bouncer for
 * reading and writing. Operates in a manner similar to a `DbContext` in
 * an ORM such as Entity Framework Core.
 */
export interface IBouncerContext {
  /**
   * Get all policies.
   */
  policies(): Promise<IPolicy[]>;

  /**
   * Get policies applicable to a specific URL.
   * 
   * @param url the URL to which the policies should apply.
   */
  applicablePolicies(url: URL): Promise<IPolicy[]>;
  
  /**
   * Refresh the context contents. Use when data is altered outside of the
   * context.
   */
  refresh(): Promise<void>;

  /**
   * Save changes made to entities returned by this context.
   */
  persist(): Promise<void>;
}
