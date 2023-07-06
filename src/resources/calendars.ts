import { Overrides } from '../config';
import {
  Calendar,
  CreateCalenderRequestBody,
  ListCalendersQueryParams,
  UpdateCalenderRequestBody,
} from '../models/calendars';
import { DeleteResponse, Response, ListResponse } from '../models/response';
import { Resource, AsyncListResponse } from './resource';

interface FindCalendarParams {
  calendarId: string;
  identifier: string;
}
interface ListCalendersParams {
  identifier: string;
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

type CalendarListParams = ListCalendersParams & Overrides;

export class Calendars extends Resource {
  public list(
    { overrides, identifier }: CalendarListParams,
    queryParams?: ListCalendersQueryParams
  ): AsyncListResponse<ListResponse<Calendar>> {
    return super._list<ListResponse<Calendar>>({
      queryParams,
      overrides,
      path: `/v3/grants/${identifier}/calendars`,
    });
  }

  public find({
    calendarId,
    identifier,
    overrides,
  }: FindCalendarParams & Overrides): Promise<Response<Calendar>> {
    return super._find({
      path: `/v3/grants/${identifier}/calendars/${calendarId}`,
      overrides,
    });
  }

  public create({
    identifier,
    requestBody,
    overrides,
  }: CreateCalendarParams & Overrides): Promise<Response<Calendar>> {
    return super._create({
      path: `/v3/grants/${identifier}/calendars`,
      requestBody,
      overrides,
    });
  }

  public update({
    calendarId,
    identifier,
    requestBody,
    overrides,
  }: UpdateCalendarParams & Overrides): Promise<Response<Calendar>> {
    return super._update({
      path: `/v3/grants/${identifier}/calendars/${calendarId}`,
      requestBody,
      overrides,
    });
  }

  public destroy({
    identifier,
    calendarId,
    overrides,
  }: DestroyCalendarParams & Overrides): Promise<DeleteResponse> {
    return super._destroy({
      path: `/v3/grants/${identifier}/calendars/${calendarId}`,
      overrides,
    });
  }
}
