import APIClient from './apiClient';
import { NylasConfig, DEFAULT_SERVER_URL } from './config';
import { Calendars } from './resources/calendars';
import { Events } from './resources/events';
import { Auth } from './resources/auth';
import { Webhooks } from './resources/webhooks';
import { Applications } from './resources/applications';

export default class Nylas {
  public applications: Applications;
  public auth: Auth;
  public calendars: Calendars;
  public events: Events;
  public webhooks: Webhooks;

  apiClient: APIClient;

  constructor(config: NylasConfig) {
    this.apiClient = new APIClient({
      apiKey: config.apiKey,
      serverUrl: config.serverUrl || DEFAULT_SERVER_URL,
      timeout: config.timeout || 30,
    });

    this.applications = new Applications(this.apiClient);
    this.auth = new Auth(this.apiClient);
    this.calendars = new Calendars(this.apiClient);
    this.events = new Events(this.apiClient);
    this.webhooks = new Webhooks(this.apiClient);

    return this;
  }
}
