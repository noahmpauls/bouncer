/** Represents a provider of time. */
export interface IClock {
  /** Get the current time. */
  time(): Date;
}
