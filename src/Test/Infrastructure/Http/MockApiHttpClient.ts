import { AppErrorProps, ERR, HttpMethod, HttpResponse, OKA, RawHttpResponseHeaders } from '@hexancore/common';
import { ApiHttpClient, ApiHttpRequestConfig } from '@/Infrastructure/Http';
import { M, MethodMock, Mocker } from '@hexancore/mocker/vitest';

export class MockRequestHandler {
  public constructor(private m: MethodMock<any>) { }
  public replyOk(data: any, statusCode = 200, headers: RawHttpResponseHeaders = {}): void {
    this.m.andReturn(OKA({ data, statusCode, headers }));
  }

  public replyErr(err: AppErrorProps<any>): void {
    this.m.andReturn(ERR(err));
  }
}

type MockApiHttpRequestConfig = Partial<Omit<ApiHttpRequestConfig, 'method' | 'url' | 'data'>>;

/**
 * Helper class for test api endpoints
 */
export class MockApiHttpClient {
  private m: M<ApiHttpClient>;

  public constructor() {
    this.m = Mocker.of('MockApiHttpClient');
  }

  public onHead(url: string, req: MockApiHttpRequestConfig = {}): MockRequestHandler {
    const r: ApiHttpRequestConfig = req as unknown as ApiHttpRequestConfig;
    return this.on('head', url, r);
  }

  public onOptions(url: string, req: MockApiHttpRequestConfig = {}): MockRequestHandler {
    const r: ApiHttpRequestConfig = req as unknown as ApiHttpRequestConfig;

    return this.on('options', url, r);
  }

  public onGet(url: string, req: MockApiHttpRequestConfig = {}): MockRequestHandler {
    const r: ApiHttpRequestConfig = req as unknown as ApiHttpRequestConfig;
    return this.on('get', url, r);
  }

  public onPost(url: string, data: any, req: MockApiHttpRequestConfig = {}): MockRequestHandler {
    const r: ApiHttpRequestConfig = req as unknown as ApiHttpRequestConfig;
    r.data = data;
    return this.on('post', url, r);
  }

  public onPut(url: string, data: any, req: MockApiHttpRequestConfig = {}): MockRequestHandler {
    const r: ApiHttpRequestConfig = req as unknown as ApiHttpRequestConfig;
    r.data = data;
    return this.on('put', url, r);
  }

  public onPatch(url: string, data: any, req: MockApiHttpRequestConfig = {}): MockRequestHandler {
    const r: ApiHttpRequestConfig = req as unknown as ApiHttpRequestConfig;
    r.data = data;
    return this.on('patch', url, r);
  }

  public onDelete(url: string, req: MockApiHttpRequestConfig = {}): MockRequestHandler {
    const r: ApiHttpRequestConfig = req as unknown as ApiHttpRequestConfig;
    return this.on('delete', url, r);
  }

  private on(method: HttpMethod, url: string, req: ApiHttpRequestConfig): MockRequestHandler {
    const r: ApiHttpRequestConfig = req as unknown as ApiHttpRequestConfig;
    r.method = method;
    r.url = url;
    r.isProtected = req.isProtected ?? expect.any(Boolean);
    r.query = expect.objectContaining(req.query ?? {});
    if (r.headers) {
      r.headers = expect.objectContaining(r.headers);
    }

    r.responseType = req.responseType ?? expect.any(String);
    return new MockRequestHandler(this.m.expects('send', expect.objectContaining(r)));
  }

  public get i(): ApiHttpClient {
    return this.m.i;
  }

  public checkExpections(): void {
    this.m.checkExpections();
  }
}
