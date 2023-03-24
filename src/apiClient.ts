import fetch, { Request } from 'node-fetch';
import { ZodType } from 'zod';
import { NylasConfig, OverridableNylasConfig } from './config';
import { NylasApiError, NylasAuthError } from './schema/error';
import {
  ListResponseSchema,
  ResponseSchema,
  ErrorResponseSchema,
  AllowedResponse,
  AllowedResponseInnerType,
  ExchangeResponseSchema,
  EmptyResponseSchema,
} from './schema/response';
import { objKeysToCamelCase, objKeysToSnakeCase } from './utils';
// import { AppendOptions } from 'form-data';

const PACKAGE_JSON = require('../package.json');
const SDK_VERSION = PACKAGE_JSON.version;

// TODO: refactor for new apiclient
export interface RequestOptionsParams {
  path: string;
  method: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, any>;
  body?: any;
  overrides?: OverridableNylasConfig;
  // json?: boolean;
  // formData?: Record<string, FormDataType>;
}

interface OptionsPassthru<D extends ZodType> {
  responseSchema?: D;
}

interface RequestOptions {
  path: string;
  method: string;
  headers: Record<string, string>;
  url: URL;
  body?: string;
  overrides?: Partial<NylasConfig>;
}

// export type FormDataType = {
//   value: unknown;
//   options?: Record<string, unknown> | AppendOptions;
// };

export default class APIClient {
  apiKey: string;
  serverUrl: string;
  clientId?: string;
  clientSecret?: string;

  constructor({ apiKey, serverUrl, clientId, clientSecret }: NylasConfig) {
    this.apiKey = apiKey;
    this.serverUrl = serverUrl as string; // TODO: get rid of type assertion
    this.clientSecret = clientSecret;
    this.clientId = clientId;
  }

  private setRequestUrl({
    overrides,
    path,
    queryParams,
  }: RequestOptionsParams): URL {
    const url = new URL(`${overrides?.serverUrl || this.serverUrl}${path}`);

    return this.setQueryStrings(url, queryParams);
  }

  private setQueryStrings(
    url: URL,
    queryParams?: Record<string, unknown>
  ): URL {
    if (queryParams) {
      const snakeCaseParams = objKeysToSnakeCase(queryParams);
      // TODO: refactor this not manually turn params into query string
      for (const [key, value] of Object.entries(snakeCaseParams)) {
        if (key == 'metadata_pair') {
          // The API understands a metadata_pair filter in the form of:
          // <key>:<value>
          for (const item in value as Record<string, string>) {
            url.searchParams.set(
              'metadata_pair',
              `${item}:${(value as Record<string, string>)[item]}`
            );
          }
        } else {
          url.searchParams.set(key, value as string);
        }
      }
    }

    return url;
  }

  private setRequestHeaders({
    headers,
    overrides,
  }: RequestOptionsParams): Record<string, string> {
    return {
      Accept: 'application/json',
      'User-Agent': `Nylas Node SDK v${SDK_VERSION}`,
      Authorization: `Bearer ${overrides?.apiKey || this.apiKey}`,
      ...headers,
    };
  }

  requestOptions(optionParams: RequestOptionsParams): RequestOptions {
    const requestOptions = {} as RequestOptions;

    requestOptions.url = this.setRequestUrl(optionParams);
    requestOptions.headers = this.setRequestHeaders(optionParams);
    requestOptions.method = optionParams.method;
    // logic for setting request body if is formdata
    // if (options.formData) {
    //   const fd = new FormData();
    //   for (const [key, obj] of Object.entries(options.formData)) {
    //     if (obj.options) {
    //       fd.append(key, obj.value, obj.options);
    //     } else {
    //       fd.append(key, obj.value);
    //     }
    //   }
    //   options.body = fd;
    //   options.headers['Content-Type'] = 'multipart/form-data';
    // } else

    // TODO: function to set request body
    // TODO: convert to snake case
    if (optionParams.body) {
      requestOptions.body = JSON.stringify(optionParams.body);
      requestOptions.headers['Content-Type'] = 'application/json';
    }

    return requestOptions;
  }

