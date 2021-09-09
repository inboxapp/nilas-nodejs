import NylasConnection from '../nylas-connection';
import Model from './model';
import Attributes from './attributes';
import Account from './account';

export interface VirtualCalendarProperties {
  clientId: string;
  scopes: string;
  email: string;
  name: string;
  settings?: { [key: string]: string };
}

export class VirtualCalendar extends Model implements VirtualCalendarProperties {
  provider = 'nylas';
  clientId = '';
  scopes = '';
  email = '';
  name = '';
  settings?: { [key: string]: string };

  constructor(props?: VirtualCalendarProperties) {
    super();
    super.initAttributes(props);
  }
}
VirtualCalendar.attributes = {
  provider: Attributes.String({
    modelKey: 'provider',
  }),
  clientId: Attributes.String({
    modelKey: 'clientId',
    jsonKey: 'client_id',
  }),
  scopes: Attributes.String({
    modelKey: 'scopes',
  }),
  email: Attributes.String({
    modelKey: 'email',
  }),
  name: Attributes.String({
    modelKey: 'name',
  }),
  settings: Attributes.Object({
    modelKey: 'settings',
  }),
}

export enum Scopes {
  EmailModify = "email.modify",
  EmailReadOnly = "email.read_only",
  EmailSend = "email.send",
  EmailFoldersAndLabels = "email.folders_and_labels",
  EmailMetadata = "email.metadata",
  EmailDrafts = "email.drafts",
  Calendar = "calendar",
  CalendarReadOnly = "calendar.read_only",
  RoomResourcesReadOnly = "room_resources.read_only",
  Contacts = "contacts",
  ContactsReadOnly = "contacts.read_only"
}

export enum NativeAuthenticationProvider {
  Gmail = "gmail",
  Yahoo = "yahoo",
  Exchange = "exchange",
  Outlook = "outlook",
  Imap = "imap",
  Icloud = "icloud",
  Hotmail = "hotmail",
  Aol = "aol",
  Office365 = "office365"
}

export interface NativeAuthenticationProperties {
  clientId: string;
  name: string;
  emailAddress: string;
  provider: NativeAuthenticationProvider;
  scopes: Scopes[];
  settings?: { [key: string]: string };
}

type AuthorizationCode = {
  code: string;
}

export class NativeAuthentication extends Model implements NativeAuthenticationProperties {
  clientId = '';
  name = '';
  emailAddress = '';
  provider = NativeAuthenticationProvider.Gmail;
  scopes: Scopes[] = [];
  settings?: { [key: string]: string };

  constructor(props?: NativeAuthenticationProperties) {
    super();
    this.initAttributes(props);
  }

  toJSON(): any {
    const json = super.toJSON();
    json["scopes"] = this.scopes.join();
    return json;
  }
}

export default class Connect {
  connection: NylasConnection;
  clientId: string;
  clientSecret: string;

  constructor(
    connection: NylasConnection,
    clientId: string,
    clientSecret: string
  ) {
    this.connection = connection;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  authorize(auth: VirtualCalendarProperties | NativeAuthenticationProperties): Promise<AuthorizationCode> {
    // https://docs.nylas.com/reference#connectauthorize
    if (!this.clientId) {
      throw new Error(
        'connect.authorize() cannot be called until you provide a clientId via Nylas.config()'
      );
    }

    let authClass: VirtualCalendar | NativeAuthentication;
    if(auth.hasOwnProperty("scope")) {
      authClass = new NativeAuthentication(auth as NativeAuthenticationProperties);
    } else {
      authClass = new VirtualCalendar(auth as VirtualCalendarProperties);
    }

    return this.connection.request({
      method: 'POST',
      path: '/connect/authorize',
      body: authClass.toJSON(),
    }).then((json: AuthorizationCode) => {
      return json;
    });
  }

  token(code: string): Promise<Account> {
    // https://docs.nylas.com/reference#connecttoken
    if (!this.clientId) {
      throw new Error(
        'connect.token() cannot be called until you provide a clientId via Nylas.config()'
      );
    }
    if (!this.clientSecret) {
      throw new Error(
        'connect.token() cannot be called until you provide a clientSecret via Nylas.config()'
      );
    }
    return this.connection.request({
      method: 'POST',
      path: '/connect/token',
      body: {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
      },
    }).then(json => {
      return new Account(this.connection).fromJSON(json);
    });
  }
}
