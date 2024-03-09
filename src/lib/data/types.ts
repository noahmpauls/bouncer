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

/**
 * Represents a data layer capable of translating between a runtime object and
 * persisted data describing that object.
 * 
 * @typeParam T runtime object type
 */
export interface IDataMapper<T> {
  /**
   * Map a runtime object to persisted data.
   * 
   * @param obj object to persist
   */
  toData(obj: T): Promise<void>;

  /**
   * Map persisted data to a runtime object.
   * 
   * @returns runtime object
   */
  toObject(): Promise<T>;
}

/**
 * Represents a transformer capable of serializing/deserializing data.
 * 
 * @typeParam TObject deserialized type
 * @typeParam TData serialized type
 */
export interface ITransformer<TObject, TData> {
  /**
   * @param obj object to serialize
   */
  serialize(obj: TObject): TData;

  /**
   * @param data data to deserialize
   */
  deserialize(data: TData): TObject;
}

/**
 * Configuration options for ho
 * 
 * @typeParam Type the type of
 */
export type KeyConfig<Type> = {
  [Property in keyof Type]: {
    /** Fallback value to provide when key has no value. */
    fallback: Type[Property]
  }
}
