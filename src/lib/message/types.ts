import type { IPolicy, PolicyData } from "@bouncer/policy";

export interface IClientMessenger {
  send(message: ClientMessage): void;
  addReceiver(listener: (message: ControllerMessage) => void): void;
  removeReceiver(listener: (message: ControllerMessage) => void): void;
}

export enum ClientMessageType {
  STATUS = "status",
  POLICIES_GET = "policies:get",
  POLICY_CREATE = "policy:create",
  POLICY_UPDATE = "policy:update",
  POLICY_DELETE = "policy:delete",
  PAGE_RESET = "page:reset",
}

/**
 * Represents a message sent from a page to Bouncer.
 */
export type ClientMessage =
    StatusMessage
  | PoliciesGetMessage
  | PolicyCreateMessage
  | PolicyUpdateMessage
  | PolicyDeleteMessage
  | PageResetMessage
  ;

export type FromFrame<T> = T & {
  tabId: number,
  frameId: number
}

export type FrameMessage = FromFrame<ClientMessage>;

export type StatusMessage = {
  time: Date,
  type: ClientMessageType.STATUS,
};

export type PoliciesGetMessage = {
  type: ClientMessageType.POLICIES_GET,
};

export type PolicyCreateMessage = {
  type: ClientMessageType.POLICY_CREATE,
  policy: PolicyData,
};

export type PolicyUpdateMessage = {
  type: ClientMessageType.POLICY_UPDATE,
  id: string,
  policy: PolicyData,
};

export type PolicyDeleteMessage = {
  type: ClientMessageType.POLICY_UPDATE,
  id: string,
  policy: PolicyData,
};

export type PageResetMessage = {
  type: ClientMessageType.PAGE_RESET,
  id: string,
};

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
