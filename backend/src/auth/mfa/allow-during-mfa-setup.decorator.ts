import { SetMetadata } from '@nestjs/common';

export const ALLOW_DURING_MFA_SETUP_KEY = 'flowtop:allowDuringMfaSetup';

/**
 * Marks one of the few routes a super admin without MFA may still reach:
 * the MFA setup routes. Every other route behind AuthGuard refuses them with
 * 403 MFA_SETUP_REQUIRED. Do not add this anywhere else.
 */
export const AllowDuringMfaSetup = () => SetMetadata(ALLOW_DURING_MFA_SETUP_KEY, true);
