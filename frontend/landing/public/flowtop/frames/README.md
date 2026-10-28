# Flowtop Hero Animation Frames Directory

This directory is the designated location for the Google Flow / 3D rendered hero tap sequence.

## Asset Convention

1. **Format:** WebP or AVIF (or optimized PNG/JPG)
2. **Resolution:** 1920x1080 (landscape) or 1080x1080 (square/portrait adaptive)
3. **Naming Scheme:** `tap_frame_0001.webp`, `tap_frame_0002.webp`, ... up to `tap_frame_0120.webp`
4. **Manifest:** Update `manifest.json` with the list of relative paths.

## Progressive Loading
The `FrameSequenceCanvas` component automatically:
- Preloads the initial keyframe immediately to satisfy LCP.
- Preloads nearby frames dynamically as the user scrolls.
- Falls back to `HeroFallback` (vector-driven architectural tap model) if `manifest.json` has `frames: []` or if image fetching encounters an error.
