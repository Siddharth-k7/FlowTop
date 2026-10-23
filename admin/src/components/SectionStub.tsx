'use client';
import { useEffect, useState } from 'react';
import { Card } from '@flowtop/ui';
import { api, ApiError } from '@/lib/api';
import { PageWrapper } from '@/components/shell/PageWrapper';

/** Placeholder for screens built in later phases. /users probes the API so a 403 shows a clear message. */
export function SectionStub({ section }: { section: string }) {
  const [denied, setDenied] = useState<string>();
  useEffect(() => {
    if (section === 'users') api('/admin/users').catch((e) => e instanceof ApiError && e.status === 403 && setDenied(e.message));
  }, [section]);
  const title = section[0]?.toUpperCase() + section.slice(1);
  return (
    <PageWrapper title={title}>
      <Card role={denied ? 'alert' : undefined}><Card.Body>
        {denied ? (
          <>
            <h2 className="text-lg font-semibold">You do not have permission to view this</h2>
            <p className="mt-1 text-sm">{denied} Ask a Super Admin if you need access.</p>
          </>
        ) : <p className="text-sm text-grey-700">This screen is built in a later phase.</p>}
      </Card.Body></Card>
    </PageWrapper>
  );
}
