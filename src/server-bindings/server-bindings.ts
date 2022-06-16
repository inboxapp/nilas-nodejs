import { Response } from 'express';
import { Scope } from '../models/connect';
import { EventEmitter } from 'events';
import { WebhookTriggers } from '../models/webhook';
import { WebhookDeltaProperties } from '../models/webhook-notification';
import AccessToken from '../models/access-token';
import Nylas from '../nylas';

export enum ServerEvents {
  TokenExchange = 'token-exchange',
}

export type ServerBindingOptions = {
  defaultScopes: Scope[];
  routePrefix?: string;
  clientUri?: string;
};

export abstract class ServerBinding extends EventEmitter
  implements ServerBindingOptions {
  nylasClient: Nylas;
  defaultScopes: Scope[];
  routePrefix?: string;
  clientUri?: string;
  static DEFAULT_ROUTE_PREFIX = '/nylas';
  private _untypedOn = this.on;
  private _untypedEmit = this.emit;

  protected constructor(nylasClient: Nylas, options: ServerBindingOptions) {
    super();
    this.nylasClient = nylasClient;
    this.defaultScopes = options.defaultScopes;
    this.routePrefix = options.routePrefix;
    this.clientUri = options.clientUri;
  }

  // Taken from the best StackOverflow answer of all time https://stackoverflow.com/a/56228127
  public on = <K extends WebhookTriggers | ServerEvents>(
    event: K,
    listener: (
      payload: K extends WebhookTriggers
        ? WebhookDeltaProperties
        : { accessTokenObj: AccessToken; res: Response }
    ) => void
  ): this => this._untypedOn(event, listener);

  public emit = <K extends WebhookTriggers | ServerEvents>(
    event: K,
    payload: K extends WebhookTriggers
      ? WebhookDeltaProperties
      : { accessTokenObj: AccessToken; res: Response }
  ): boolean => this._untypedEmit(event, payload);

  protected buildRoute(path: string): string {
    const prefix = this.routePrefix
      ? this.routePrefix
      : ServerBinding.DEFAULT_ROUTE_PREFIX;
    return prefix + path;
  }
}
