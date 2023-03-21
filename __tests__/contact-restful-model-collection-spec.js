import fetch from 'node-fetch';

import Nylas from '../src/nylas';
import { Group } from '../src/models/contact';

jest.mock('node-fetch', () => {
  const { Request, Response } = jest.requireActual('node-fetch');
  const fetch = jest.fn();
  fetch.Request = Request;
  fetch.Response = Response;
  return fetch;
});

describe('RestfulModelCollection', () => {
  let testContext;
  const testGrantId = 'test-grant-id';
  const testApiKey = 'test-api-key'
  beforeEach(() => {
    const nylasClient = new Nylas({
      clientId: 'myClientId',
      clientSecret: 'myClientSecret',
      apiServer: 'https://api.nylas.com',
      apiKey: testApiKey
    });
    testContext = {};
    testContext.connection = nylasClient.with(testGrantId);
    jest.spyOn(testContext.connection, 'request');

    const contactJSON = [
      {
        account_id: 'account123',
        id: 'group123',
        object: 'contact_group',
        name: 'name123',
        path: 'path123',
      },
    ];

    const response = {
      status: 200,
      text: () => {
        return Promise.resolve(JSON.stringify(contactJSON));
      },
      headers: new Map(),
    };

    fetch.mockImplementation(() => Promise.resolve(response));
  });

  describe('groups', () => {
    test('should call API with correct authentication', done => {
      expect.assertions(3);

      return testContext.connection.contacts.groups().then(() => {
        const options = testContext.connection.request.mock.calls[0][0];
        expect(options.url.toString()).toEqual(
          `https://api.nylas.com/grants/${testGrantId}/contacts/groups`
        );
        expect(options.method).toEqual('GET');
        expect(options.headers['authorization']).toEqual(
          `Basic ${Buffer.from(`${testApiKey}:`, 'utf8').toString(
            'base64'
          )}`
        );
        done();
      });
    });

    const evaluateContactGroup = data => {
      expect(data[0].accountId).toBe('account123');
      expect(data[0].id).toBe('group123');
      expect(data[0].object).toBe('contact_group');
      expect(data[0].name).toBe('name123');
      expect(data[0].path).toBe('path123');
      expect(data[0] instanceof Group).toBe(true);
    };

    test('should call callback', done => {
      expect.assertions(7);
      const testCallback = (err, data) => {
        expect(err).toBe(null);
        evaluateContactGroup(data);
        done();
      };

      return testContext.connection.contacts.groups(testCallback);
    });

    test('should resolve to group object', done => {
      expect.assertions(6);
      return testContext.connection.contacts.groups().then(data => {
        evaluateContactGroup(data);
        done();
      });
    });
  });
});
