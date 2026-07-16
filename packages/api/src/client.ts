import type { ApiResponse } from "@proplease/types";

export interface ApiClientConfig {
  baseUrl: string;
  getAccessToken?: () => string | null | Promise<string | null>;
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ApiClient {
  constructor(private readonly config: ApiClientConfig) {}

  async request<TData>(
    path: string,
    init: RequestInit = {},
  ): Promise<ApiResponse<TData>> {
    const token = await this.config.getAccessToken?.();
    const headers = new Headers(init.headers);
    headers.set("Content-Type", "application/json");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${this.config.baseUrl}${path}`, {
      ...init,
      headers,
    });

    const body = (await response.json()) as ApiResponse<TData>;

    if (!response.ok || !body.success) {
      throw new ApiError(
        body.error?.code ?? "UNKNOWN_ERROR",
        body.error?.message ?? "Request failed",
        response.status,
      );
    }

    return body;
  }

  get<TData>(path: string): Promise<ApiResponse<TData>> {
    return this.request<TData>(path, { method: "GET" });
  }

  post<TData>(path: string, payload: unknown): Promise<ApiResponse<TData>> {
    return this.request<TData>(path, { method: "POST", body: JSON.stringify(payload) });
  }

  put<TData>(path: string, payload: unknown): Promise<ApiResponse<TData>> {
    return this.request<TData>(path, { method: "PUT", body: JSON.stringify(payload) });
  }

  patch<TData>(path: string, payload: unknown): Promise<ApiResponse<TData>> {
    return this.request<TData>(path, { method: "PATCH", body: JSON.stringify(payload) });
  }

  delete<TData>(path: string): Promise<ApiResponse<TData>> {
    return this.request<TData>(path, { method: "DELETE" });
  }
}
