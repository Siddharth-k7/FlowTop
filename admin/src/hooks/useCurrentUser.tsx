'use client';
import { createContext, useContext } from 'react';
import type { User } from '@/types';

export const UserContext = createContext<User | null>(null);

export function useCurrentUser(): User {
  const u = useContext(UserContext);
  if (!u) throw new Error('useCurrentUser must be used inside the shell');
  return u;
}
