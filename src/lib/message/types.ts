export interface IClientMessenger {
  send(message: ClientMessage): void;
  addReceiver(listener: (message: ControllerMessage) => void): void;
  removeReceiver(listener: (message: ControllerMessage) => void): void;
}

/**
 * Represents a message sent from a page to Bouncer.
 */
export type FrameMessage = {
  /** Type of message to send. */
  type: ClientMessageType.CHECK,
  /** Time of message. */
  time: Date,
}

export type ClientMessage = {
  type: ClientMessageType,
  time: Date,
}

/**
 * Represents the type of a page message.
 */
export enum ClientMessageType {
  /** Check the status of the current page. */
  CHECK = "check",
}

export interface IControllerMessenger {
  send(tabId: number, frameId: number, message: ControllerMessage): void;
}

/** Represents a message sent from Bouncer to a page. */
export type ControllerMessage = {
  /** The access status of the page. */
  status: FrameStatus,
  /** The next time Bouncer recommends checking for a window-based update. */
  windowCheck?: Date | undefined,
  /** The next time Bouncer recommends checking for a viewtime-based update. */
  viewtimeCheck?: Date | undefined,
}

/** 
 * Represents the status of a frame as seen by Bouncer.
 */
export enum FrameStatus {
  /** Bouncer does not track the frame. */
  UNTRACKED = "untracked",
  /** Bouncer has blocked the frame. */
  ALLOWED = "allowed",
  /** Bouner allows the frame. */
  BLOCKED = "blocked",
}
