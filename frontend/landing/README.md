# Flowtop Bathfittings — Public Landing Page

A self-contained, high-performance public landing page prototype for Flowtop Bathfittings built with React, TypeScript, Vite, and Tailwind CSS.

## Architecture

This landing page follows the data contracts established in `docs/03-api-contract.md`:

- **Contracted Section Renderer (`SectionRenderer`):**
  Accepts dynamic `Section[]` configs and renders:
  1. `hero`: Signature architectural showroom with scroll-controlled component exploration.
  2. `product_carousel`: Curated product discovery with Indian Rupee formatting from sample integer paise.
  3. `collection_showcase`: The Opel Series spotlight.
  4. `image_text`: Editorial philosophy on brass materiality and craftsmanship.
  5. `gallery`: Architectural environments & installations with interactive lightbox.
  6. `cta`: Project consultation and finish enquiries.

- **Brand Design Tokens (`frontend/AGENTS.md`):**
  - `--purple-deep: #5B2A86`
  - `--purple-light: #9B6FC4`
  - `--purple-pale: #F4EEFA`
  - `--ink: #16121C`
  - `--white: #FFFFFF`
  - Strict 360px zero horizontal overflow & 44px minimum touch targets.

## Frame Sequence Scrubber Pipeline

The hero section uses `FrameSequenceCanvas` with `requestAnimationFrame` throttling and progressive preloading:
- Frame sequence assets are loaded from `public/flowtop/frames/`.
- Manifest configuration is located at `public/flowtop/frames/manifest.json`.
- When the video/frame assets are not yet available or still rendering, the system automatically displays `HeroFallback`, which renders an interactive architectural component study of the Flowtop tap.

## Development & Build

From the `frontend/landing/` directory:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run TypeScript check & production build
npm run build
```
