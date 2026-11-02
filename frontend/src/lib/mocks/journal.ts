// TODO(mock): replace on swap day
import type { JournalArticleDetail } from '../types-pending';

export const mockJournalArticles = [
  {
    id: 'art-01',
    title: 'The Metallurgy of Architectural Brass in Humid Coastal Climates',
    slug: 'metallurgy-of-architectural-brass',
    excerpt: 'Why standard commercial brassware leaches lead and tarnishes, and how lead-free PVD alloys preserve surface integrity.',
    coverImage: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=80',
    category: 'Engineering & Materials',
    publishedAt: '2026-09-14T08:00:00Z',
    readTimeMinutes: 6,
    author: 'Karan Mehta, Chief Metallurgical Engineer',
    contentHtml: '<p>Standard decorative brassware often relies on high lead content to ease high-speed machining. In coastal regions with high ambient salinity and hard groundwater, this composition results in microscopic galvanic pitting...</p>',
  },
  {
    id: 'art-02',
    title: 'Designing Sanctuary Bathrooms for Quiet Mornings',
    slug: 'designing-sanctuary-bathrooms',
    excerpt: 'An interview with interior architect Radhika Sen on tactile ergonomics, water acoustics, and understated palettes.',
    coverImage: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
    category: 'Architecture & Design',
    publishedAt: '2026-08-28T10:30:00Z',
    readTimeMinutes: 5,
    author: 'Radhika Sen, Architectural Director',
    contentHtml: '<p>The bathroom is the single space in the home where one is completely present without screens. When water falls without splash turbulence and handles rotate with calibrated hydraulic resistance, the experience shifts from utilitarian to restorative.</p>',
  },
] satisfies JournalArticleDetail[];
