// packages/ui ships the preset as CommonJS with no types. Typed as a Tailwind preset so tsc can check tailwind.config.ts.
declare module '@flowtop/ui/tailwind-preset' {
  import type { Config } from 'tailwindcss';
  const preset: Partial<Config>;
  export default preset;
}
