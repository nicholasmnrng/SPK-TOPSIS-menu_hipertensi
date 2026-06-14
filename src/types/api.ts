export type ApiMeta = {
  page: number;
  limit: number;
  total: number;
};

export type ApiListResponse<T> = {
  data: T[];
  meta: ApiMeta;
};

export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
};
