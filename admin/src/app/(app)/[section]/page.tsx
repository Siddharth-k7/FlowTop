import { notFound } from 'next/navigation';
import { SectionStub } from '@/components/SectionStub';
import { NAV } from '@/components/shell/nav';

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!NAV.some((i) => i.href === `/${section}`)) notFound();
  return <SectionStub section={section} />;
}
