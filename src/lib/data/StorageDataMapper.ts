import type { IStorage } from "@bouncer/storage";
import type { IDataMapper, ITransformer, KeyConfig } from "./types";

/**
 * Represents a data mapper that persists to/retrieves from a Storage solution.
 * 
 * @typeParam TObject runtime object type
 * @typeParam TData stored data type
 */
export class StorageDataMapper<TObject, TData extends Object> implements IDataMapper<TObject> {
  /**
   * @param storage Storage provider
   * @param transformer transformer between runtime and stored data
   * @param keyConfig options for storage by key
   */
  constructor(
    private readonly storage: IStorage,
    private readonly transformer: ITransformer<TObject, TData>,
    private readonly keyConfig: KeyConfig<TData>,
  ) { }

  async toData(obj: TObject): Promise<void> {
    const data: TData = this.transformer.serialize(obj);
    for (const [key, value] of Object.entries(data)) {
      await this.storage.set(key, value);
    }
  }

  toObject = async (): Promise<TObject> => {
    // dubious typing...
    const data: any = {};
    for (const [key, config] of Object.entries(this.keyConfig)) {
      data[key] = await this.storage.get(key, config.fallback);
    }
    const thing = this.transformer.deserialize(data);
    return thing;
  }
}
