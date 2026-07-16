export interface ApiMeta {
  page?: number;
  pageSize?: number;
  total?: number;
  [key: string]: unknown;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<TData> {
  success: boolean;
  data: TData | null;
  meta: ApiMeta | null;
  error: ApiError | null;
}
