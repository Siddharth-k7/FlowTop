import { buttonClasses } from '@flowtop/ui';

// Class strings for the few places that need a native element or a <Link>, built on @flowtop/ui.
// Buttons come straight from buttonClasses(); nothing here re-implements a component.
export const btnPrimary = buttonClasses({ variant: 'primary' });
export const btnSecondary = buttonClasses({ variant: 'secondary' });
export const btnDanger = buttonClasses({ variant: 'danger' });
/** Matches the @flowtop/ui Input look, for inline controls inside list rows. */
export const inputCls = 'min-h-touch w-full rounded-md border border-border-input bg-surface-solid px-space-3 text-body text-fg';
export const cardCls = 'rounded-card bg-white p-4 shadow-card';
