# Dev E — Animated 3D Hero (Flowtop Bathfittings)

Self-contained, feature-flagged 3D Product Hero component for Flowtop.

## 3D Architectural Rules & Constraints

1. **Feature Flag Controlled**: Read from `GET /settings/public` at key `homepage.hero3d.enabled` (or query param `?hero3d=true|false`). When false or deferred, zero Three.js JavaScript is loaded into the browser.
2. **Accessible DOM Hierarchy**: The `<h1>`, subline, and CTA buttons are real DOM elements outside the WebGL canvas. The canvas container is strictly `aria-hidden="true"`.
3. **Mobile & Low-Tier Device Protection (Non-Negotiable)**: On viewport width < 768px, or `navigator.deviceMemory < 4`, or `prefers-reduced-motion: reduce`, the canvas is **never mounted**. A lightweight vector/raster fallback is served instead with zero WebGL overhead.
4. **No Hardcoded Model Paths**: Paths are dynamically supplied via settings or props.
5. **Brand Tokens Only**: Uses Flowtop Tailwind tokens (`purple-deep`, `purple-light`, `purple-pale`, `ink`, `surface-white`). No magic numbers or ad-hoc hex values.

---

## Sub-Mesh Naming Contract for 3D Models

To allow runtime PVD material swaps (Mirror Chrome, Brushed Gold, Matte Black, Rose Gold) without re-loading geometries or leaking memory, any GLB supplied by 3D modelers **must** conform to this sub-mesh naming hierarchy:

| Sub-Mesh Name | Role & Description | Target Material |
|---|---|---|
| `body` | Main cylindrical monobloc base, collar flange, and escutcheon | Swappable `MeshPhysicalMaterial` |
| `handle` | Single-lever ergonomic cartridge pivot and paddle | Swappable `MeshPhysicalMaterial` |
| `spout` | Architectural high-arc water delivery spout | Swappable `MeshPhysicalMaterial` |
| `aerator` | Precision recessed nozzle collar and flow regulator | Dark brushed accent `MeshPhysicalMaterial` |

---

## Exact Specification to Request from Flowtop

Send the following specification directly to Flowtop's 3D/CAD department:

> **Specification for Flowtop Hero Product 3D Assets**
>
> For each hero product, provide one **GLB** file:
> 1. **Orientation & Scale**: Y-up, real-world scale in millimetres, origin at the base centre.
> 2. **Geometry Budget**: Under 50,000 triangles total. Clean manifold geometry.
> 3. **Sub-Mesh Naming**: Explicitly name sub-meshes: `body`, `handle`, `spout`, `aerator`.
> 4. **UV & Textures**: Single UV map (Channel 0), with a single 2048×2048 texture set (ambient occlusion / cavity only).
> 5. **No Baked Color**: Do not bake in color or finish textures — materials are dynamically applied in real-time code.
> 6. **No Embedded Animation**: The rotation, camera choreographies, and water streams are driven programmatically.
>
> **Deliverable Format**:
> - Binary GLTF (`.glb`) compressed with Draco or Meshopt.
> - One high-res transparent PNG render (2048×2048) of each of the 4 finishes (`chrome`, `brushed-gold`, `matte-black`, `rose-gold`) for mobile fallbacks.
> - Do not submit `.max`, `.skp`, `.obj`, or `.dwg` CAD files.

---

## Component Architecture

- `HeroSection.tsx`: Server/wrapper component evaluating the feature flag, client device capabilities, and reduced-motion preferences. Conditionally mounts `Hero3DCanvas` via `React.lazy`.
- `Hero3DCanvas.tsx`: Three.js Canvas with ACESFilmic tone mapping, SRGB color space, directional studio lighting, and contact shadows.
- `TapModel.tsx`: Procedural high-fidelity placeholder monobloc tap with named sub-meshes and smooth 250ms lerp finish transitions.
- `FinishSwatches.tsx`: Keyboard-accessible swatch buttons with `aria-pressed` and tooltips.
- `useFinish.ts`: Lightweight state store synchronizing active finish across canvas and UI controls.
- `Hero3DFallback.tsx`: Zero-JS fallback rendering the active finish on mobile or when the flag is disabled.
