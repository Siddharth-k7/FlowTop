import { notFound } from 'next/navigation';
import { ListRoute } from '@/components/screens/registry';
import { NAV } from '@/components/shell/nav';

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!NAV.some((i) => i.href === `/${section}`)) notFound();
  return <ListRoute section={section} />;
}
