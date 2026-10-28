export interface StoryChapter {
  id: string;
  minProgress: number;
  maxProgress: number;
  index: string;
  label: string;
  eyebrow: string;
  headline: string;
  narrative: string;
  attributes: { label: string; value: string }[];
  accentTag: string;
}

export const HERO_CHAPTERS: StoryChapter[] = [
  {
    id: 'ch-form',
    minProgress: 0.0,
    maxProgress: 0.16,
    index: '01',
    label: 'Sculptural Form',
    eyebrow: 'Monolithic Silhouette • The Opel Range',
    headline: 'Architectural Form Crafted for Modern Sanctuaries',
    narrative:
      'Pure orthogonal geometry meets substantial machined brass. A singular sculptural presence designed to anchor contemporary residential and hospitality bath spaces with quiet authority.',
    accentTag: 'Monobloc Architecture',
    attributes: [
      { label: 'Form Factor', value: 'Monobloc Mixer' },
      { label: 'Surface Finish', value: 'Specular Mirror Chrome' },
    ],
  },
  {
    id: 'ch-material',
    minProgress: 0.16,
    maxProgress: 0.35,
    index: '02',
    label: 'Material & Detail',
    eyebrow: 'Forged Metallurgy • Macro Precision',
    headline: 'Curved Spout Contours & Specular Reflections',
    narrative:
      'Inspecting every chamfered bevel and seamless transition. Heavy dezincification-resistant brass casting with calibrated wall thickness provides acoustic dampening, structural permanence, and reassuring tactile weight.',
    accentTag: 'Solid Brass Core',
    attributes: [
      { label: 'Core Metallurgy', value: 'Dezincification-Resistant Brass' },
      { label: 'Surface Standard', value: 'Multi-Layer Specular Polish' },
    ],
  },
  {
    id: 'ch-transformation',
    minProgress: 0.35,
    maxProgress: 0.6,
    index: '03',
    label: 'Transformation',
    eyebrow: 'Mechanical Precision • Deconstructed Motion',
    headline: 'Kinematic Separation: The Core Unfolds',
    narrative:
      'As the monolithic body separates in controlled kinematic harmony, the handle, collar, cartridge, and aerator diverge—revealing an internal assembly engineered with micron-level tolerances.',
    accentTag: 'Kinematic Separation',
    attributes: [
      { label: 'Tolerance Standard', value: 'Micron-Level Machining' },
      { label: 'Internal Housing', value: 'High-Pressure Isolation Chamber' },
    ],
  },
  {
    id: 'ch-exploded',
    minProgress: 0.6,
    maxProgress: 0.8,
    index: '04',
    label: 'Exploded Reveal',
    eyebrow: 'Internal Mastery • Suspended Array',
    headline: 'Suspended Architecture: Component Mastery',
    narrative:
      'Hovering in deconstructed alignment, every internal element serves an exact hydrodynamic purpose. A diamond-hard ceramic disc cartridge delivers fluid, frictionless quarter-turn control with zero plastic in the primary flow channel.',
    accentTag: 'Ceramic Micromotion',
    attributes: [
      { label: 'Internal Cartridge', value: 'Diamond-Hard Ceramic Core' },
      { label: 'Valve Mechanism', value: 'Frictionless Quarter-Turn' },
    ],
  },
  {
    id: 'ch-reconstruction',
    minProgress: 0.8,
    maxProgress: 1.0,
    index: '05',
    label: 'Reconstruction',
    eyebrow: 'Hydraulic Harmony • Unified Whole',
    headline: 'Reconstruction: The Complete Architectural Instrument',
    narrative:
      'Components converge back into a hermetically sealed monolithic body. The integrated Swiss Neoperl aerator shapes water into a calm, splash-free laminar column—elevating handwashing into a daily architectural ritual.',
    accentTag: 'Pure Laminar Flow',
    attributes: [
      { label: 'Stream Delivery', value: 'Anti-Splash Aerated Stream' },
      { label: 'Structural Seal', value: 'Triple EPDM Pressure Rings' },
    ],
  },
];
