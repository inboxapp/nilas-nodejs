import APIClient from '../apiClient';
import { OverridableNylasConfig } from '../config';
import { ListQueryParams } from '../schema/request';
import {
  Response,
  ListResponse,
  ListResponseInnerType,
} from '../schema/response';

interface ListParams<T> {
  queryParams?: ListQueryParams;
  path: string;
  overrides?: OverridableNylasConfig;
  useGenerator?: boolean; // Add this line
}

interface FindParams<T> {
  path: string;
  queryParams?: Record<string, any>;
  overrides?: OverridableNylasConfig;
}

interface PayloadParams<T> {
  path: string;
  queryParams?: Record<string, any>;
  requestBody: Record<string, any>;
  overrides?: OverridableNylasConfig;
}

interface DestroyParams {
  path: string;
  queryParams?: Record<string, any>;
  overrides?: OverridableNylasConfig;
}

type List<T> = ListResponse<ListResponseInnerType<T>>;
export class Resource {
  protected apiClient: APIClient;

  constructor(apiClient: APIClient) {
    this.apiClient = apiClient;
  }

  private async fetchList<T extends List<T>>({
    queryParams,
    path,
    overrides,
  }: ListParams<T>): Promise<T> {
    const res = await this.apiClient.request<T>({
      method: 'GET',
      path,
      queryParams,
      overrides,
    });

    if (queryParams?.limit) {
      let entriesRemaining = queryParams.limit;

      while (res.data.length != queryParams.limit) {
        entriesRemaining = queryParams.limit - res.data.length;

        if (!res.nextCursor) {
          break;
        }

        const nextRes = await this.apiClient.request<T>({
          method: 'GET',
          path,
          queryParams: {
            ...queryParams,
            limit: entriesRemaining,
            pageToken: res.nextCursor,
          },
          overrides,
        });

        res.data = res.data.concat(nextRes.data);
        res.requestId = nextRes.requestId;
        res.nextCursor = nextRes.nextCursor;
      }
    }

    return res;
  }

  private async *listIterator<T extends List<T>>(
    listParams: ListParams<T>
  ): AsyncGenerator<List<T>, undefined> {
    const first = await this.fetchList(listParams);

    yield first;

    let pageToken = first.nextCursor;

    while (pageToken) {
      const res = await this.fetchList({
        ...listParams,
        queryParams: pageToken
          ? {
              ...listParams.queryParams,
              pageToken,
            }
          : listParams.queryParams,
      });

      yield res;

      pageToken = res.nextCursor;
    }

    return undefined;
  }

  protected _list<T extends List<T>>(
    listParams: ListParams<T>
  ): AsyncListResponse<T> {
    const iterator = this.listIterator(listParams);
    const first = iterator.next().then(
      res =>
        ({
          ...res.value,
          next: iterator.next.bind(iterator),
        } as ListYieldReturn<T>)
    );

    return Object.assign(first, {
      [Symbol.asyncIterator]: this.listIterator.bind(
        this,
        listParams
      ) as () => AsyncGenerator<T, undefined>,
    });
  }

  protected _find<T>({
    path,
    queryParams,
    overrides,
  }: FindParams<T>): Promise<Response<T>> {
    return this.apiClient.request<Response<T>>({
      method: 'GET',
      path,
      queryParams,
      overrides,
    });
  }

  private payloadRequest<T>(
    method: 'POST' | 'PUT' | 'PATCH',
    { path, queryParams, requestBody, overrides }: PayloadParams<T>
  ): Promise<Response<T>> {
    return this.apiClient.request<Response<T>>({
      method,
      path,
      queryParams,
      body: requestBody,
      overrides,
    });
  }

  protected _create<T>(params: PayloadParams<T>): Promise<Response<T>> {
    return this.payloadRequest('POST', params);
  }

  protected _update<T>(params: PayloadParams<T>): Promise<Response<T>> {
    return this.payloadRequest('PUT', params);
  }

  protected _updatePatch<T>(
    params: PayloadParams<T>
  ): Promise<Response<T>> {
    return this.payloadRequest('PATCH', params);
  }

  protected _destroy<T>({
    path,
    queryParams,
    overrides,
  }: DestroyParams): Promise<T> {
    return this.apiClient.request({
      method: 'DELETE',
      path,
      queryParams,
      overrides,
    });
  }
}

type ListYieldReturn<T> = T & {
  next: () => Promise<IteratorResult<T, undefined>>;
};

export interface AsyncListResponse<T> extends Promise<ListYieldReturn<T>> {
  [Symbol.asyncIterator](): AsyncGenerator<T, undefined>;
}
