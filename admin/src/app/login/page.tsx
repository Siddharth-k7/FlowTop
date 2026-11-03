import { Suspense } from 'react';
import { LoginFlow } from '@/components/auth/LoginFlow';

export default function LoginPage() {
  return <Suspense><LoginFlow /></Suspense>;
}
