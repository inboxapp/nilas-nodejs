import crypto from 'crypto';
import { Response, Router } from 'express';
import { Scope } from '../models/connect';
import { EventEmitter } from 'events';
import Webhook, { WebhookTriggers } from '../models/webhook';
import { WebhookDelta } from '../models/webhook-notification';
import AccessToken from '../models/access-token';
import Nylas from '../nylas';
import {
  openWebhookTunnel,
  OpenWebhookTunnelOptions,
} from '../services/tunnel';

type Middleware = Router;

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
  static NYLAS_SIGNATURE_HEADER = 'x-nylas-signature';
  private _untypedOn = this.on;
  private _untypedEmit = this.emit;

  protected constructor(nylasClient: Nylas, options: ServerBindingOptions) {
    super();
    this.nylasClient = nylasClient;
    this.defaultScopes = options.defaultScopes;
    this.routePrefix = options.routePrefix;
    this.clientUri = options.clientUri;
  }

  abstract buildMiddleware(): Middleware;

  // Taken from the best StackOverflow answer of all time https://stackoverflow.com/a/56228127
  public on = <K extends WebhookTriggers | ServerEvents>(
    event: K,
    listener: (
      payload: K extends WebhookTriggers
        ? WebhookDelta
        : { accessTokenObj: AccessToken; res: Response }
    ) => void
  ): this => this._untypedOn(event, listener);

  public emit = <K extends WebhookTriggers | ServerEvents>(
    event: K,
    payload: K extends WebhookTriggers
      ? WebhookDelta
      : { accessTokenObj: AccessToken; res: Response }
  ): boolean => this._untypedEmit(event, payload);

  /**
   * Verify incoming webhook signature came from Nylas
   * @param xNylasSignature The signature to verify
   * @param rawBody The raw body from the payload
   * @return true if the webhook signature was verified from Nylas
   */
  verifyWebhookSignature(
    xNylasSignature: string,
    rawBody: Buffer
  ): boolean {
    const digest = crypto
      .createHmac('sha256', this.nylasClient.clientSecret)
      .update(rawBody)
      .digest('hex');
    return digest === xNylasSignature;
  }

  /**
   * Start a local development websocket to get webhook events
   * @param webhookTunnelConfig Optional configuration for setting region, triggers, and overriding callbacks
   * @return The webhook details response from the API
   */
  startDevelopmentWebsocket(
    webhookTunnelConfig?: Partial<OpenWebhookTunnelOptions>
  ): Promise<Webhook> {
    /* eslint-disable no-console */
    const defaultOnClose = (): void =>
      console.log('Nylas websocket client connection closed');
    const defaultOnConnectFail = (e: Error): void =>
      console.log('Failed to connect Nylas websocket client', e.message);
    const defaultOnError = (e: Error): void =>
      console.log('Error in Nylas websocket client', e.message);
    const defaultOnConnect = (): void =>
      console.log('Nylas websocket client connected');
    /* eslint-enable no-console */

    return openWebhookTunnel(this.nylasClient, {
      onMessage: webhookTunnelConfig?.onMessage || this.handleDeltaEvent,
      onClose: webhookTunnelConfig?.onClose || defaultOnClose,
      onConnectFail: webhookTunnelConfig?.onConnectFail || defaultOnConnectFail,
      onError: webhookTunnelConfig?.onError || defaultOnError,
      onConnect: webhookTunnelConfig?.onConnect || defaultOnConnect,
      region: webhookTunnelConfig?.region,
      triggers: webhookTunnelConfig?.triggers,
    });
  }

  /**
   * Delta event processor to be used either by websocket or webhook
   * @param d The delta event
   */
  protected handleDeltaEvent = (d: WebhookDelta): void => {
    d.type && this.emit(d.type as WebhookTriggers, d);
  };

  /**
   * Builds the full route with a path
   * @param path The path to append
   * @return The full route
   */
  protected buildRoute(path: string): string {
    const prefix = this.routePrefix
      ? this.routePrefix
      : ServerBinding.DEFAULT_ROUTE_PREFIX;
    return prefix + path;
  }
}
