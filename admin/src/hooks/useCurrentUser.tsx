'use client';
import { createContext, useContext } from 'react';
import type { Permission, User } from '@flowtop/types';
import { canSee } from '@/components/shell/nav';

export const UserContext = createContext<User | null>(null);

/**
 * `can('product:publish')` for showing or hiding a button. COSMETIC ONLY: presentation, never a guard.
 * The server checks the permission on every call and answers 403 whatever the screen shows.
 */
export function useCan(): (permission: Permission) => boolean {
  const { permissions } = useCurrentUser();
  return (permission) => canSee(permissions, permission);
}

export function useCurrentUser(): User {
  const u = useContext(UserContext);
  if (!u) throw new Error('useCurrentUser must be used inside the shell');
  return u;
}