  newRequest(options: RequestOptionsParams): Request {
    const newOptions = this.requestOptions(options);
    return new Request(newOptions.url, {
      method: newOptions.method,
      headers: newOptions.headers,
      body: newOptions.body,
    });
  }

  request<T extends AllowedResponse<unknown>>(
    options: RequestOptionsParams,
    passthru: OptionsPassthru<ZodType<AllowedResponseInnerType<T>>>
  ): Promise<T> {
    const req = this.newRequest(options);
    return new Promise<T>(async (resolve, reject) => {
      return fetch(req)
        .then(response => {
          if (typeof response === 'undefined') {
            return reject(new Error('No response'));
          }
          if (response.status > 299) {
            return response.text().then(body => {
              if (
                options.path.includes('connect/token') ||
                options.path.includes('connect/revoke')
              ) {
                try {
                  const error = new NylasAuthError(JSON.parse(body));
                  return reject(error);
                } catch (e) {
                  return reject(e);
                }
              }
              try {
                const error = new NylasApiError(JSON.parse(body));
                return reject(error);
              } catch (e) {
                return reject(e);
              }
            });
          } else {
            if (response.status === 204) {
              return resolve(null as T);
            } else {
              return response.text().then(text => {
                try {
                  // TODO: static typecheck this
                  if (!passthru.responseSchema) {
                    throw new Error(
                      'Need validation schema to validate response'
                    );
                  }

                  const responseJSON = JSON.parse(text);
                  // TODO: exclusion list for keys that should not be camelCased
                  const camelCaseRes = objKeysToCamelCase(responseJSON);
                  const testListResponse = ListResponseSchema.safeParse(
                    camelCaseRes
                  );
                  const testResponse = ResponseSchema.safeParse(camelCaseRes);
                  const testEmptyResponse = EmptyResponseSchema.safeParse(
                    camelCaseRes
                  );
                  const testAuthResponse = ExchangeResponseSchema.safeParse(
                    camelCaseRes
                  );
                  const testError = ErrorResponseSchema.safeParse(camelCaseRes);
                  let response:
                    | AllowedResponseInnerType<T>
                    | AllowedResponseInnerType<T>[];
                  if (testListResponse.success) {
                    response = testListResponse.data
                      .data as AllowedResponseInnerType<T>[];
                  } else if (testResponse.success) {
                    response = testResponse.data
                      .data as AllowedResponseInnerType<T>;
                  } else if (testAuthResponse.success) {
                    response = testAuthResponse.data as AllowedResponseInnerType<
                      T
                    >;
                  } else if (testEmptyResponse.success) {
                    response = testEmptyResponse.data as AllowedResponseInnerType<
                      T
                    >;
                  } else if (testError.success) {
                    throw new NylasApiError(testError.data);
                  } else {
                    throw new Error('Invalid response from the server.');
                  }

                  let validateSchema;

                  if (Array.isArray(response)) {
                    for (const item of response) {
                      const validateItem = passthru.responseSchema.safeParse(
                        item
                      );
                      if (!validateItem.success) {
                        throw new Error(
                          `Invalid data model from the server. ${validateItem.error}`
                        );
                      }
                      resolve(camelCaseRes as T);
                    }
                  } else {
                    validateSchema = passthru.responseSchema.safeParse(
                      response
                    );
                    if (!validateSchema.success) {
                      throw new Error(
                        `Invalid data model from the server. ${validateSchema.error}`
                      );
                    }
                    resolve(camelCaseRes as T);
                  }
                } catch (e) {
                  return reject(e);
                }
              });
            }
          }
        })
        .catch((err: Error) => {
          console.error(`Error encountered during request:\n${err.stack}`);
          return reject(err);
        });
    });
  }
}
