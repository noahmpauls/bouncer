import { IUrlMatcher } from "./matcher";
import { BasicPage, deserializePage, IPage, serializePage } from "./page";
import { deserializePolicy, IPolicy, IPolicyMetadata, serializePolicy } from "./policy";
import { IStorage } from "./storage";


/**
 * Provider of Bouncer data, for reading and writing.
 */
export interface IBouncerData {
  /**
   * Get all policies and pages that correspond to a given URL.
   *
   * @param url the URL that policies should apply to
   * @returns applicable policies and corresponding pages
   */
  getApplicablePolicies(url: URL): Promise<{ metadata: IPolicyMetadata, policy: IPolicy, page: IPage }[]>;

  /**
   * Get all policies.
   * 
   * @returns all policies with their metadata
   */
  getPolicies(): Promise<{ metadata: IPolicyMetadata, policy: IPolicy }[]>;
  
  /**
   * Add a new policy with the specified metadata.
   * 
   * @param metadata policy metadata
   * @param policy policy
   * @returns ID of added policy
   */
  addPolicy(metadata: Omit<IPolicyMetadata, "id">, policy: IPolicy): Promise<string>;

  /**
   * Set a given policy to a new value.
   *
   * @param metadata policy metadata
   * @param policy the set policy
   */
  setPolicy(metadata: IPolicyMetadata, policy: IPolicy): Promise<void>;

  /**
   * Set the page associated with a given policy.
   * 
   * @param metadata: policy metadata
   * @param page the set page
   */
  setPolicyPage(metadata: IPolicyMetadata, page: IPage): Promise<void>;
}


/**
 * Represents a Bouncer data provider that uses a persistent storage solution.
 */
export class StoredBouncerData implements IBouncerData {
  private readonly storage: IStorage;

  /**
   * @param storage the storage provider
   */
  constructor(storage: IStorage) {
    this.storage = storage;
  }

  
  async getApplicablePolicies(url: URL): Promise<{ metadata: IPolicyMetadata, policy: IPolicy, page: IPage; }[]> {
    const policies = await this.getPolicies();
    const applicablePolicies = policies.filter(({ policy }) => {
      return policy.matchers.map((m: IUrlMatcher) => m.matches(url)).reduce((a, b) => a || b, false);
    });
    // OOF this is slow...
    // TODO: find a better way to do this. Maybe try another structure where
    //       pages are stored together with policies.
    const withPages = await Promise.all(applicablePolicies.map(async ap => ({
      ...ap,
      page: await this.getPolicyPage(ap.metadata)
    })));
    return withPages;
  }
  
  
  async addPolicy(metadata: Omit<IPolicyMetadata, "id">, policy: IPolicy): Promise<string> {
    const policyData = await this.storage.get<any[]>("policies", []);
    const id = policyData.length.toString();
    const serializedPolicy = {
      id,
      ...metadata,
      policy: serializePolicy(policy),
    };
    policyData.push(serializedPolicy);
    await this.storage.set("policies", policyData);
    return id;
  }


  async getPolicies(): Promise<{ metadata: IPolicyMetadata, policy: IPolicy }[]> {
    const policyData = await this.storage.get<any[]>("policies", []);
    const results = policyData.map(p => {
      const metadata: IPolicyMetadata = {
        id: p.id,
        name: p.name ?? undefined,
        description: p.name ?? undefined,
        active: p.active,
      };
      const policy: IPolicy = deserializePolicy(p.policy);
      return { metadata, policy };
    });
    return results;
  }

  
  async setPolicy(metadata: IPolicyMetadata, policy: IPolicy): Promise<void> {
    const policyData = await this.storage.get<any[]>("policies", []);
    const policyIndex = policyData.findIndex(p => p.id === metadata.id);
    if (policyIndex === -1) {
      throw new Error(`policy with ID ${metadata.id} does not exist`);
    }
    const data = {
      ...metadata,
      policy: serializePolicy(policy),
    };
    policyData[policyIndex] = data;
    await this.storage.set("policies", policyData);
  }
  

  async setPolicyPage(metadata: IPolicyMetadata, page: IPage): Promise<void> {
    const pageId = this.pageId(metadata);
    await this.storage.set(pageId, page);
  }

  private async getPolicyPage(metadata: IPolicyMetadata): Promise<IPage> {
    const pageId = this.pageId(metadata);
    return deserializePage(await this.storage.get(pageId, serializePage(new BasicPage())));
  }

  private pageId(metadata: IPolicyMetadata): string {
    return `${metadata.id}-page`;
  }
}