import { AR, AppError, ERR, ERRA, OKA } from '@hexancore/common';
import { ApiHttpRequestConfig } from '../ApiHttpClient';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AuthData {}

export interface AuthDataServiceConfig<ADT> {
  refreshAuthDataFn?: () => AR<ADT>;
  newAuthDataCallback?: (authData: ADT) => AR<boolean>;
}

export abstract class AbstractAuthDataService<
  ADT extends AuthData,
  CT extends AuthDataServiceConfig<ADT> = AuthDataServiceConfig<ADT>,
> {
  protected currentData: ADT;
  protected currentRefreshCall: AR<boolean> | null;
  protected waitingRequests: any[];

  public constructor(protected config: CT) {
    this.config.newAuthDataCallback = this.config.newAuthDataCallback ?? (() => OKA(true));
    this.currentData = null;
    this.currentRefreshCall = null;
    this.waitingRequests = [];
  }

  public refresh(): AR<boolean> {
    if (!this.config.refreshAuthDataFn) {
      return OKA(true);
    }

    if (!this.currentRefreshCall) {
      this.currentRefreshCall = this.config
        .refreshAuthDataFn()
        .onOkBind(this.onRefreshed, this)
        .onErrBind(this.onRefreshError, this);
      return this.currentRefreshCall;
    }

    return this.currentRefreshCall;

  }

  protected onRefreshError(e: AppError): AR<boolean> {
    for (const r of this.waitingRequests) {
      r.reject(ERR(e));
    }
    return ERRA(e);
  }

  protected onRefreshed(data: ADT): AR<boolean> {
    this.currentData = data;
    this.currentRefreshCall = null;
    return this.config.newAuthDataCallback(this.currentData);
  }

  public getAuthData(): AR<ADT | null> {
    return OKA(this.currentData);
  }

  public setAuthData(data: ADT): void {
    this.currentData = data;
  }

  public abstract injectToRequest(req: ApiHttpRequestConfig): void;

  public abstract canRefreshOnUnauthorized(): boolean;
}
