/**
 * Represents recent browsing activity as seen by a controller.
 */
export class BrowseActivity {
  private _started: boolean;
  private _latest: Date | undefined;

  /**
   * @param started whether a browse session has started
   * @param latest last time activity was recorded
   */
  constructor(
    started: boolean,
    latest: Date | undefined,
  ) {
    this._started = started;
    this._latest = latest;
  }

  /**
   * Create an instance from a data representation.
   * 
   * @param obj data representation
   * @returns deserialized instance
   */
  static fromObject = (obj: BrowseActivityData): BrowseActivity => {
    return new BrowseActivity(
      obj.started,
      obj.latest !== undefined ? new Date(obj.latest) : undefined,
    );
  }

  /** Whether a browse session has started. */
  started = () => this._started;

  /** Last time activity was recorded. */
  latest = () => this._latest;

  /**
   * Record browse activity.
   * 
   * @param time time when the activity happened
   */
  track = (time: Date) => {
    this._started = true;
    if (this._latest === undefined || this._latest < time) {
      this._latest = time;
    }
  }

  /**
   * Convery this instance to its data representation.
   * 
   * @returns data representation
   */
  toObject = (): BrowseActivityData => {
    return {
      started: this._started,
      latest: this._latest?.toISOString(),
    };
  }
}

type BrowseActivityData = {
  started: boolean,
  latest: string | undefined,
}
