// TODO(mock): replace on swap day
/**
 * Mock data for Flowtop Support Page
 * Contract: FAQs, Downloadable Care Guides & Manuals, and Warranty Notice
 */

import type { SupportDataResponse, SingleResponse } from '../types-pending';

export const mockSupportData: SupportDataResponse = {
  categories: [
    'All Categories',
    'Installation & Compatibility',
    'Care & Maintenance',
    'Finishes & Metallurgy',
    'Warranty & Service',
  ],
  faqs: [
    {
      id: 'faq-01',
      category: 'Installation & Compatibility',
      question: 'What water pressure is required for Flowtop thermostatic showers?',
      answer:
        'Flowtop thermostatic shower systems require a recommended minimum dynamic pressure of 1.5 bar (0.15 MPa). For the ultimate cascade rain experience, we recommend an operating range between 2.5 and 3.5 bar. If your home is supplied by an overhead gravity tank with low head height, an inline pressure booster pump should be installed before the bathroom manifold.',
    },
    {
      id: 'faq-02',
      category: 'Installation & Compatibility',
      question: 'Are Flowtop basin mixers compatible with standard Indian plumbing inlets?',
      answer:
        'Yes. All Flowtop deck-mount and wall-mount fittings feature standard G 1/2" BSP threaded inlets. Each mixer ships with a pair of 450mm high-durability stainless steel braided flexible hoses with EPDM inner tubing conforming to Indian plumbing codes.',
    },
    {
      id: 'faq-03',
      category: 'Installation & Compatibility',
      question: 'Can Flowtop concealed diverters be installed in lightweight dry-wall partitions?',
      answer:
        'Our universal concealed diverter bodies require a minimum finished cavity depth of 65mm (maximum 90mm with trim plate compensation). For lightweight partition walls or gypsum dry-lining, mounting brackets with vibration dampeners must be secured to structural stud frames.',
    },
    {
      id: 'faq-04',
      category: 'Care & Maintenance',
      question: 'How should I clean Flowtop PVD finishes (Matte Black, Brushed Brass, Rose Copper)?',
      answer:
        'Clean surfaces using only a clean, soft microfibre cloth dampened with warm water and mild liquid soap (pH 7). Rinse thoroughly and buff dry with a second clean microfibre cloth. NEVER use hydrochloric acid, bathroom tile descalers, abrasive scouring pads, or bleach, as harsh chemical vapors can etch protective sealants.',
    },
    {
      id: 'faq-05',
      category: 'Care & Maintenance',
      question: 'What should I do if the tap flow rate drops over time due to hard water?',
      answer:
        'Flow reduction in hard-water environments is almost always caused by mineral calcification inside the Swiss Neoperl aerator. Simply unscrew the aerator from the spout tip using the included silicone service key, submerge it in a 50/50 mixture of warm water and white vinegar for 30 minutes, rinse away softened debris, and reinstall.',
    },
    {
      id: 'faq-06',
      category: 'Finishes & Metallurgy',
      question: 'What brass alloy is used in Flowtop architectural fittings?',
      answer:
        'Flowtop manufactures exclusively with virgin Grade A dezincification-resistant (DZR) brass ingot conforming to IS 1264 and European standard CW617N. This prevents internal dezincification leaching in saline borehole water and ensures zero toxic heavy-metal contamination in drinking water lines.',
    },
    {
      id: 'faq-07',
      category: 'Finishes & Metallurgy',
      question: 'How durable is the Physical Vapor Deposition (PVD) finish compared to plating?',
      answer:
        'Standard electroplating applies a thin metallic film over nickel. Flowtop PVD vaporizes titanium and zirconium ions in a high-vacuum plasma chamber at 400°C, molecularly bonding the coating into the outer crystal lattice of the brass. This creates a surface 4× harder than chrome, impervious to peeling, tarnishing, or corrosion.',
    },
    {
      id: 'faq-08',
      category: 'Warranty & Service',
      question: 'What is covered under Flowtop’s 10-Year Manufacturer Warranty?',
      answer:
        'Our 10-year domestic warranty covers casting structural integrity, body porosity, and Kerox ceramic disc cartridge failure for residential installations. Electrical components on sensor faucets carry a 2-year warranty, and commercial installations are warrantied for 5 years. Retain your invoice or order number for verification.',
    },
    {
      id: 'faq-09',
      category: 'Warranty & Service',
      question: 'Are replacement cartridges, valves, and aerators permanently available?',
      answer:
        'Yes. We maintain a dedicated spare-parts depot in Bengaluru with guaranteed 10-year availability for all internal mechanical components, including Kerox ceramic cartridges, thermostatic waxing elements, check valves, and diverter flutes.',
    },
  ],
  manualProductTypes: [
    'Basin Mixers & Taps',
    'Thermostatic Showers & Diverters',
    'Bath Fillers & Spouts',
    'Kitchen Faucets',
  ],
  manuals: [
    {
      id: 'man-01',
      title: 'Aura & Neo Basin Mixer Technical Installation Guide',
      productType: 'Basin Mixers & Taps',
      fileSize: '2.4 MB',
      fileType: 'PDF',
      downloadUrl: '/documents/flowtop-basin-mixer-manual.pdf',
    },
    {
      id: 'man-02',
      title: 'Arc Sensor Tap Electrical Rough-in & Solenoid Manual',
      productType: 'Basin Mixers & Taps',
      fileSize: '1.8 MB',
      fileType: 'PDF',
      downloadUrl: '/documents/flowtop-arc-sensor-manual.pdf',
    },
    {
      id: 'man-03',
      title: 'Concealed 2-Way & 3-Way Thermostatic Valve Guide',
      productType: 'Thermostatic Showers & Diverters',
      fileSize: '4.2 MB',
      fileType: 'PDF',
      downloadUrl: '/documents/flowtop-thermostatic-valve-manual.pdf',
    },
    {
      id: 'man-04',
      title: 'Cascade Rain Showerhead & Ceiling Arm Plumbing Guide',
      productType: 'Thermostatic Showers & Diverters',
      fileSize: '2.1 MB',
      fileType: 'PDF',
      downloadUrl: '/documents/flowtop-cascade-shower-guide.pdf',
    },
    {
      id: 'man-05',
      title: 'Freestanding Bath Filler Floor Anchor & Plumbing Guide',
      productType: 'Bath Fillers & Spouts',
      fileSize: '3.6 MB',
      fileType: 'PDF',
      downloadUrl: '/documents/flowtop-freestanding-bath-filler-manual.pdf',
    },
    {
      id: 'man-06',
      title: 'Wall-Mount Bath Spout Specification & Aerator Maintenance',
      productType: 'Bath Fillers & Spouts',
      fileSize: '1.6 MB',
      fileType: 'PDF',
      downloadUrl: '/documents/flowtop-bath-spout-manual.pdf',
    },
    {
      id: 'man-07',
      title: 'Aura Chef Kitchen Mixer Pull-Out Spray Installation',
      productType: 'Kitchen Faucets',
      fileSize: '2.8 MB',
      fileType: 'PDF',
      downloadUrl: '/documents/flowtop-chef-kitchen-manual.pdf',
    },
    {
      id: 'man-08',
      title: 'Architectural PVD Finish Care & Maintenance Protocol',
      productType: 'Basin Mixers & Taps',
      fileSize: '1.2 MB',
      fileType: 'PDF',
      downloadUrl: '/documents/flowtop-finish-care-guide.pdf',
    },
  ],
  warrantyNotice: {
    title: 'Warranty Registration & Service Claims',
    standardDurationYears: 10,
    description:
      'Every Flowtop domestic architectural fitting is backed by our full 10-year manufacturer warranty covering brass structural integrity and internal ceramic disc cartridges.',
    comingSoonMessage:
      'Online warranty registration and self-service claims portal is coming soon. All Flowtop architectural brassware remains fully covered under warranty from the date of purchase. Please retain your invoice or delivery confirmation for verification.',
  },
};

export function resolveMockSupportData(): SingleResponse<SupportDataResponse> {
  return {
    data: mockSupportData,
  };
}
