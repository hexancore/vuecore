import { AR, AppError, AppErrorCode, ERRA, HttpClient, HttpRequestConfig, HttpResponse } from '@hexancore/common';
import { AccessTokenData, BearerAuthDataService } from './Auth/BearerAuthDataService';
import { AbstractAuthDataService } from './Auth/AbstractAuthDataService';

export interface ApiHttpRequestConfig extends HttpRequestConfig {
  isProtected: boolean;
}

export class ApiHttpClient {
  public constructor(protected client: HttpClient, protected authDataService: AbstractAuthDataService<any, any>) {}

  public send(req: ApiHttpRequestConfig): AR<HttpResponse> {
    if (req.isProtected) {
      this.authDataService.injectToRequest(req);
      return this.client.send(req).onErrBind(this.tryRetryProtectedRequest, this, req);
    }

    return this.client.send(req);
  }

  protected tryRetryProtectedRequest(req: ApiHttpRequestConfig, e: AppError): AR<HttpResponse> {
    if (e.code === AppErrorCode.UNAUTHORIZED && this.authDataService.canRefreshOnUnauthorized()) {
      return this.authDataService.refresh().onOk(() => {
        this.authDataService.injectToRequest(req);
        return this.client.send(req);
      });
    } else {
      return ERRA(e);
    }
  }
}
