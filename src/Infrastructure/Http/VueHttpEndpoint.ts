import {
  AR,
  AppError,
  AppErrorCode,
  DefaultHttpResponseParser,
  ERR,
  ERRA,
  HttpMethod,
  HttpRequestConfig,
  HttpResponse,
  HttpResponseParser,
  HttpResponseType,
  OK,
  OKA,
  R,
  SAR,
  StringTemplate,
} from '@hexancore/common';
import {
  DeepReadonly,
  ShallowReactive,
  ToRefs,
  UnwrapNestedRefs,
  reactive,
  readonly,
  shallowReactive,
  shallowReadonly,
  toRefs,
} from 'vue';
import { ApiHttpClient, ApiHttpRequestConfig } from './ApiHttpClient';

export interface HttpEndpointConfig {
  method: HttpMethod;
  url: string;
  isProtected?: boolean;
  client: ApiHttpClient;
  responseParser?: HttpResponseParser;
  responseType?: HttpResponseType;
}

export interface HttpEndpointState<D = any> {
  isLoading: boolean;
  data: D | null;
  error: AppError | null;
}

export type VueHttpEndpointRequestConfig<P = any, RD = null, D = any> = Pick<
  HttpRequestConfig<D>,
  RD extends null ? 'headers' | 'responseType' : 'data' | 'headers' | 'responseType'
> &
  P extends null
  ? {}
  : { params?: P };

type UrlFnType = (params: Record<string, any>) => R<{ url: string; query: Record<string, any> }>;

export type VueHttpEndpointStateReactive<D> = Readonly<ShallowReactive<HttpEndpointState<D>>>;
export type VueHttpEndpointStateRefs<D> = ToRefs<HttpEndpointState<D>>;
/**
 * Represents single http endpoint for sending requests.
 * Provides vue reactive state for use on frontend.
 *  data - last request data
 *  error - last request error
 *  isLoading - indicator for in progress request
 * @template P Params type
 * @template D Response data type
 * @template RD RequestData type
 */
export class VueHttpEndpoint<P = {}, RD = null, D = any> {
  protected urlFn: UrlFnType;
  protected state: ShallowReactive<HttpEndpointState<D>>;

  protected currentRequest: ApiHttpRequestConfig | null;

  public constructor(protected config: HttpEndpointConfig) {
    this.config.responseParser = config.responseParser ?? DefaultHttpResponseParser;
    this.config.responseType = config.responseType ?? 'json';
    this.urlFn = VueHttpEndpoint.createUrlFn(this.config.url);
    this.state = shallowReactive({ isLoading: false, data: null, error: null });
    this.currentRequest = null;
  }

  protected static createUrlFn(url: string): UrlFnType {
    if (StringTemplate.hasAnyParam(url)) {
      const t = new StringTemplate(url);
      const paramNames = StringTemplate.extractParams(url);
      return (params: Record<string, any>) =>
        t.render(params).map((url: string) => ({
          url,
          query: VueHttpEndpoint.extractQueryFromParams(params, paramNames),
        }));
    }

    return (params) => OK({ url, query: params });
  }

  protected static extractQueryFromParams(params: Record<string, any>, paramNames: string[]): Record<string, any> {
    const query = {};
    for (const p in params) {
      if (!paramNames.includes(p)) {
        query[p] = params[p];
      }
    }
    return {};
  }

  public getState(): VueHttpEndpointStateReactive<D> {
    return shallowReadonly(this.state);
  }

  public getStateToRefs(): VueHttpEndpointStateRefs<D> {
    return toRefs(this.state);
  }

  public send(req: VueHttpEndpointRequestConfig<P, RD>): AR<D> {
    if (this.state.isLoading) {
      return ERRA('core.http_endpoint.request_in_progress', AppErrorCode.CONFLICT, {
        url: this.config.url,
        currentRequest: this.currentRequest,
      });
    }

    this.state.isLoading = true;
    this.state.error = null;
    this.state.data = null;

    this.currentRequest = req as unknown as ApiHttpRequestConfig;
    const urlData = this.urlFn(req['params'] ?? {}).v;
    delete req['params'];

    this.currentRequest.url = urlData.url;
    this.currentRequest.query = urlData.query;
    this.currentRequest.method = this.config.method;
    this.currentRequest.responseType = this.currentRequest.responseType ?? this.config.responseType;
    this.currentRequest.isProtected = this.config.isProtected;

    return this.config.client.send(this.currentRequest).onOkBind(this.onOk, this).onErrBind(this.onErr, this);
  }

  protected onErr(e: AppError): AR<D> {
    this.state.error = e;
    this.state.isLoading = false;
    this.currentRequest = null;
    return ERRA(e);
  }

  protected onOk(response: HttpResponse): AR<D> {
    return this.config.responseParser(response).onOk((parsedData) => {
      this.state.data = parsedData;
      this.state.isLoading = false;
      this.currentRequest = null;
      return OKA(this.state.data);
    });
  }
}
