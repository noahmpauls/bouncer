import type { IGuard } from "@bouncer/guard";
import type { IStorage } from "@bouncer/storage";

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
 * Represents a data context that exposes data for reading and writing, and
 * allows data modifications to be saved.
 * 
 * @typeParam T runtime object type
 */
export interface IContext<T> {
  /**
   * Save changes to the context data.
   */
  commit(): Promise<void>;

  /**
   * Get a reference to the context data.
   * 
   * @returns runtime object
   */
  fetch(): Promise<T>;
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
 * Configuration options for data storage by key.
 * 
 * @typeParam Type stored data format
 * @typeParam TBuckets storage bucket lookup type
 */
export type KeyConfig<Type, TBuckets extends Record<string, IStorage>> = {
  [Property in keyof Type]: {
    /** Storage location for the key's data. */
    bucket: keyof TBuckets,
    /** Fallback value to provide when key has no value. */
    fallback: Type[Property],
  }
}
