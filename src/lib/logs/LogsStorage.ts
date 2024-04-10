import { BrowserStorage, type IStorage } from "@bouncer/storage";
import type { ILogsReader, ILogsWriter, Log } from "./types";
import { Period } from "@bouncer/period";
import { Maps, Synchronizer } from "@bouncer/utils";
import type { IConfiguration } from "@bouncer/config";

/**
 * Represents a storage container for logs.
 * 
 * The goal is that this class can be used in a context via the ILogsWriter
 * interface in the Worker, and in pages to read the logs via the
 * ILogsReader interface.
 */
export class LogsStorageWriter implements ILogsWriter {
  private readonly sync: Synchronizer = new Synchronizer();
  private readonly metaStore: Metadata;

  constructor(
    private readonly config: IConfiguration,
    private readonly storage: IStorage,
  ) {
    this.metaStore = new Metadata(storage);
  }

  static browser = (config: IConfiguration): LogsStorageWriter => {
    return new LogsStorageWriter(
      config,
      BrowserStorage.local()
    );
  }

  write = async (logs: Log[]): Promise<void> => this.sync.sync(async () => {
    const metadata = await this.metaStore.get();
    const storedBuckets = new Set(metadata.buckets);

    const runtimeBuckets = this.bucketizeLogs(logs);
    for (const [timestamp, logs] of runtimeBuckets.entries()) {
      metadata.count += logs.length;
      let nextLogs = logs;
      const bucket = this.bucket(timestamp);
      const storedLogs = await bucket.get();
      if (storedLogs !== undefined) {
        nextLogs = logs.concat(storedLogs).sort((a, b) => a.timestamp - b.timestamp);
      }
      bucket.set(nextLogs);
      storedBuckets.add(timestamp);
    }
    metadata.buckets = [...storedBuckets].sort();
    await this.metaStore.set(metadata);

    if (metadata.count > this.config.maxLogs) {
      await this.trimOldBuckets(this.config.maxLogs);
    }
  });

  private bucket = (timestamp: number) =>
    new Bucket(timestamp, this.storage);

  private bucketizeLogs = (logs: Log[]): Map<number, Log[]> => {
    const buckets = new Map<number, Log[]>();
    for (const log of logs) {
      const bucketKey = Period("minute").start(new Date(log.timestamp)).getTime();
      const bucket = Maps.getOrDefault(buckets, bucketKey, []);
      bucket.push(log);
    }
    return buckets;
  }

  private trimOldBuckets = async (maxLogs: number) => {
    const metadata = await this.metaStore.get();
    if (metadata.count <= maxLogs) {
      return;
    }

    let trimBound = 0;
    // find the index of the first bucket that should be kept; all before the
    // trim boundary will be removed
    for (const [i, timestamp] of metadata.buckets.entries()) {
      const bucket = this.bucket(timestamp);
      const logs = await bucket.get();
      const logsCount = logs.length;
      // keep the bucket that puts the log count above the threshold (which
      // means we store a little moer than the max log count)
      if (metadata.count - logsCount <= maxLogs) {
        break;
      }
      await bucket.delete();
      trimBound = i + 1;
      metadata.count -= logsCount;
    }
    metadata.buckets = metadata.buckets.slice(trimBound);

    this.metaStore.set(metadata);
  }
}

export class LogsStorageReader implements ILogsReader {
  private readonly metaStore: Metadata;
  private subscriber: ((logs: Log[]) => void) | undefined = undefined;

  constructor(
    private readonly storage: IStorage,
  ) {
    this.metaStore = new Metadata(storage);
  }

  static browser = (): LogsStorageReader => {
    return new LogsStorageReader(
      BrowserStorage.local()
    );
  }

  logs = async (): Promise<Log[]> => {
    const metadata = await this.metaStore.get();
    const buckets = await Promise.all(metadata.buckets.map(b => this.bucket(b).get()));
    const logs = buckets.flatMap(b => b);
    return logs;
  }

  subscribe = (callback: (logs: Log[]) => void): void => {
    const shouldSubscribe = this.subscriber === undefined;
    this.subscriber = callback;
    if (shouldSubscribe) {
      this.storage.subscribe(Metadata.key, this.subscriptionCallback);
    }
  }

  unsubscribe = (): void => {
    this.subscriber = undefined;
    this.storage.unsubscribe(Metadata.key, this.subscriptionCallback);
  }

  private subscriptionCallback = async () => {
    const logs = await this.logs();
    if (this.subscriber !== undefined) {
      this.subscriber(logs);
    }
  }

  private bucket = (timestamp: number) =>
    new Bucket(timestamp, this.storage);
}

class Metadata {
  static readonly key: string = `logs-metadata`;

  constructor(
    private readonly storage: IStorage,
  ) { }

  get = async (): Promise<LogsMetadata> => {
    return await this.storage.get<LogsMetadata>(Metadata.key, { count: 0, buckets: [] });
  }

  set = async (metadata: LogsMetadata): Promise<void> => {
    return await this.storage.set(Metadata.key, metadata);
  }
}

class Bucket {
  private readonly key: string;

  constructor(
    timestamp: number,
    private readonly storage: IStorage, 
  ) {
    this.key = `logs-${timestamp}`;
  }
  
  get = async (): Promise<Log[]> => {
    return await this.storage.get<Log[]>(this.key, []);
  }

  set = async (bucket: Log[]): Promise<void> => {
    await this.storage.set(this.key, bucket);
  }

  delete = async (): Promise<void> => {
    await this.storage.delete(this.key);
  }
}

type LogsMetadata = {
  count: number,
  buckets: number[],
}
