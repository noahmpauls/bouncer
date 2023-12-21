import type { IGuard } from "@bouncer/guard";
import type { IPolicy } from "@bouncer/policy";

/**
 * Provider of Bouncer data, for reading and writing.
 */
export interface IBouncerData {
  /**
   * Get all guards.
   * 
   * @returns all guards
   */
  getGuards(): Promise<IGuard[]>;
  
  /**
   * Set all guards.
   * 
   * @param guards guard entities
   */
  setGuards(guards: IGuard[]): Promise<void>;
  
  /**
   * Add a new policy.
   * 
   * @param policy policy to add
   * @returns guard created with policy
   */
  addPolicy(policy: IPolicy): Promise<IGuard>;
}
