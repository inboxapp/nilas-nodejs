import RestfulModelCollection from './restful-model-collection';
import NylasConnection from '../nylas-connection';
import Scheduler, { SchedulerProperties } from './scheduler';
import SchedulerTimeSlot from './scheduler-time-slot';
import SchedulerBookingRequest, {
  SchedulerBookingConfirmation,
} from './scheduler-booking-request';
import { RestfulQuery } from './model-collection';

export type ProviderAvailability = {
  busy: [
    {
      end: number;
      start: number;
    }
  ];
  email: string;
  name: string;
};

export default class SchedulerRestfulModelCollection extends RestfulModelCollection<
  Scheduler
> {
  connection: NylasConnection;
  modelClass: typeof Scheduler;
  baseUrl: string;

  constructor(connection: NylasConnection) {
    super(Scheduler, connection);
    this.baseUrl = 'https://api.schedule.nylas.com';
    this.connection = connection;
    this.modelClass = Scheduler;
  }

  create(
    props: SchedulerProperties,
    callback?: (error: Error | null, result?: Scheduler) => void
  ): Promise<Scheduler> {
    return new Scheduler(this.connection, props).save(callback);
  }

  list(
    params: RestfulQuery,
    callback?: (error: Error | null, obj?: Scheduler[]) => void
  ): Promise<Scheduler[]> {
    return super.list(params, callback);
  }

  getGoogleAvailability(): Promise<ProviderAvailability> {
    return this.connection.request({
      method: 'GET',
      path: '/schedule/availability/google',
      headers: {
        'Content-Type': 'application/json',
      },
      baseUrl: this.baseUrl,
    });
  }

  getOffice365Availability(): Promise<ProviderAvailability> {
    return this.connection.request({
      method: 'GET',
      path: '/schedule/availability/o365',
      headers: {
        'Content-Type': 'application/json',
      },
      baseUrl: this.baseUrl,
    });
  }

  getPageBySlug(slug: string): Promise<Scheduler> {
    return this.connection
      .request({
        method: 'GET',
        path: `/schedule/${slug}/info`,
        headers: {
          'Content-Type': 'application/json',
        },
        baseUrl: this.baseUrl,
      })
      .then(json => {
        return Promise.resolve(new Scheduler(this.connection).fromJSON(json));
      });
  }

  getAvailableTimeSlots(slug: string): Promise<SchedulerTimeSlot[]> {
    return this.connection
      .request({
        method: 'GET',
        path: `/schedule/${slug}/timeslots`,
        headers: {
          'Content-Type': 'application/json',
        },
        baseUrl: this.baseUrl,
      })
      .then(json => {
        const timeslots: SchedulerTimeSlot[] = json.map(
          (timeslot: Record<string, any>) => {
            return new SchedulerTimeSlot().fromJSON(timeslot);
          }
        );
        return Promise.resolve(timeslots);
      });
  }

  bookTimeSlot(
    slug: string,
    bookingRequest: SchedulerBookingRequest
  ): Promise<SchedulerBookingConfirmation> {
    return this.connection
      .request({
        method: 'POST',
        path: `/schedule/${slug}/timeslots`,
        headers: {
          'Content-Type': 'application/json',
        },
        body: bookingRequest.toJSON(),
        baseUrl: this.baseUrl,
      })
      .then(json => {
        return Promise.resolve(
          new SchedulerBookingConfirmation().fromJSON(json)
        );
      });
  }

  cancelBooking(
    slug: string,
    editHash: string,
    reason: string
  ): Record<string, any> {
    return this.connection
      .request({
        method: 'POST',
        path: `/schedule/${slug}/${editHash}/cancel`,
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          reason: reason,
        },
        baseUrl: this.baseUrl,
      })
      .then(json => {
        return Promise.resolve(json);
      });
  }

  confirmBooking(
    slug: string,
    editHash: string
  ): Promise<SchedulerBookingConfirmation> {
    return this.connection
      .request({
        method: 'POST',
        path: `/schedule/${slug}/${editHash}/confirm`,
        headers: {
          'Content-Type': 'application/json',
        },
        body: {},
        baseUrl: this.baseUrl,
      })
      .then(json => {
        return Promise.resolve(
          new SchedulerBookingConfirmation().fromJSON(json)
        );
      });
  }
}
