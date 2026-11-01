export type Res = { status: number; json: unknown };
export const ok = (data: unknown): Res => ({ status: 200, json: { data } });
export const fail = (status: number, code: string, message: string, fields?: Record<string, string>): Res =>
  ({ status, json: { error: { code, message, fields } } });
