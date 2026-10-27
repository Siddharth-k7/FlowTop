// TODO: swap for @flowtop/ui components when Dev C ships them. Class strings only, no local Button/Input components.
const base = 'inline-flex min-h-touch items-center justify-center gap-2 rounded px-4 text-sm font-medium disabled:opacity-50';
export const btnPrimary = `${base} bg-purple-deep text-white hover:bg-ink`;
export const btnSecondary = `${base} border border-grey-200 bg-white text-ink hover:bg-purple-pale`;
export const btnDanger = `${base} bg-error text-white hover:bg-ink`;
export const inputCls = 'min-h-touch w-full rounded border border-grey-500 bg-white px-3 text-base text-ink';
export const cardCls = 'rounded-lg bg-white p-4 shadow-card';
