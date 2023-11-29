export enum ActionTypes {
  LOGIN,
  LOGOUT,
  SUBSCRIBE,
  BROADCAST,
  LEAVE,
  DISCONNECT,
}

export interface CoreMessage<T> {
  type: ActionTypes;
  payload: T;
}

export interface BroadcastPayload {
  room: string;
  event: string;
  data: unknown;
}

export type DisconnectMessage = CoreMessage<string>;
export type SubscribeMessage = CoreMessage<string>;
export type BroadcastMessage = CoreMessage<BroadcastPayload>;
export type LeaveMessage = CoreMessage<string>;
