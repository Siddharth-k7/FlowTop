import { ListRoute } from '@/components/screens/registry';

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return <ListRoute section={section} />;
}
