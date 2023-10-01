import {
  ComposableDefineModuleApi,
  HttpEndpointComposable,
  NO_PARAMS,
  VueDefineModuleApiMethods,
  createComposableDefineModuleApi,
} from '@/Infrastructure/Http/VueHttpEndpointComposable';
import { TEST_SUIT_NAME } from '@hexancore/common/testutil';
import { MockApiHttpClient } from '@/Test/Infrastructure/Http/MockApiHttpClient';
import { OK, R } from '@hexancore/common';
import { HttpEndpointState, VueHttpEndpointStateRefs } from '@/Infrastructure/Http';
import { Ref, ShallowReactive, ToRefs } from 'vue';

export type ProjectId = number;
export type ProjectDto = { id: ProjectId; name: string; type: number; tags: string[] };

export type ProjectCreateData = Pick<ProjectDto, 'name' | 'type' | 'tags'>;
export type ProjectCreateResponseData = Pick<ProjectDto, 'id'>;

describe(TEST_SUIT_NAME(__filename), () => {
  let apiClient: MockApiHttpClient;
  let useModuleApi: () => ComposableDefineModuleApi;

  const { GET, POST, DELETE, PUT, PATCH } = VueDefineModuleApiMethods;
  let TodoApiDef = {
    public: {
      constants: {
        getList: GET<NO_PARAMS, Array<string>>(''),
      },
    },
    protected: {
      projects: {
        create: POST<NO_PARAMS, ProjectCreateData, ProjectCreateResponseData>(),

        getList: GET<{ type?: number }, Array<ProjectDto>>(),
        ':id': {
          get: GET<{ id: ProjectId }, ProjectDto>(),
          replace: PUT<{ id: ProjectId }, ProjectCreateData, null>(),
          update: PATCH<{ id: ProjectId }, ProjectCreateData, null>(),
          delete: DELETE<{ id: ProjectId }>(),
          tags: {
            getList: GET<NO_PARAMS, Array<string>>(),
          },
        },
      },
    },
  };

  let TodoApi = TodoApiDef;

  function expectEndpointOkResponse<S extends ToRefs<ShallowReactive<HttpEndpointState<any>>>>(
    current: R<S['data']['value']>,
    state: S,
    expectedData: S['data']['value'],
  ): void {
    expect(current).toEqual(OK(expectedData));
    expect(state.data.value).toEqual(expectedData);
    expect(state.error.value).toBeNull();
    expect(state.isLoading.value).toBeFalsy();
  }

  beforeEach(() => {
    apiClient = new MockApiHttpClient();
    useModuleApi = createComposableDefineModuleApi(apiClient.i);
    const { defineModuleApi } = useModuleApi();
    TodoApi = defineModuleApi('todo', TodoApiDef);
  });

  afterEach(() => {
    apiClient.checkExpections();
  });

  test('protected.projects.create', async () => {
    const { send, data, error, isLoading } = TodoApi.protected.projects.create;
    const expectedCreateData = { name: 'test', type: 1, tags: [] };
    apiClient.onPost('todo/protected/projects', expectedCreateData).replyOk({id: 1});

    const current = await send({ name: 'test', type: 1, tags: [] });

    expectEndpointOkResponse(current, { data, error, isLoading }, {id: 1});
  });

  test('protected.projects.getList', async () => {
    const { send, data, error, isLoading } = TodoApi.protected.projects.getList;
    const expectedData = [{ id: 1, name: 'test', type: 1, tags: [] }];
    apiClient.onGet('todo/protected/projects', { isProtected: true }).replyOk(expectedData);

    const current = await send();

    expectEndpointOkResponse(current, { data, error, isLoading }, expectedData);
  });

  test('protected.projects:id.get', async () => {
    const { send, data, error, isLoading } = TodoApi.protected.projects[':id'].get;
    const expectedData = { id: 1, name: 'test', type: 1, tags: [] };
    apiClient.onGet('todo/protected/projects/1').replyOk(expectedData);

    const current = await send({ id: 1 });

    expectEndpointOkResponse(current, { data, error, isLoading }, expectedData);
  });

  test('protected.projects:id.replace', async () => {
    const { send, data, error, isLoading } = TodoApi.protected.projects[':id'].replace;
    const expectedData = { id: 1, name: 'test', type: 1, tags: [] };
    apiClient.onPut('todo/protected/projects/1', expectedData).replyOk(null);

    const current = await send({ id: 1 }, expectedData);

    expectEndpointOkResponse(current, { data, error, isLoading }, null);
  });

  test('protected.projects:id.delete', async () => {
    const { send, data, error, isLoading } = TodoApi.protected.projects[':id'].delete;
    apiClient.onDelete('todo/protected/projects/1').replyOk(null);

    const current = await send({ id: 1 });

    expectEndpointOkResponse(current, { data, error, isLoading }, null);
  });
});
