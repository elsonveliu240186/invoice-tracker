export interface ProblemDetail {
  type?: string | undefined;
  title?: string | undefined;
  status: number;
  detail?: string | undefined;
  code?: string | undefined;
  instance?: string | undefined;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly detail: string | undefined;
  readonly problem: ProblemDetail;

  constructor(problem: ProblemDetail) {
    super(problem.detail ?? problem.title ?? `HTTP error ${problem.status}`);
    this.name = 'ApiError';
    this.status = problem.status;
    this.code = problem.code;
    this.detail = problem.detail;
    this.problem = problem;
  }
}

async function parseErrorResponse(response: Response): Promise<ApiError> {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('problem+json') || contentType.includes('application/json')) {
    try {
      const body = (await response.json()) as Record<string, unknown>;
      return new ApiError({
        status: response.status,
        type: typeof body['type'] === 'string' ? body['type'] : undefined,
        title: typeof body['title'] === 'string' ? body['title'] : undefined,
        detail: typeof body['detail'] === 'string' ? body['detail'] : undefined,
        code: typeof body['code'] === 'string' ? body['code'] : undefined,
        instance: typeof body['instance'] === 'string' ? body['instance'] : undefined,
      });
    } catch {
      // fall through
    }
  }
  return new ApiError({ status: response.status });
}

export async function http<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
