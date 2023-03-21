import Nylas from '../src/nylas';
import fetch from 'node-fetch';
import Folder from '../src/models/folder';

jest.mock('node-fetch', () => {
  const { Request, Response } = jest.requireActual('node-fetch');
  const fetch = jest.fn();
  fetch.Request = Request;
  fetch.Response = Response;
  return fetch;
});

describe('Label', () => {
  let testContext;
  const testGrantId = '123';
  beforeEach(() => {
    const nylasClient = new Nylas({
      clientId: 'myClientId',
      clientSecret: 'myClientSecret',
      apiServer: 'https://api.nylas.com',
    });
    testContext = {};
    testContext.connection = nylasClient.with(testGrantId);
    jest.spyOn(testContext.connection, 'request');

    const response = receivedBody => {
      return {
        status: 200,
        text: () => {
          return Promise.resolve(JSON.stringify(receivedBody));
        },
        headers: new Map(),
      };
    };

    fetch.mockImplementation(req => Promise.resolve(response(req.body)));
    testContext.folder = new Folder(testContext.connection);
    testContext.folder.displayName = 'Folder display name';
    testContext.folder.name = 'Folder name';
  });

  describe('save', () => {
    test('should do a POST request if id is undefined', done => {
      return testContext.folder.save().then(() => {
        const options = testContext.connection.request.mock.calls[0][0];
        expect(options.url.toString()).toEqual(
          `https://api.nylas.com/grants/${testGrantId}/folders`
        );
        expect(options.method).toEqual('POST');
        expect(JSON.parse(options.body)).toEqual({
          display_name: 'Folder display name',
          name: 'Folder name',
        });
        done();
      });
    });

    test('should do a PUT if id is defined', done => {
      testContext.folder.id = 'folder_id';
      testContext.folder.displayName = 'Updated display name';
      return testContext.folder.save().then(() => {
        const options = testContext.connection.request.mock.calls[0][0];
        expect(options.url.toString()).toEqual(
          `https://api.nylas.com/grants/${testGrantId}/folders/folder_id`
        );
        expect(options.method).toEqual('PUT');
        expect(JSON.parse(options.body)).toEqual({
          display_name: 'Updated display name',
          name: 'Folder name',
        });
        done();
      });
    });
  });

  describe('delete', () => {
    test('should do a DELETE if delete is requested', done => {
      return testContext.connection.folders.delete('folder_id').then(() => {
        const options = testContext.connection.request.mock.calls[0][0];
        expect(options.url.toString()).toEqual(
          `https://api.nylas.com/grants/${testGrantId}/folders/folder_id`
        );
        expect(options.method).toEqual('DELETE');
        done();
      });
    });
  });
});
