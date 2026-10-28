'use client';

import {
  createContext,
  useContext,
  type ComponentType,
  type ReactNode,
  type AnchorHTMLAttributes,
} from 'react';
import { ToastProvider } from '../Toast';

export interface PictureProps {
  desktopSrc: string;
  mobileSrc?: string | null;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  width?: number;
  height?: number;
}

export type PictureComponent = ComponentType<PictureProps>;

/**
 * Default HTML5 <picture> implementation for art direction.
 * Displays mobileSrc below 768px, falling back to desktopSrc.
 */
export function DefaultPicture({
  desktopSrc,
  mobileSrc,
  alt,
  sizes,
  priority = false,
  className = '',
  width,
  height,
}: PictureProps) {
  const safeAlt = typeof alt === 'string' && alt.trim().length > 0 ? alt : '';
  if (!safeAlt) {
    console.warn('[Picture] Missing alt text; providing decorative alt="".');
  }

  return (
    <picture>
      {mobileSrc && <source media="(max-width: 767px)" srcSet={mobileSrc} />}
      <img
        src={desktopSrc}
        alt={safeAlt}
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        className={className}
        width={width}
        height={height}
      />
    </picture>
  );
}

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  className?: string;
  children: ReactNode;
}

export type LinkComponent = ComponentType<LinkProps>;

export function DefaultLink({ href, children, className = '', ...props }: LinkProps) {
  return (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  );
}

export interface UiContextValue {
  Picture: PictureComponent;
  Link: LinkComponent;
}

const UiContext = createContext<UiContextValue>({
  Picture: DefaultPicture,
  Link: DefaultLink,
});

export interface UiProviderProps {
  Picture?: PictureComponent;
  Link?: LinkComponent;
  children: ReactNode;
}

/**
 * UiProvider
 *
 * Provides shared context for Flowtop UI components:
 * - Art-directed Picture slot (allows Next.js getImageProps integration in frontend/)
 * - Link navigation slot (allows Next.js <Link> integration in frontend/)
 * - Toast notification context
 */
export function UiProvider({
  Picture = DefaultPicture,
  Link = DefaultLink,
  children,
}: UiProviderProps) {
  return (
    <UiContext.Provider value={{ Picture, Link }}>
      <ToastProvider>{children}</ToastProvider>
    </UiContext.Provider>
  );
}

/**
 * Access the configured Picture component for art direction.
 */
export function usePicture(): PictureComponent {
  const ctx = useContext(UiContext);
  return ctx?.Picture || DefaultPicture;
}

/**
 * Access the configured Link component for navigation.
 */
export function useLink(): LinkComponent {
  const ctx = useContext(UiContext);
  return ctx?.Link || DefaultLink;
}
