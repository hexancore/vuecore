import { AR, HttpClient, ImmutableDate } from '@hexancore/common';
import { AbstractAuthDataService, AuthData } from './AbstractAuthDataService';
import { ApiHttpRequestConfig } from '../ApiHttpClient';

export interface AccessTokenData extends AuthData {
  token: string;
  expiresAt: ImmutableDate;
}

export const HttpRefreshAccessTokenFnFactory = (client: HttpClient, url: string): AR<AccessTokenData> => {
  return client.send({ method: 'post', url, withCredentials: true }).map((r) => r.data);
};

export class BearerAuthDataService extends AbstractAuthDataService<AccessTokenData> {
  public canRefreshOnUnauthorized(): boolean {
    return true;
  }

  public injectToRequest(req: ApiHttpRequestConfig): void {
    req.headers.Authorization = 'Bearer ' + this.currentData.token;
  }
}
