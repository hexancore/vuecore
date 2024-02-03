import { AR, AppError, HasAnyRequiredProperty, HttpMethod, OKA } from '@hexancore/common';
import { Ref, toRefs } from 'vue';
import { HttpEndpointConfig, VueHttpEndpoint } from './VueHttpEndpoint';
import { ApiHttpClient } from './ApiHttpClient';

export type NO_PARAMS = null;
export type UrlParams = Record<string, any>;

type HttpSendDefWithParams<P, D> = HasAnyRequiredProperty<P> extends true ? (params: P) => AR<D> : () => AR<D>;

type HttpSendDef<P extends UrlParams, D> = P extends null ? () => AR<D> : HttpSendDefWithParams<P, D>;

export interface HttpEndpointComposable<P, D> {
  isLoading: Ref<boolean>;
  data: Ref<D>;
  error: Ref<AppError | null>;
  send: HttpSendDef<P, D>;
}

type PostHttpSendDef<P, RD, D> = P extends null ? (data: RD) => AR<D> : (params: P, data: RD) => AR<D>;
export interface PostHttpEndpointComposable<P, RD, D> {
  isLoading: Ref<boolean>;
  data: Ref<D>;
  error: Ref<AppError | null>;
  send: PostHttpSendDef<P, RD, D>;
}

export type VueHttpEndpointDefConfig = Pick<HttpEndpointConfig, 'responseType' | 'responseParser'>;

export type VueHttpEndpointType = <P extends UrlParams, D>(
  url?: string,
  config?: VueHttpEndpointDefConfig,
) => HttpEndpointComposable<P, D>;

export type VueDeleteHttpEndpointType = <P extends UrlParams, D = null>(
  url?: string,
  config?: VueHttpEndpointDefConfig,
) => HttpEndpointComposable<P, D>;

export type VuePostHttpEndpointType = <P extends UrlParams, RD, D>(
  url?: string,
  config?: VueHttpEndpointDefConfig,
) => PostHttpEndpointComposable<P, RD, D>;

type VueHttpEndpointDef = {
  requestData: boolean;
  method: HttpMethod;
  url: string;
} & VueHttpEndpointDefConfig;

class VueHttpEndpointDefObject {
  public isProtected: boolean;
  public constructor(public config: VueHttpEndpointDef) {}

  public static create(config: VueHttpEndpointDef): VueHttpEndpointDefObject {
    return new this(config);
  }
}

export interface VueDefineModuleApiMethodsInterface {
  HEAD: VueHttpEndpointType;
  OPTIONS: VueHttpEndpointType;
  GET: VueHttpEndpointType;
  POST: VuePostHttpEndpointType;
  PUT: VuePostHttpEndpointType;
  PATCH: VuePostHttpEndpointType;
  DELETE: VueDeleteHttpEndpointType;
}

const DefObject = (def: VueHttpEndpointDef): any => VueHttpEndpointDefObject.create(def);
export const VueDefineModuleApiMethods: VueDefineModuleApiMethodsInterface = {
  HEAD: (url?: string, config: VueHttpEndpointDefConfig = {}): any =>
    DefObject({ ...config, method: 'head', url: url ?? '', requestData: false }),
  OPTIONS: (url?: string, config?: VueHttpEndpointDefConfig): any =>
    DefObject({ ...config, method: 'options', url: url ?? '', requestData: false }),
  GET: (url?: string, config?: VueHttpEndpointDefConfig): any =>
    DefObject({ ...config, method: 'get', url: url ?? '', requestData: false }),
  POST: (url?: string, config?: VueHttpEndpointDefConfig): any =>
    DefObject({ ...config, method: 'post', url: url ?? '', requestData: true }),
  PUT: (url?: string, config?: VueHttpEndpointDefConfig): any =>
    DefObject({ ...config, method: 'put', url: url ?? '', requestData: true }),
  PATCH: (url?: string, config?: VueHttpEndpointDefConfig): any =>
    DefObject({ ...config, method: 'patch', url: url ?? '', requestData: true }),
  DELETE: (url?: string, config?: VueHttpEndpointDefConfig): any =>
    DefObject({ ...config, method: 'delete', url: url ?? '', requestData: false }),
};

class VueHttpEndpointFactory {
  public constructor(private client: ApiHttpClient) {}

  public create(def: VueHttpEndpointDefObject): HttpEndpointComposable<any, any> | PostHttpEndpointComposable<any, any, any> {
    const endpoint = new VueHttpEndpoint<any, any, any>({ ...def.config, client: this.client, isProtected: def.isProtected });

    let send;
    if (def.config.requestData) {
      send = (params, data) =>
        endpoint.send({
          params: data === undefined ? {} : params,
          data: data === undefined ? params : data,
        });
    } else {
      send = (params) => endpoint.send({ params });
    }

    return {
      ...endpoint.getStateToRefs(),
      send,
    };
  }
}

type ModuleApiDefinition = {
  public?: Record<string, any>;
  protected?: Record<string, any>;
};

class ModuleApiDefinitionCompiler {
  public constructor(private endpointFactory: VueHttpEndpointFactory) {}
  public compile(module: string, def: ModuleApiDefinition) {
    return {
      public: this.compileEndpoint(def.public ?? {}, module + '/public', '', false),
      protected: this.compileEndpoint(def.protected ?? {}, module + '/protected', '', true),
    };
  }

  protected compileEndpoint(
    def: Record<string, any> | VueHttpEndpointDefObject,
    path: string,
    property: string,
    isProtected: boolean,
  ) {
    if (def instanceof VueHttpEndpointDefObject) {
      let url = def.config.url;
      url = path + (url.length ? (url.startsWith('/') ? url : '/' + url) : '');
      return this.endpointFactory.create({config: {...def.config,  url}, isProtected});
    }

    const endpoints = {};
    const currentPath = path+(property.length ? '/' + property : '');
    for (const p in def) {
      endpoints[p] = this.compileEndpoint(def[p], currentPath, p, isProtected);
    }

    return endpoints;
  }
}

export type DefineModuleApiFnType = <T extends ModuleApiDefinition>(module: string, definition: T) => T;
export interface ComposableDefineModuleApi extends VueDefineModuleApiMethodsInterface {
  defineModuleApi: DefineModuleApiFnType;
}

export function createComposableDefineModuleApi(client: ApiHttpClient): () => ComposableDefineModuleApi {
  const endpointFactory = new VueHttpEndpointFactory(client);
  const compiler = new ModuleApiDefinitionCompiler(endpointFactory);
  return () => ({
    defineModuleApi: ((module: string, definition: Record<string, any>) => {
      return compiler.compile(module, definition);
    }) as any,
    ...VueDefineModuleApiMethods,
  });
}
