import { ImmutableDate, OK, OKA, P } from '@hexancore/common';
import { AccessTokenData, BearerAuthDataService } from '@/Infrastructure/Http/Auth/BearerAuthDataService';
import { TEST_SUIT_NAME, MockHttpClient } from '@hexancore/common/testutil';
import { ApiHttpRequestConfig } from '@/Infrastructure/Http';

describe(TEST_SUIT_NAME(__filename), () => {
  let refreshAuthDataFn: jest.Mock;
  let newAuthDataCallback: jest.Mock;
  let service: BearerAuthDataService;

  beforeEach(() => {
    refreshAuthDataFn = jest.fn();
    newAuthDataCallback = jest.fn();

    service = new BearerAuthDataService({ refreshAuthDataFn, newAuthDataCallback });
  });

  test('get()', async () => {
    const authData = { token: 'test_token', expiresAt: ImmutableDate.cs('2023-09-27') };
    service.setAuthData(authData);

    const req: ApiHttpRequestConfig = { method: 'get', url: 'test', isProtected: true };
    service.injectToRequest(req);

    expect(req.headers).toEqual({Authorization: 'Bearer ' + 'test_token'})
  });
});
