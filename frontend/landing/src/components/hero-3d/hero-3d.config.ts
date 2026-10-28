/**
 * Dev E — 3D Hero Configuration & Brand Tokens
 * Source of truth for 3D finishes, lighting, camera choreography, and feature flag keys.
 */

export const HERO_3D_FLAG_KEY = 'homepage.hero3d.enabled';
export const HERO_3D_MODEL_KEY = 'homepage.hero3d.modelUrl';

export type FinishId = 'chrome' | 'brushed-gold' | 'matte-black' | 'rose-gold';

export interface FinishDefinition {
  id: FinishId;
  name: string;
  subtitle: string;
  metalness: number;
  roughness: number;
  color: string;
  clearcoat: number;
  clearcoatRoughness: number;
  swatchHex: string;
  swatchBorderHex: string;
  specSummary: string;
}

export const FINISH_DEFINITIONS: Record<FinishId, FinishDefinition> = {
  chrome: {
    id: 'chrome',
    name: 'Mirror Chrome',
    subtitle: 'Triple-plated high luster polish',
    metalness: 1.0,
    roughness: 0.05,
    color: '#F4F4F8',
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    swatchHex: '#E2E8F0',
    swatchBorderHex: '#CBD5E1',
    specSummary: 'Diamond-like specular reflection with electroplated nickel-chrome finish',
  },
  'brushed-gold': {
    id: 'brushed-gold',
    name: 'Brushed Gold',
    subtitle: 'Warm architectural PVD satin',
    metalness: 0.95,
    roughness: 0.35,
    color: '#D4AF37',
    clearcoat: 0.3,
    clearcoatRoughness: 0.25,
    swatchHex: '#D4AF37',
    swatchBorderHex: '#B59428',
    specSummary: 'Physical Vapor Deposition (PVD) treated brushed champagne gold',
  },
  'matte-black': {
    id: 'matte-black',
    name: 'Matte Black',
    subtitle: 'Deep electro-deposition velvet',
    metalness: 0.60,
    roughness: 0.70,
    color: '#1A181C',
    clearcoat: 0.0,
    clearcoatRoughness: 0.50,
    swatchHex: '#1A181C',
    swatchBorderHex: '#383340',
    specSummary: 'Tactile anti-fingerprint powder coating with ultra-matte velvet finish',
  },
  'rose-gold': {
    id: 'rose-gold',
    name: 'Rose Gold',
    subtitle: 'Lustrous warm copper undertone',
    metalness: 0.90,
    roughness: 0.20,
    color: '#C58F84',
    clearcoat: 0.8,
    clearcoatRoughness: 0.15,
    swatchHex: '#C58F84',
    swatchBorderHex: '#A66D63',
    specSummary: 'Refined rose-tinted PVD bronze alloy with polished micro-radiance',
  },
};

export const FINISH_LIST: FinishDefinition[] = Object.values(FINISH_DEFINITIONS);

export const CAMERA_CONFIG = {
  fov: 35,
  initialPosition: [0, 0.9, 3.8] as [number, number, number],
  target: [0, 0.45, 0] as [number, number, number],
  // Scroll Choreography (Phase E.4):
  // orbit 40° right (+0.70 rad), pull back 15% (* 1.15), lower 5% (-0.05)
  scrollOrbitAngleMax: (40 * Math.PI) / 180,
  scrollPullbackMultiplier: 0.15,
  scrollLowerOffset: 0.05,
  idleRotationSpeedRadPerSec: (6 * Math.PI) / 180, // ~6° per second
};
