import { notFound } from 'next/navigation';
import { ItemRoute } from '@/components/screens/registry';
import { NAV } from '@/components/shell/nav';

export default async function SectionItemPage({ params }: { params: Promise<{ section: string; id: string }> }) {
  const { section, id } = await params;
  if (!NAV.some((i) => i.href === `/${section}`)) notFound();
  return <ItemRoute section={section} id={id} />;
}
