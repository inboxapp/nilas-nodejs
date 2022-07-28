import { Request, Response, Router } from 'express';
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
import {
  BuildAuthUrl,
  ExchangeCodeForToken,
  Routes,
  VerifyWebhookSignature,
} from '../services/routes';

type Middleware = Router;
type ServerRequest = Request;
type ServerResponse = Response;
type ExchangeMailboxTokenCallback = (
  accessToken: AccessToken,
  res: ServerResponse
) => void;
type CsrfTokenExchangeOptions = {
  generateCsrfToken: (req: ServerRequest) => Promise<string>;
  validateCsrfToken: (
    csrfToken: string,
    req: ServerRequest
  ) => Promise<boolean>;
};

export type ServerBindingOptions = {
  defaultScopes: Scope[];
  exchangeMailboxTokenCallback: ExchangeMailboxTokenCallback;
  csrfTokenExchangeOpts?: CsrfTokenExchangeOptions;
  clientUri?: string;
};

export abstract class ServerBinding extends EventEmitter
  implements ServerBindingOptions {
  nylasClient: Nylas;
  defaultScopes: Scope[];
  exchangeMailboxTokenCallback: ExchangeMailboxTokenCallback;
  csrfTokenExchangeOpts?: CsrfTokenExchangeOptions;
  clientUri?: string;

  static NYLAS_SIGNATURE_HEADER = 'x-nylas-signature';
  protected buildAuthUrl: BuildAuthUrl;
  protected exchangeCodeForToken: ExchangeCodeForToken;
  protected verifyWebhookSignature: VerifyWebhookSignature;
  private _untypedOn = this.on;
  private _untypedEmit = this.emit;

  protected constructor(nylasClient: Nylas, options: ServerBindingOptions) {
    super();
    this.nylasClient = nylasClient;
    this.defaultScopes = options.defaultScopes;
    this.exchangeMailboxTokenCallback = options.exchangeMailboxTokenCallback;
    this.csrfTokenExchangeOpts = options.csrfTokenExchangeOpts;
    this.clientUri = options.clientUri;
    ({
      buildAuthUrl: this.buildAuthUrl,
      exchangeCodeForToken: this.exchangeCodeForToken,
      verifyWebhookSignature: this.verifyWebhookSignature,
    } = Routes(nylasClient));
  }

  abstract buildMiddleware(): Middleware;

  // Taken from the best StackOverflow answer of all time https://stackoverflow.com/a/56228127
  public on = <K extends WebhookTriggers>(
    event: K,
    listener: (payload: WebhookDelta) => void
  ): this => this._untypedOn(event, listener);

  public emit = <K extends WebhookTriggers>(
    event: K,
    payload: WebhookDelta
  ): boolean => this._untypedEmit(event, payload);

  /**
   * Emit all incoming delta events
   * @param deltas The list of delta JSON objects
   */
  emitDeltaEvents(deltas: Record<string, unknown>[]): void {
    deltas.forEach(d => this.handleDeltaEvent(new WebhookDelta().fromJSON(d)));
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
}
