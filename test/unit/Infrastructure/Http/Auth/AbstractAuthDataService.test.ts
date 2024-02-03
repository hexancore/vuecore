import { ImmutableDate, OK, OKA, P } from '@hexancore/common';
import { TEST_SUIT_NAME } from '@hexancore/common/testutil';
import { AbstractAuthDataService } from '@/Infrastructure/Http/Auth/AbstractAuthDataService';
import { ApiHttpRequestConfig } from '@/Infrastructure/Http';
import { test, describe, expect, vi } from 'vitest';

class TestAuthDataService extends AbstractAuthDataService<{ value: string }> {
  public injectToRequest(req: ApiHttpRequestConfig): void {
    req.headers['X-Inject'] = true;
  }

  public canRefreshOnUnauthorized(): boolean {
    return true;
  }
}

describe(TEST_SUIT_NAME(__filename), () => {
  let refreshAuthDataFn;
  let newAuthDataCallback;
  let service: TestAuthDataService;

  beforeEach(() => {
    refreshAuthDataFn = vi.fn();
    newAuthDataCallback = vi.fn();

    service = new TestAuthDataService({ refreshAuthDataFn, newAuthDataCallback });
  });

  test('refresh()', async () => {
    const calls = [];
    const expectedData = { value: 'test' };
    refreshAuthDataFn.mockReturnValueOnce(OKA(expectedData));
    newAuthDataCallback.mockReturnValueOnce(OKA(true));

    const p1 = service.refresh().onOk(() => {
      calls.push(1);
      return OKA(1);
    });
    const p2 = service.refresh().onOk(() => {
      calls.push(2);
      return OKA(2);
    });
    const p3 = service.refresh().onOk(() => {
      calls.push(3);
      return OKA(3);
    });

    const current1 = await p1;
    const current2 = await p2;
    const current3 = await p3;

    expect(refreshAuthDataFn).toBeCalledTimes(1);
    expect(newAuthDataCallback).toBeCalledTimes(1);
    expect(calls).toEqual([1, 2, 3]);
    expect(current1).toEqual(OK(1));
    expect(current2).toEqual(OK(2));
    expect(current3).toEqual(OK(3));
  });
});
