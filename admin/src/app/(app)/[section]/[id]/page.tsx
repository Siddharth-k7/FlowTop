import { ItemRoute } from '@/components/screens/registry';

export default async function SectionItemPage({ params }: { params: Promise<{ section: string; id: string }> }) {
  const { section, id } = await params;
  return <ItemRoute section={section} id={id} />;
}
