import type { DefineErrorsUnion } from "@hexancore/common";

export const ApiHttpClientErrors = {
  endpointRequestInProgress: 'core.infra.http.api_http_client.endpoint.request_in_progress'
} as const;


export type ApiHttpClientErrors<K extends keyof typeof ApiHttpClientErrors, internal extends 'internal' | 'never_internal' = 'internal'> = DefineErrorsUnion<
  typeof ApiHttpClientErrors,
  K,
  internal
>;