import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  { ignores: ['dist/**', 'coverage/**', 'src/generated/**', 'eslint.config.mjs'] },
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      // The image build context is backend/. shared/ and @flowtop/types are not in that image.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../shared', '../shared/**', '**/shared', '**/shared/**', '@flowtop/types', '@flowtop/types/**'],
              message:
                'Do not import from shared/ or @flowtop/types. The Docker build context is backend/, so nothing outside backend/ exists when the image is built. Keep the type in backend/src. shared/types is for the frontend and the admin.',
            },
          ],
        },
      ],
    },
  },
  {
    // Tests are not copied into the image. The drift test imports shared/types on purpose.
    files: ['**/*.spec.ts', 'test/**/*.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
);
