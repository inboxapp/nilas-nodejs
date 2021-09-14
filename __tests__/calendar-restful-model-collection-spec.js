import fetch from 'node-fetch';

import Nylas from '../src/nylas';
import NylasConnection from '../src/nylas-connection';

jest.mock('node-fetch', () => {
  const { Request, Response } = jest.requireActual('node-fetch');
  const fetch = jest.fn();
  fetch.Request = Request;
  fetch.Response = Response;
  return fetch;
});

describe('CalendarRestfulModelCollection', () => {
  let testContext;
  const testAccessToken = 'test-access-token';

  beforeEach(() => {
    Nylas.config({
      clientId: 'myClientId',
      clientSecret: 'myClientSecret',
      apiServer: 'https://api.nylas.com',
    });
    testContext = {};
    testContext.connection = new NylasConnection(testAccessToken, {
      clientId: 'myClientId',
    });
    jest.spyOn(testContext.connection, 'request');

    const response = {
      status: 200,
      buffer: () => {
        return Promise.resolve('body');
      },
      json: () => {
        return Promise.resolve(
          JSON.stringify({
            body: 'body',
          })
        );
      },
      headers: new Map(),
    };

    fetch.mockImplementation(() => Promise.resolve(response));
  });

  test('[FREE BUSY] should fetch results with params', done => {
    const response = {
      status: 200,
      buffer: () => {
        return Promise.resolve('body');
      },
      json: () => {
        return Promise.resolve(
          JSON.stringify([
            {
              object: 'free_busy',
              email: 'jane@email.com',
              time_slots: [
                {
                  object: 'time_slot',
                  status: 'busy',
                  start_time: 1590454800,
                  end_time: 1590780800,
                },
              ],
            },
          ])
        );
      },
      headers: new Map(),
    };
    fetch.mockImplementation(() => Promise.resolve(response));

    const params = {
      startTime: 1590454800,
      endTime: 1590780800,
      emails: ['jane@email.com'],
    };

    return testContext.connection.calendars.freeBusy(params).then(freeBusy => {
      const options = testContext.connection.request.mock.calls[0][0];
      expect(options.url.toString()).toEqual(
        'https://api.nylas.com/calendars/free-busy'
      );
      expect(options.method).toEqual('POST');
      expect(JSON.parse(options.body)).toEqual({
        start_time: '1590454800',
        end_time: '1590780800',
        emails: ['jane@email.com'],
      });
      expect(options.headers['authorization']).toEqual(
        `Basic ${Buffer.from(`${testAccessToken}:`, 'utf8').toString('base64')}`
      );
      expect(freeBusy.length).toEqual(1);
      freeBusy = freeBusy[0];
      expect(freeBusy.object).toEqual('free_busy');
      expect(freeBusy.email).toEqual('jane@email.com');
      expect(freeBusy.timeSlots.length).toEqual(1);
      const timeSlots = freeBusy.timeSlots[0];
      expect(timeSlots.object).toEqual('time_slot');
      expect(timeSlots.status).toEqual('busy');
      expect(timeSlots.startTime).toEqual(1590454800);
      expect(timeSlots.endTime).toEqual(1590780800);
      done();
    });
  });

  test('[AVAILABILITY] should fetch results with params', done => {
    const params = {
      startTime: '1590454800',
      endTime: '1590780800',
      interval: 5,
      duration: 30,
      emails: ['jane@email.com'],
      openHours: [
        {
          emails: ['swag@nylas.com'],
          days: ['0'],
          timezone: 'America/Chicago',
          start: '10:00',
          end: '14:00',
        },
      ],
    };

    return testContext.connection.calendars.availability(params).then(() => {
      const options = testContext.connection.request.mock.calls[0][0];
      expect(options.url.toString()).toEqual(
        'https://api.nylas.com/calendars/availability'
      );
      expect(options.method).toEqual('POST');
      expect(JSON.parse(options.body)).toEqual({
        start_time: '1590454800',
        end_time: '1590780800',
        interval_minutes: 5,
        duration_minutes: 30,
        emails: ['jane@email.com'],
        free_busy: [],
        open_hours: [
          {
            emails: ['swag@nylas.com'],
            days: ['0'],
            timezone: 'America/Chicago',
            start: '10:00',
            end: '14:00',
          },
        ],
      });
      expect(options.headers['authorization']).toEqual(
        `Basic ${Buffer.from(`${testAccessToken}:`, 'utf8').toString('base64')}`
      );
      done();
    });
  });

  test('[DELETE] should use correct route, method and auth', done => {
    const calendarId = 'id123';

    return testContext.connection.calendars.delete(calendarId).then(() => {
      const options = testContext.connection.request.mock.calls[0][0];
      expect(options.url.toString()).toEqual(
        `https://api.nylas.com/calendars/${calendarId}`
      );
      expect(options.method).toEqual('DELETE');
      expect(options.headers['authorization']).toEqual(
        `Basic ${Buffer.from(`${testAccessToken}:`, 'utf8').toString('base64')}`
      );
      done();
    });
  });
});
