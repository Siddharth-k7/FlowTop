// TODO(mock): replace on swap day
import type { PageResponse, SingleResponse } from '../types-pending';

export const mockPages: Record<string, PageResponse> = {
  '': {
    id: 'page-home-001',
    title: 'Flowtop Homepage',
    slug: '',
    status: 'published',
    seo: {
      title: 'Premium Bathfittings for Modern Indian Homes | Flowtop',
      description: 'Explore Flowtop premium bathfittings, designed in India for beautiful everyday rituals.',
      canonical: 'https://flowtop.in',
      shareImage: { url: '/images/hero-bath.jpg' },
    },
    sections: [
      {
        id: 'sec-hero-01',
        type: 'hero',
        position: 0,
        visible: true,
        config: {
          headline: 'The art of everyday water.',
          subheading:
            'Precision architectural fittings designed with enduring poise, whisper-quiet cartridges, and living patinas for considered spaces.',
          mediaType: 'image',
          desktopImageId: 'med-hero-bath',
          mobileImageId: 'med-hero-bath-mobile',
          videoUrl: null,
          overlay: 'light',
          textPosition: 'bottom-left',
          ctas: [
            { label: 'Schedule an Architectural Consultation', href: '/contact', style: 'primary' },
            { label: 'Explore Collections', href: '/collections', style: 'secondary' },
          ],
          layout: {
            background: 'white',
            spacingTop: 'small',
            spacingBottom: 'medium',
            width: 'contained',
            align: 'left',
          },
        },
      },
      {
        id: 'sec-carousel-01',
        type: 'product_carousel',
        position: 1,
        visible: true,
        config: {
          heading: 'Featured products',
          source: 'placement',
          placementLocation: 'featured',
          productIds: [],
          rule: null,
          count: 8,
          cardStyle: 'standard',
          viewAllHref: '/products',
          layout: {
            background: 'white',
            spacingTop: 'large',
            spacingBottom: 'medium',
            width: 'contained',
            align: 'left',
          },
        },
      },
      {
        id: 'sec-collection-01',
        type: 'collection_showcase',
        position: 2,
        visible: true,
        config: {
          collectionId: 'opel',
          coverImageId: null,
          description: 'Quiet geometry for modern spaces.',
          productIds: [],
          variant: 'split',
          layout: {
            background: 'pale',
            spacingTop: 'medium',
            spacingBottom: 'medium',
            width: 'wide',
            align: 'left',
          },
        },
      },
      {
        id: 'sec-imagetext-01',
        type: 'image_text',
        position: 3,
        visible: true,
        config: {
          heading: 'Made for the Indian ritual',
          body: '<p>Thoughtful proportions, dependable cartridges and finishes that age beautifully.</p>',
          imageId: 'med-editorial-bath',
          mobileImageId: null,
          imageSide: 'right',
          ratio: '50-50',
          mobileOrder: 'image-first',
          cta: { label: 'Why Flowtop', href: '/about' },
          layout: {
            background: 'white',
            spacingTop: 'medium',
            spacingBottom: 'medium',
            width: 'contained',
            align: 'left',
          },
        },
      },
      {
        id: 'sec-cta-01',
        type: 'cta',
        position: 4,
        visible: true,
        config: {
          heading: 'Find your finish',
          body: 'Build a bathroom with a point of view.',
          mode: 'button',
          cta: { label: 'View all products', href: '/products' },
          documentId: null,
          layout: {
            background: 'black',
            spacingTop: 'large',
            spacingBottom: 'large',
            width: 'contained',
            align: 'center',
          },
        },
      },
    ],
  },
  'opel-launch': {
    id: 'page-opel-launch',
    title: 'Opel Collection Launch',
    slug: 'opel-launch',
    status: 'published',
    seo: {
      title: 'The Opel Collection Launch | Flowtop',
      description: 'Discover the new Opel Collection. Architectural precision and understated elegance.',
      canonical: 'https://flowtop.in/opel-launch',
      shareImage: { url: '/images/hero-bath.jpg' },
    },
    sections: [
      {
        id: 'sec-opel-hero',
        type: 'hero',
        position: 0,
        visible: true,
        config: {
          headline: 'The Opel Collection',
          subheading: 'Architectural precision meets considered proportion.',
          mediaType: 'image',
          desktopImageId: 'med-hero-bath',
          mobileImageId: null,
          videoUrl: null,
          overlay: 'medium',
          textPosition: 'center',
          ctas: [{ label: 'Explore Opel', href: '/collections/opel', style: 'primary' }],
          layout: { background: 'deep', spacingTop: 'none', spacingBottom: 'large', width: 'full', align: 'center' },
        },
      },
      {
        id: 'sec-opel-carousel',
        type: 'product_carousel',
        position: 1,
        visible: true,
        config: {
          heading: 'Collection highlights',
          source: 'placement',
          placementLocation: 'featured',
          productIds: [],
          rule: null,
          count: 4,
          cardStyle: 'standard',
          viewAllHref: '/collections/opel',
          layout: { background: 'white', spacingTop: 'large', spacingBottom: 'medium', width: 'contained', align: 'left' },
        },
      },
      {
        id: 'sec-opel-cta',
        type: 'cta',
        position: 2,
        visible: true,
        config: {
          heading: 'Experience the collection',
          body: 'Visit an authorized showroom to touch and experience Flowtop brassware.',
          mode: 'button',
          cta: { label: 'Locate a showroom', href: '/locations' },
          documentId: null,
          layout: { background: 'black', spacingTop: 'large', spacingBottom: 'large', width: 'contained', align: 'center' },
        },
      },
    ],
  },
  'about': {
    id: 'page-about-001',
    title: 'The Flowtop Story',
    slug: 'about',
    status: 'published',
    seo: {
      title: 'About Flowtop | Architectural Bathfittings Engineered in India',
      description: 'Discover Flowtop: precision brassware and luxury bath fittings conceived for the modern Indian architectural ritual.',
      canonical: 'https://flowtop.in/about',
      shareImage: { url: '/images/hero-bath.jpg' },
    },
    sections: [
      {
        id: 'sec-about-hero',
        type: 'hero',
        position: 0,
        visible: true,
        config: {
          headline: 'Engineered for the Indian water ritual',
          subheading: 'Quiet luxury, architectural discipline, and brassware crafted to outlast fleeting trends.',
          mediaType: 'image',
          desktopImageId: 'med-hero-bath',
          mobileImageId: null,
          videoUrl: null,
          overlay: 'medium',
          textPosition: 'bottom-left',
          ctas: [
            { label: 'Explore Collections', href: '/collections', style: 'primary' },
            { label: 'Manufacturing & Metallurgy', href: '/manufacturing', style: 'secondary' },
          ],
          layout: { background: 'deep', spacingTop: 'none', spacingBottom: 'large', width: 'full', align: 'left' },
        },
      },
      {
        id: 'sec-about-imagetext-01',
        type: 'image_text',
        position: 1,
        visible: true,
        config: {
          heading: 'The Geometry of Restraint',
          body: 'Flowtop began with a simple observation: luxury bath fittings in India were either imported European pieces vulnerable to local water conditions or ornate fixtures lacking architectural discipline.\n\nWe designed Flowtop to bridge that divide. Clean orthogonal silhouettes, monolithic proportions, and heavy dezincification-resistant brass housings designed to honor water in modern spaces.',
          imageId: 'med-editorial-bath',
          mobileImageId: null,
          imageSide: 'right',
          ratio: '50-50',
          mobileOrder: 'image-first',
          cta: { label: 'View All Products', href: '/products' },
          layout: { background: 'white', spacingTop: 'large', spacingBottom: 'medium', width: 'contained', align: 'left' },
        },
      },
      {
        id: 'sec-about-imagetext-02',
        type: 'image_text',
        position: 2,
        visible: true,
        config: {
          heading: 'Solid Metallurgy & Kerox Discs',
          body: 'Every Flowtop piece begins as a solid virgin brass billet, forged hot and machined with 5-axis robotic CNC tools. Our ceramic disc cartridges are imported from Kerox in Hungary and Sedal in Spain.\n\nTested to 500,000 cycles, our mechanisms deliver silk-smooth modulation across high-pressure overhead showers and precision washbasin spouts alike.',
          imageId: 'med-hero-bath',
          mobileImageId: null,
          imageSide: 'left',
          ratio: '50-50',
          mobileOrder: 'image-first',
          cta: { label: 'Our Quality Standards', href: '/quality' },
          layout: { background: 'pale', spacingTop: 'medium', spacingBottom: 'large', width: 'contained', align: 'left' },
        },
      },
      {
        id: 'sec-about-cta',
        type: 'cta',
        position: 3,
        visible: true,
        config: {
          heading: 'Partner With Flowtop',
          body: 'We collaborate closely with leading architectural studios, interior designers, and luxury boutique developers across India.',
          mode: 'button',
          cta: { label: 'Connect With Trade Desk', href: '/contact' },
          documentId: null,
          layout: { background: 'black', spacingTop: 'large', spacingBottom: 'large', width: 'contained', align: 'center' },
        },
      },
    ],
  },
  'manufacturing': {
    id: 'page-manufacturing-001',
    title: 'Manufacturing & Engineering',
    slug: 'manufacturing',
    status: 'published',
    seo: {
      title: 'Manufacturing & Metallurgy | Flowtop Architectural Brassware',
      description: 'Explore the precision manufacturing processes behind Flowtop fittings: CNC machining, hand-polishing, and PVD molecular bonding.',
      canonical: 'https://flowtop.in/manufacturing',
      shareImage: { url: '/images/hero-bath.jpg' },
    },
    sections: [
      {
        id: 'sec-mfg-hero',
        type: 'hero',
        position: 0,
        visible: true,
        config: {
          headline: 'Precision In Every Micron',
          subheading: 'From raw virgin brass ingot to 0.02-micron mirror finishing.',
          mediaType: 'image',
          desktopImageId: 'med-hero-bath',
          mobileImageId: null,
          videoUrl: null,
          overlay: 'strong',
          textPosition: 'bottom-left',
          ctas: [
            { label: 'View Quality Tests', href: '/quality', style: 'primary' },
            { label: 'Browse Catalogue', href: '/products', style: 'secondary' },
          ],
          layout: { background: 'deep', spacingTop: 'none', spacingBottom: 'large', width: 'full', align: 'left' },
        },
      },
      {
        id: 'sec-mfg-imagetext-01',
        type: 'image_text',
        position: 1,
        visible: true,
        config: {
          heading: 'Sub-Millimeter Robotic CNC Machining',
          body: 'Our state-of-the-art facility utilizes high-speed multi-axis computerized numeric control machining centers.\n\nEvery valve bore, inlet thread, and internal cartridge pocket is milled to strict tolerances within +/-0.01mm, eliminating cavitation noise and ensuring flawless hydro-sealing under extreme municipal line pressure.',
          imageId: 'med-editorial-bath',
          mobileImageId: null,
          imageSide: 'left',
          ratio: '50-50',
          mobileOrder: 'image-first',
          cta: { label: 'Explore Collections', href: '/collections' },
          layout: { background: 'white', spacingTop: 'large', spacingBottom: 'medium', width: 'contained', align: 'left' },
        },
      },
      {
        id: 'sec-mfg-imagetext-02',
        type: 'image_text',
        position: 2,
        visible: true,
        config: {
          heading: 'PVD Molecular Vacuum Deposition',
          body: 'Flowtop architectural finishes — Brushed Brass, Matte Black, Rose Copper, and Brushed Nickel — are applied via Physical Vapor Deposition in vacuum plasma chambers.\n\nTitanium and zirconium ions vaporize and fuse with the brass surface at atomic levels, creating an impervious shield that resists corrosion, fingerprints, and abrasive cleaning agents.',
          imageId: 'med-hero-bath',
          mobileImageId: null,
          imageSide: 'right',
          ratio: '50-50',
          mobileOrder: 'image-first',
          cta: { label: 'Learn About Finishes', href: '/contact' },
          layout: { background: 'pale', spacingTop: 'medium', spacingBottom: 'large', width: 'contained', align: 'left' },
        },
      },
      {
        id: 'sec-mfg-cta',
        type: 'cta',
        position: 3,
        visible: true,
        config: {
          heading: 'Specification Sheets & CAD Files',
          body: 'Technical 2D dimension drawings and specification manuals are available for every Flowtop fitting.',
          mode: 'button',
          cta: { label: 'Visit Technical Support', href: '/support' },
          documentId: null,
          layout: { background: 'black', spacingTop: 'large', spacingBottom: 'large', width: 'contained', align: 'center' },
        },
      },
    ],
  },
  'quality': {
    id: 'page-quality-001',
    title: 'Quality & Testing Standards',
    slug: 'quality',
    status: 'published',
    seo: {
      title: 'Quality & Testing Standards | Flowtop Architectural Brassware',
      description: 'Rigorous hydrostatic pressure testing, 500,000 cycle durability, and neutral salt spray testing behind every Flowtop fitting.',
      canonical: 'https://flowtop.in/quality',
      shareImage: { url: '/images/hero-bath.jpg' },
    },
    sections: [
      {
        id: 'sec-quality-hero',
        type: 'hero',
        position: 0,
        visible: true,
        config: {
          headline: 'Tolerances That Defy Compromise',
          subheading: '500,000 endurance cycles, 240 hours of salt spray, and 1.6 MPa hydrostatic line testing.',
          mediaType: 'image',
          desktopImageId: 'med-hero-bath',
          mobileImageId: null,
          videoUrl: null,
          overlay: 'medium',
          textPosition: 'bottom-left',
          ctas: [
            { label: 'Browse Products', href: '/products', style: 'primary' },
            { label: 'Download Spec Guides', href: '/support', style: 'secondary' },
          ],
          layout: { background: 'deep', spacingTop: 'none', spacingBottom: 'large', width: 'full', align: 'left' },
        },
      },
      {
        id: 'sec-quality-imagetext-01',
        type: 'image_text',
        position: 1,
        visible: true,
        config: {
          heading: '100% Hydrostatic & Pneumatic Testing',
          body: 'We do not batch-test. Every single Flowtop diverter, basin mixer, and concealed rough-in body is individually submerged in pneumatic air-testing tanks at 0.6 MPa.\n\nUnits are subsequently tested under 1.6 MPa water pressure to guarantee zero pinhole casting defects, weld failures, or pressure drops.',
          imageId: 'med-editorial-bath',
          mobileImageId: null,
          imageSide: 'right',
          ratio: '50-50',
          mobileOrder: 'image-first',
          cta: { label: 'Explore Concealed Diverters', href: '/category/diverters' },
          layout: { background: 'white', spacingTop: 'large', spacingBottom: 'medium', width: 'contained', align: 'left' },
        },
      },
      {
        id: 'sec-quality-imagetext-02',
        type: 'image_text',
        position: 2,
        visible: true,
        config: {
          heading: 'Corrosion & Acid Salt Spray Testing',
          body: 'Indian tap water presents unique challenges: high total dissolved solids (TDS), salinity, and varied mineral content.\n\nAll Flowtop electroplated and PVD finishes undergo continuous 240-hour Neutral Salt Spray (NSS) and CASS testing in certified environmental simulation chambers, exceeding IS 13901 and EN 817 specifications.',
          imageId: 'med-hero-bath',
          mobileImageId: null,
          imageSide: 'left',
          ratio: '50-50',
          mobileOrder: 'image-first',
          cta: { label: 'Warranty Policy', href: '/support' },
          layout: { background: 'pale', spacingTop: 'medium', spacingBottom: 'large', width: 'contained', align: 'left' },
        },
      },
      {
        id: 'sec-quality-cta',
        type: 'cta',
        position: 3,
        visible: true,
        config: {
          heading: '10-Year Comprehensive Warranty',
          body: 'Every Flowtop domestic architectural fitting is backed by our full 10-year manufacturer warranty.',
          mode: 'button',
          cta: { label: 'Contact Customer Care', href: '/support' },
          documentId: null,
          layout: { background: 'black', spacingTop: 'large', spacingBottom: 'large', width: 'contained', align: 'center' },
        },
      },
    ],
  },
  'privacy': {
    id: 'page-privacy-001',
    title: 'Privacy Policy & Data Protection',
    slug: 'privacy',
    status: 'published',
    template: 'legal',
    updatedAt: '2026-10-28T00:00:00Z',
    seo: {
      title: 'Privacy Policy | Flowtop Architectural Brassware',
      description: 'Flowtop Privacy Policy: How we collect, process, and protect your digital personal data under the Digital Personal Data Protection Act, 2023.',
      canonical: 'https://flowtop.in/privacy',
    },
    sections: [],
    content: `
### 1. Overview & Data Fiduciary Details
Flowtop Brassware India Pvt. Ltd. ("Flowtop", "we", "our", or "us") is dedicated to protecting the privacy of our website visitors, customers, and trade partners. This policy outlines our standards for gathering, utilizing, and safeguarding personal data in compliance with India's **Digital Personal Data Protection Act, 2023 (DPDP Act)** and applicable electronic data regulations.

### 2. Information We Collect
We collect personal information directly provided by you during transactions, trade enquiries, and concierge communications:
- **Contact Identifiers:** Full name, business affiliation, email address, telephone and WhatsApp number.
- **Delivery & Billing Coordinates:** Physical delivery address, pincode, state, and GST identification number for registered trade partners.
- **Order & Technical Transactions:** Purchase details, SKU references, invoice numbers, and payment reference tokens generated by our Reserve Bank of India-authorized payment gateway. (Note: Flowtop never stores complete credit card numbers, CVV codes, or net banking credentials on our servers).
- **Technical & Device Telemetry:** Anonymized IP addresses, browser specifications, operating system telemetry, and session analytics collected strictly to enhance website responsiveness.

### 3. Purpose of Processing
Your data is processed strictly for legitimate architectural commerce purposes:
- Fulfilling, tracking, and dispatching orders placed through our digital storefront.
- Responding to trade enquiries, technical product specification requests, and CAD file distributions.
- Sending transactional SMS, email confirmations, and authorized WhatsApp updates regarding dispatch and delivery milestones.
- Preventing automated fraud, bot abuse, and maintaining server integrity.

### 4. Data Principal Rights under DPDP Act 2023
As a Data Principal, you maintain explicit statutory rights:
- **Right to Access:** Request a summary of personal data processed by Flowtop.
- **Right to Correction & Erasure:** Update inaccurate information or request deletion of obsolete records, subject to statutory tax and auditing obligations.
- **Right of Grievance Redressal:** Contact our designated Data Protection Officer regarding data handling inquiries.
- **Right to Nominate:** Nominate an authorized representative in accordance with DPDP regulations.

### 5. Third-Party Disclosures & Security Safeguards
We do not sell, rent, or trade your personal data. Disclosures are limited to authorized logistics carriers (for nationwide freight delivery) and RBI-licensed payment processors. All data in transit is protected using TLS 1.3 cryptographic encryption and stored in ISO 27001-certified Indian data centers.

### 6. Contact & Grievance Officer
For privacy requests or inquiries, reach our Data Protection Officer at:  
**Email:** privacy@flowtop.in  
**Address:** Flowtop Architectural Brassware, Indiranagar, Bengaluru, Karnataka 560038, India.
    `,
  },
  'terms': {
    id: 'page-terms-001',
    title: 'Terms of Service',
    slug: 'terms',
    status: 'published',
    template: 'legal',
    updatedAt: '2026-10-28T00:00:00Z',
    seo: {
      title: 'Terms of Service | Flowtop Architectural Brassware',
      description: 'Flowtop terms of service, commercial purchase terms, architectural specifications, and warranty provisions.',
      canonical: 'https://flowtop.in/terms',
    },
    sections: [],
    content: `
### 1. Acceptance of Terms
By accessing or purchasing from the Flowtop website (flowtop.in), you acknowledge and accept these Terms of Service. If you are entering into this agreement on behalf of a corporate entity, architectural firm, or development firm, you represent that you hold full authorization to bind such entity.

### 2. Product Specifications & Architectural Drawings
Flowtop makes every effort to accurately depict brassware dimensions, finishes, and functional ratings. However, due to individual monitor calibrations and handcrafted artisan polishing, slight variations in finish patina may occur. Technical CAD diagrams and specification sheets provided on our support portal should always be verified against site rough-in dimensions before physical installation.

### 3. Pricing, Ordering & Quotations
All prices are displayed in Indian Rupees (INR) inclusive of applicable Goods and Services Tax (GST). All orders placed are subject to acceptance by Flowtop. In the unlikely event that an item is listed at an incorrect price due to a system error, Flowtop reserves the right to cancel the order and provide an immediate 100% refund.

### 4. 10-Year Domestic Warranty Terms
Flowtop brassware carries a comprehensive 10-year manufacturer warranty against casting defects, porosity, and ceramic cartridge failure for domestic residential installations. Commercial, hospitality, and public washroom installations carry a 5-year warranty. The warranty excludes damage resulting from improper installation, lime-scale accumulation due to untreated borehole water, or abrasive acidic cleaners.

### 5. Governing Law & Jurisdiction
These Terms are governed by the laws of the Republic of India. Any legal dispute, arbitration, or proceeding arising under these Terms shall be subject to the exclusive jurisdiction of the competent courts of Bengaluru, Karnataka.
    `,
  },
  'shipping': {
    id: 'page-shipping-001',
    title: 'Shipping & Delivery Policy',
    slug: 'shipping',
    status: 'published',
    template: 'legal',
    updatedAt: '2026-10-28T00:00:00Z',
    seo: {
      title: 'Shipping & Delivery Policy | Flowtop Architectural Brassware',
      description: 'Nationwide transit timelines, white-glove packaging, transit insurance, and delivery terms for Flowtop architectural bath fittings.',
      canonical: 'https://flowtop.in/shipping',
    },
    sections: [],
    content: `
### 1. Nationwide Delivery Coverage
Flowtop partners with premier express freight logistics providers to service over 19,000 postal pincodes across India. Every shipment is fully insured in transit against physical damage or loss.

### 2. Dispatch & Transit Timelines
- **Order Processing:** Standard in-stock orders are carefully inspected, padded in custom foam-molded packaging, and dispatched within 24 to 48 hours from our central warehouse.
- **Metro Deliveries:** Delivery to Bengaluru, Mumbai, Delhi NCR, Hyderabad, Chennai, and Kolkata typically completes within 2 to 4 business days.
- **Tier 2 & Rest of India:** Delivery to regional centers takes 4 to 7 business days depending on transit routes.
- **Custom Finishes:** Bespoke PVD finishes (Rose Copper, Brushed Gold) require a dedicated 10-day curing cycle and will dispatch upon quality inspection.

### 3. White-Glove Heavy Freight
Freestanding bath fillers and thermostatic columns are classified as oversized architectural fittings. These pieces are delivered via dedicated cargo logistics with tail-lift trucks and foam shock-absorption boxing to prevent denting or hairline scratching.

### 4. Inspection upon Delivery & Transit Claims
We advise customers and project site supervisors to inspect the outer seal upon receipt. In the improbable event that external packaging shows signs of tampering or severe crushing, please note the exception on the carrier's proof of delivery receipt and notify Flowtop Care within 48 hours for immediate replacement dispatch.
    `,
  },
  'refunds': {
    id: 'page-refunds-001',
    title: 'Returns & Refund Policy',
    slug: 'refunds',
    status: 'published',
    template: 'legal',
    updatedAt: '2026-10-28T00:00:00Z',
    seo: {
      title: 'Returns & Refund Policy | Flowtop Architectural Brassware',
      description: 'Flowtop returns, replacement guarantees, and refund processing procedures for architectural brassware.',
      canonical: 'https://flowtop.in/refunds',
    },
    sections: [],
    content: `
### 1. 14-Day Architectural Return Window
Flowtop offers a 14-day return window from the date of recorded delivery for unused, uninstalled fittings in their complete original packaging. We understand that architectural plans evolve; our return policy is designed to give homeowners and specifiers total peace of mind.

### 2. Return Eligibility Criteria
To qualify for a full refund or exchange:
- The product must be brand new, uninstalled, and free from plumber wrench marks, scratches, or pipe-sealant residue.
- All original components, mounting brackets, aerator keys, and protective microfibre sleeves must be included in the original branded packaging.
- Bespoke custom-milled or project-specific finishes are non-refundable once production has commenced.

### 3. Replacement Guarantee for Manufacturing Defects
If a product exhibits a manufacturing defect or cartridge irregularity upon installation, Flowtop will immediately dispatch an advance replacement piece at zero cost to the client.

### 4. Refund Processing Timelines
Once returned fittings arrive at our central inspection facility, our quality engineers verify the unit within 48 hours. Upon approval:
- Refunds are initiated immediately to your original payment method (Credit Card, Net Banking, UPI).
- Bank processing typically completes within 5 to 7 business days, depending on your card issuer.
- An official credit note and refund receipt will be emailed to your billing address.
    `,
  },
};

export function getMockPage(slug: string): SingleResponse<PageResponse> | null {
  const page = mockPages[slug];
  if (!page) {
    return null;
  }
  return { data: page };
}
