import { Overrides } from '../config';
import {
  Availability,
  AvailabilitySchema,
  Calendar,
  CalendarSchema,
  CreateCalenderRequestBody,
  GetAvailabilityRequestBody,
  ListCalendersQueryParams,
  UpdateCalenderRequestBody,
} from '../schema/calendars';
import { List, Response } from '../schema/response';
import { BaseResource } from './baseResource';

interface FindCalendarParams {
  calendarId: string;
  identifier: string;
}
interface ListCalendersParams {
  identifier: string;
  queryParams?: ListCalendersQueryParams;
}

interface CreateCalendarParams {
  identifier: string;
  requestBody: CreateCalenderRequestBody;
}

interface UpdateCalendarParams {
  calendarId: string;
  identifier: string;
  requestBody: UpdateCalenderRequestBody;
}

interface DestroyCalendarParams {
  identifier: string;
  calendarId: string;
}

interface GetAvailabilityParams {
  identifier: string;
  requestBody: GetAvailabilityRequestBody;
}

export class Calendars extends BaseResource {
  public async getAvailability({
    identifier,
    requestBody,
    overrides,
  }: GetAvailabilityParams & Overrides): Promise<Response<Availability>> {
    const res = await this.apiClient.request<Response<Availability>>(
      {
        method: 'POST',
        path: `/v3/grants/${identifier}/calendars/availability`,
        body: requestBody,
        overrides,
      },
      {
        responseSchema: AvailabilitySchema,
      }
    );

    return res;
  }

  public async list({
    identifier,
    queryParams,
    overrides,
  }: ListCalendersParams & Overrides): Promise<List<Calendar>> {
    return super._list<Calendar>({
      queryParams,
      overrides,
      path: `/v3/grants/${identifier}/calendars`,
      responseSchema: CalendarSchema,
    });
  }

  public async find({
    calendarId,
    identifier,
    overrides,
  }: FindCalendarParams & Overrides): Promise<Response<Calendar>> {
    const res = await this.apiClient.request<Response<Calendar>>(
      {
        method: 'GET',
        path: `/v3/grants/${identifier}/calendars/${calendarId}`,
        overrides,
      },
      {
        responseSchema: CalendarSchema,
      }
    );

    return res;
  }

  public async create({
    identifier,
    requestBody,
    overrides,
  }: CreateCalendarParams & Overrides): Promise<Response<Calendar>> {
    const res = await this.apiClient.request<Response<Calendar>>(
      {
        method: 'POST',
        path: `/v3/grants/${identifier}/calendars`,
        body: requestBody,
        overrides,
      },
      {
        responseSchema: CalendarSchema,
      }
    );
    return res;
  }

  public async update({
    calendarId,
    identifier,
    requestBody,
    overrides,
  }: UpdateCalendarParams & Overrides): Promise<Response<Calendar>> {
    const res = await this.apiClient.request<Response<Calendar>>(
      {
        method: 'PUT',
        path: `/v3/grants/${identifier}/calendars/${calendarId}`,
        body: requestBody,
        overrides,
      },
      {
        responseSchema: CalendarSchema,
      }
    );

    return res;
  }

  public async destroy({
    identifier,
    calendarId,
    overrides,
  }: DestroyCalendarParams & Overrides): Promise<null> {
    const res = await this.apiClient.request<null>(
      {
        method: 'DELETE',
        path: `/v3/grants/${identifier}/calendars/${calendarId}`,
        overrides,
      },
      {}
    );

    return res;
  }
}
