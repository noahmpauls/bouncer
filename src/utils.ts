/**
 * Execute a function on an interval, starting with an immediate execution.
 * 
 * @param func the function to be executed
 * @param delay delay between executions
 * @returns the interval ID
 */
export function doSetInterval(func: () => void, delay: number) {
  func();
  return setInterval(func, delay);
}


/**
 * Represents a synchronizer, which guarantees non-overlapping execution of
 * all asynchronous functions executed through the `sync` method.
 */
export class Sync {
  private readonly queue: (() => Promise<any>)[];
  private ready: boolean;
  
  constructor() {
    this.queue = [];
    this.ready = true;
  }

  /**
   * Synchronize the execution of an asynchronous function.
   * 
   * @param func the function to execute synchronously
   * @returns asynchronous function return value
   */
  async sync<T>(func: () => Promise<T>): Promise<T> {
    return new Promise(async (resolve) => {
      this.queue.push(async () => { resolve(await func()) });
      await this.doQueue();
    });
  }

  private async doQueue(): Promise<void> {
    if (this.ready && this.queue.length > 0) {
      this.ready = false;
      while (this.queue.length > 0) {
        await (this.queue.shift())!();
      }
      this.ready = true;
    }
  }
}
