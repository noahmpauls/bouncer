import type { IConfiguration } from "@bouncer/config";
import type { PolicyData } from "@bouncer/policy";

/** Represents a message sender and handler for a Bouncer client. */
export interface IClientMessenger {
  /**
   * Send a message to the Bouncer controller.
   * 
   * @param message the message to send
   */
  send(message: ClientMessage): void;

  /**
   * Add a listener for controller messages.
   * 
   * @param listener
   */
  addReceiver(listener: (message: ControllerMessage) => void): void;

  /**
   * Remove a controller message listener.
   * 
   * @param listener
   */
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

/** Represents a message sent from a page to Bouncer. */
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

/** Represents a type associated with a particular frame. */
export type FromFrame<T> = T & {
  tabId: number,
  frameId: number
}

/** Represents a client message sent from a particular frame. */
export type FrameMessage = FromFrame<ClientMessage>;

/** Get a frame's status. */
export type ClientStatusMessage = {
  type: ClientMessageType.STATUS,
  // TODO: remove this field, use IClock in Controller
  /** ISO timestamp of the status message send time */
  time: string,
};

/** Get all policies. */
export type ClientPoliciesGetMessage = {
  type: ClientMessageType.POLICIES_GET,
};

/** Create a policy. */
export type ClientPolicyCreateMessage = {
  type: ClientMessageType.POLICY_CREATE,
  /** Policy to create. */
  policy: PolicyData,
};

/** Update an existing policy. */
export type ClientPolicyUpdateMessage = {
  type: ClientMessageType.POLICY_UPDATE,
  /** ID of policy to update. */
  id: string,
  /** Updated policy. */
  policy: PolicyData,
};

/** Delete a policy. */
export type ClientPolicyDeleteMessage = {
  type: ClientMessageType.POLICY_DELETE,
  /** ID of policy to delete. */
  id: string,
};

/** Reset a policy's page. */
export type ClientPageResetMessage = {
  type: ClientMessageType.PAGE_RESET,
  /** ID of policy whose page should be reset. */
  id: string,
};

/** Get Bouncer's configuration. */
export type ClientConfigGetMessage = {
  type: ClientMessageType.CONFIG_GET,
}

/** Update Bouncer's configuration. */
export type ClientConfigUpdateMessage = {
  type: ClientMessageType.CONFIG_UPDATE,
  /** Configuration updates. */
  config: Partial<IConfiguration>,
}

/**
 * Represents a sender of messages from the Bouncer controller to frames.
 */
export interface IControllerMessenger {
  /**
   * Send a message to a frame.
   * 
   * @param tabId recipient tab ID
   * @param frameId recipient frame ID
   * @param message message to send
   */
  send(tabId: number, frameId: number, message: ControllerMessage): void;
}

export enum ControllerMessageType {
  STATUS = "status",
  POLICIES_GET = "policies:get",
  CONFIG_GET = "config:get",
}

/** Represents a message sent from Bouncer to a page. */
export type ControllerMessage =
    ControllerStatusMessage
  | ControllerPoliciesGetMessage
  | ControllerConfigGetMessage
  ;

// TODO: clean this type up; only send check times on ALLOWED
/** Send the status of a frame. */
export type ControllerStatusMessage = {
  type: ControllerMessageType.STATUS,
  /** The access status of the page. */
  status: FrameStatus,
  /** ISO timestamp of the next recommended window-based check. */
  windowCheck?: string | undefined,
  /** ISO timestamp of the next recommended viewtime-based check. */
  viewtimeCheck?: string | undefined,
}

/** Send all policies. */
export type ControllerPoliciesGetMessage = {
  type: ControllerMessageType.POLICIES_GET,
  policies: { id: string, policy: PolicyData }[],
}

/** Send Bouncer's configuration. */
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
