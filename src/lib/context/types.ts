import type { IGuard } from "@bouncer/guard";

/**
 * Represents a data context that exposes entities related to Bouncer for
 * reading and writing. Operates in a manner similar to a `DbContext` in
 * an ORM such as Entity Framework Core.
 */
export interface IBouncerContext {
  /**
   * Get all guards.
   */
  guards(): Promise<IGuard[]>;

  /**
   * Get guards applicable to a specific URL.
   * 
   * @param url the URL to which the guards should apply.
   */
  applicableGuards(url: URL): Promise<IGuard[]>;
  
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

/**
 * Represents a data context that exposes data for reading and writing, and
 * allows data modifications to be saved elsewhere.
 */
export interface IContext {
  /**
   * Save changes to the data.
   */
  save(): Promise<void>;
}
