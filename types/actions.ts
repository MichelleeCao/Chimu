export type ActionResponse<T = undefined> = 
  | { data?: T; error?: undefined }
  | { data?: undefined; error: string | Record<string, string[]> };
