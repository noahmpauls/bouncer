import type { IGuard } from "@bouncer/guard";

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
}
