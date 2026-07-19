import http from '@ohos.net.http';
import { AuthCredentialProvider, appAuthCredentialProvider } from '../security/AuthCredentialProvider';

export class AuthenticatedHttpError extends Error {
  readonly statusCode: number;
  readonly retryAfterSeconds?: number;

  constructor(message: string, statusCode: number, retryAfterSeconds?: number) {
    super(message);
    this.statusCode = statusCode;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function mergeAuthenticatedHeaders(headers: Map<string, string>, credential?: string): Map<string, string> {
  const result = new Map<string, string>();
  headers.forEach((value: string, key: string) => { result.set(key, value); });
  if (credential !== undefined && credential.length > 0) result.set('authorization', `Bearer ${credential}`);
  return result;
}

export function mapHttpFailure(statusCode: number, retryAfter?: string): AuthenticatedHttpError | undefined {
  if (statusCode === 401) return new AuthenticatedHttpError('AUTH_CREDENTIAL_REJECTED', 401);
  if (statusCode === 429) return new AuthenticatedHttpError('RATE_LIMITED', 429, retryAfter === undefined ? undefined : Number(retryAfter));
  return undefined;
}

export class AuthenticatedHttpClient {
  private readonly credentials: AuthCredentialProvider;

  constructor(credentials: AuthCredentialProvider) {
    this.credentials = credentials;
  }

  async request(url: string, options: http.HttpRequestOptions): Promise<http.HttpResponse> {
    const credential = await this.credentials.getCredential();
    const originalHeaders = options.header as Record<string, string> | undefined;
    const headers: Record<string, string> = {};
    if (originalHeaders !== undefined) {
      Object.keys(originalHeaders).forEach((key: string) => { headers[key] = originalHeaders[key]; });
    }
    if (credential !== undefined && credential.length > 0) {
      headers['Authorization'] = `Bearer ${credential}`;
    }
    const authenticatedOptions: http.HttpRequestOptions = {
      method: options.method,
      header: headers,
      extraData: options.extraData,
      expectDataType: options.expectDataType,
      readTimeout: options.readTimeout,
      connectTimeout: options.connectTimeout,
    };
    const client = http.createHttp();
    try {
      const response = await client.request(url, authenticatedOptions);
      const rawRetryAfter = response.header['retry-after'];
      const failure = mapHttpFailure(response.responseCode, rawRetryAfter);
      if (failure !== undefined) throw failure;
      return response;
    } finally {
      client.destroy();
    }
  }

  retryAfterSeconds(error: Object): number {
    if (error instanceof AuthenticatedHttpError && error.retryAfterSeconds !== undefined) {
      return error.retryAfterSeconds;
    }
    return 0;
  }

  destroy(): void {}
}

export function createAuthenticatedHttp(): AuthenticatedHttpClient {
  return new AuthenticatedHttpClient(appAuthCredentialProvider);
}
