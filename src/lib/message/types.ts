import type { IConfiguration } from "@bouncer/config";
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
  CONFIG_GET = "config:get",
  CONFIG_UPDATE = "config:update",
}

/**
 * Represents a message sent from a page to Bouncer.
 */
export type ClientMessage =
    ClientStatusMessage
  | ClientPoliciesGetMessage
  | ClientPolicyCreateMessage
  | ClientPolicyUpdateMessage
  | ClientPolicyDeleteMessage
  | ClientPageResetMessage
  | ClientConfigGetMessage
  | ClientConfigUpdateMessage
  ;

export type FromFrame<T> = T & {
  tabId: number,
  frameId: number
}

export type FrameMessage = FromFrame<ClientMessage>;

export type ClientStatusMessage = {
  time: string,
  type: ClientMessageType.STATUS,
};

export type ClientPoliciesGetMessage = {
  type: ClientMessageType.POLICIES_GET,
};

export type ClientPolicyCreateMessage = {
  type: ClientMessageType.POLICY_CREATE,
  policy: PolicyData,
};

export type ClientPolicyUpdateMessage = {
  type: ClientMessageType.POLICY_UPDATE,
  id: string,
  policy: PolicyData,
};

export type ClientPolicyDeleteMessage = {
  type: ClientMessageType.POLICY_DELETE,
  id: string,
};

export type ClientPageResetMessage = {
  type: ClientMessageType.PAGE_RESET,
  id: string,
};

export type ClientConfigGetMessage = {
  type: ClientMessageType.CONFIG_GET,
}

export type ClientConfigUpdateMessage = {
  type: ClientMessageType.CONFIG_UPDATE,
  config: Partial<IConfiguration>,
}

export interface IControllerMessenger {
  send(tabId: number, frameId: number, message: ControllerMessage): void;
}

export enum ControllerMessageType {
  STATUS = "status",
  POLICIES_GET = "policies:get",
  CONFIG_GET = "config:get",
}

export type ControllerMessage =
    ControllerStatusMessage
  | ControllerPoliciesGetMessage
  | ControllerConfigGetMessage
  ;

/** Represents a message sent from Bouncer to a page. */
export type ControllerStatusMessage = {
  type: ControllerMessageType.STATUS,
  /** The access status of the page. */
  status: FrameStatus,
  /** The next time Bouncer recommends checking for a window-based update. */
  windowCheck?: string | undefined,
  /** The next time Bouncer recommends checking for a viewtime-based update. */
  viewtimeCheck?: string | undefined,
}

export type ControllerPoliciesGetMessage = {
  type: ControllerMessageType.POLICIES_GET,
  policies: { id: string, policy: PolicyData }[],
}

export type ControllerConfigGetMessage = {
  type: ControllerMessageType.CONFIG_GET,
  config: IConfiguration,
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
