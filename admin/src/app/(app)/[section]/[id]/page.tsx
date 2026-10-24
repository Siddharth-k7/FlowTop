import { notFound } from 'next/navigation';
import { SectionStub } from '@/components/SectionStub';
import { NAV } from '@/components/shell/nav';

// Create/edit screens (e.g. /products/new) are built in later phases.
export default async function SectionItemPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!NAV.some((i) => i.href === `/${section}`)) notFound();
  return <SectionStub section={section} />;
}
