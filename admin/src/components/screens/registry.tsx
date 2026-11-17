'use client';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/EditorBar';
import { PageWrapper } from '@/components/shell/PageWrapper';
import { SectionStub } from '@/components/SectionStub';
import { contentType } from '@/lib/content-types';
import { CategoryScreen, PageList } from './CatalogueScreens';
import { ContentEditor, ContentList } from './Content';
import { GuideScreen } from './Guide';
import { NavigationEditor } from './Navigation';
import { OrderDetail, OrderList } from './Orders';
import { ProductList } from './Products';
import { SettingsScreen } from './Settings';
import { SubmissionsInbox } from './Submissions';
import { ProductEditor } from '@/components/products/ProductEditor';

// The page builder is the heaviest screen, so it only loads when someone opens a page.
const PageBuilder = dynamic(() => import('@/components/builder/PageBuilder').then((m) => m.PageBuilder), { loading: () => <PageWrapper title="Page"><Skeleton rows={6} /></PageWrapper> });
const wrap = (n: React.ReactNode) => <Suspense fallback={<PageWrapper title="Loading"><Skeleton /></PageWrapper>}>{n}</Suspense>;

export function ListRoute({ section }: { section: string }) {
  const ct = contentType(section);
  if (ct) return <ContentList ct={ct} />;
  switch (section) {
    case 'products': return wrap(<ProductList />);
    case 'categories': return <CategoryScreen />;
    case 'pages': return wrap(<PageList />);
    case 'orders': return <OrderList />;
    case 'submissions': return <SubmissionsInbox />;
    case 'navigation': return <NavigationEditor />;
    case 'settings': return <SettingsScreen />;
    case 'guide': return <GuideScreen />;
    case 'users': return <SectionStub section={section} />;
    default: return notFound();
  }
}

export function ItemRoute({ section, id }: { section: string; id: string }) {
  const ct = contentType(section);
  if (ct) return <ContentEditor ct={ct} id={id} />;
  switch (section) {
    case 'products': return <ProductEditor id={id} />;
    case 'pages': return <PageBuilder id={id} />;
    case 'orders': return <OrderDetail id={id} />;
    default: return notFound();
  }
}
