import { ClientEvents } from "discord.js";
import Core from "@core";

type EventOptions<K extends keyof ClientEvents> = {
  event: K;
  execute: (this: Core, ...args: ClientEvents[K]) => Promise<void>;
};

export type ExecEventFunction = (...args: any[]) => Promise<void>;

export class EventBuilder<K extends keyof ClientEvents> {
  private _event: K;
  private _exec: (this: Core, ...args: ClientEvents[K]) => Promise<void>;

  /** @readonly */
  get event() {
    return this._event;
  }
  /** @readonly */
  get execute() {
    return this._exec;
  }

  setExecute(fn: Function) {
    this._exec = fn as (this: Core, ...args: ClientEvents[K]) => Promise<void>;
    return this;
  }

  constructor(options: EventOptions<K>) {
    this._event = options.event;
    this._exec = options.execute;
  }
}

export default EventBuilder;
