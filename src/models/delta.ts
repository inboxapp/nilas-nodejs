import NylasConnection from '../nylas-connection';
import DeltaStream from './delta-stream';

export type LatestCursor = {
  cursor: string;
}

export default class Delta {
  connection: NylasConnection;
  static streamingTimeoutMs = 15000;

  constructor(connection: NylasConnection) {
    this.connection = connection;
    if (!(this.connection instanceof NylasConnection)) {
      throw new Error('Connection object not provided');
    }
  }

  latestCursor(callback: (error: Error | null, cursor: string | null) => void): Promise<LatestCursor> {
    const reqOpts = {
      method: 'POST',
      path: '/delta/latest_cursor',
    };

    return this.connection
      .request(reqOpts)
      .then((response: LatestCursor) => {
        if (callback) {
          callback(null, response.cursor);
        }
        return Promise.resolve(response);
      })
      .catch(err => {
        if (callback) {
          callback(err, null);
        }
        return Promise.reject(err);
      });
  }

  async startStream(cursor: string, params: { [key: string]: any } = {}): Promise<DeltaStream> {
    const stream = new DeltaStream(this.connection, cursor, params);
    await stream.open();
    return stream;
  }
}
