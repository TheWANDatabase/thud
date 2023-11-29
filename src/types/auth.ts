import { type CoreMessage } from "./core";

export enum AuthTypes {
  NONE = "none",
}

export enum AuthResults {
  SUCCESS = "success",
  FAILURE = "failure",
}

export type AuthMessage = CoreMessage<AuthTypes>;
export type AuthResponse = CoreMessage<AuthResults>;
