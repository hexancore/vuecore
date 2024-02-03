import { ApiHttpRequestConfig } from '@/Infrastructure/Http';
import { BearerAuthDataService } from '@/Infrastructure/Http/Auth/BearerAuthDataService';
import { DateTime } from '@hexancore/common';
import { TEST_SUIT_NAME } from '@hexancore/common/testutil';
import { Mock, beforeEach, describe, expect, test, vi } from 'vitest';

describe(TEST_SUIT_NAME(__filename), () => {
  let refreshAuthDataFn: Mock;
  let newAuthDataCallback: Mock;
  let service: BearerAuthDataService;

  beforeEach(() => {
    refreshAuthDataFn = vi.fn();
    newAuthDataCallback = vi.fn();

    service = new BearerAuthDataService({ refreshAuthDataFn, newAuthDataCallback });
  });

  test('get()', async () => {
    const authData = { token: 'test_token', expiresAt: DateTime.cs('2023-09-27T10:10:00') };
    service.setAuthData(authData);

    const req: ApiHttpRequestConfig = { method: 'get', url: 'test', isProtected: true, headers: {} };
    service.injectToRequest(req);

    expect(req.headers).toEqual({Authorization: 'Bearer ' + 'test_token'});
  });
});
