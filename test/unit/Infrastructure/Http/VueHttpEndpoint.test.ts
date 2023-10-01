import { VueHttpEndpoint } from '@/Infrastructure/Http/VueHttpEndpoint';
import { HttpResponse, OK, OKA } from '@hexancore/common';
import { TEST_SUIT_NAME } from '@hexancore/common/testutil';
import { MockApiHttpClient } from '@/Test/Infrastructure/Http/MockApiHttpClient';

describe(TEST_SUIT_NAME(__filename), () => {
  let clientMock: MockApiHttpClient;

  beforeEach(() => {
    clientMock = new MockApiHttpClient();
  });

  afterEach(() => {
    clientMock.checkExpections();
  });

  test('send() when url without params', async () => {
    clientMock.onGet('/test').replyOk('test');

    const endpoint = new VueHttpEndpoint<{ param1: string }>({
      method: 'get',
      url: '/test',
      isProtected: false,
      client: clientMock.i,
    });

    const current = await endpoint.send({});

    expect(current).toEqual(OK('test'));
    expect(endpoint.getState()).toEqual({ data: 'test', error: null, isLoading: false });
  });

  test('send() when request in progress', async () => {
    clientMock.onGet('/test').replyOk('test');

    const endpoint = new VueHttpEndpoint<{ param1: string }>({
      method: 'get',
      url: '/test',
      isProtected: false,
      client: clientMock.i,
    });

    const current = endpoint.send({});

    expect(endpoint.getState()).toEqual({ data: null, error: null, isLoading: true });

    await current;
  });

  test('send() when request in progress and next endpoint call', async () => {
    clientMock.onGet('/test').replyOk('test');

    const endpoint = new VueHttpEndpoint<{ param1: string }>({
      method: 'get',
      url: '/test',
      isProtected: false,
      client: clientMock.i,
    });

    endpoint.send({});

    const current = await endpoint.send({});

    expect(current).toMatchAppError({ type: 'core.http_endpoint.request_in_progress', code: 409 });
  });

  test('send() when url param and value given', async () => {
    clientMock.onGet('test/test_param1/test').replyOk('test');

    const endpoint = new VueHttpEndpoint<{ param1: string }>({
      method: 'get',
      url: 'test/:param1/test',
      isProtected: false,
      client: clientMock.i,
    });

    const current = await endpoint.send({ params: { param1: 'test_param1' } });

    expect(current).toEqual(OK('test'));
  });

  test('send() when custom response parser', async () => {
    clientMock.onGet('/test').replyOk('test');

    const endpoint = new VueHttpEndpoint<{ param1: string }>({
      method: 'get',
      url: '/test',
      isProtected: false,
      client: clientMock.i,
      responseParser: (r: HttpResponse<string>) => {
        return OKA(r.data + '_parsed');
      },
    });

    const current = await endpoint.send({});

    expect(current).toEqual(OK('test_parsed'));
  });
});
