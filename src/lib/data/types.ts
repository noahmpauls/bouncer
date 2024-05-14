import type { ActiveTabs, BrowseActivity, GuardPostings } from "@bouncer/controller";
import type { IGuard } from "@bouncer/guard";
import type { IStorage } from "@bouncer/storage";

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

  /**
   * Clear all data from the context cache.
   */
  clear(): Promise<void>;
}

export type BouncerContextObject = {
  activeTabs: ActiveTabs,
  browseActivity: BrowseActivity,
  guardPostings: GuardPostings,
  guards: IGuard[],
}

export type IBouncerContext = IContext<BouncerContextObject>

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
    /** Fallback when key has no value. */
    fallback: {
        /** Fallback value. */
        value: Type[Property]
      } | { 
        /** Fallback value initializer. */
        initialize: (() => Promise<Type[Property]>)
      }
  }
}
