import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

// Type errors are astro check's job, so nothing here duplicates it. What is left is the
// class of mistake a type checker is happy with: an unused import, a floating promise in
// page frontmatter, a mistyped attribute in a template.
export default [
  { ignores: ['dist/', '.astro/', 'node_modules/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    rules: {
      // The service's own responses drive the templates, so an unused variable is
      // usually a field that got renamed on the other side.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
];
