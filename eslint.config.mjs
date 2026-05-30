import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';

export default [
  { files: ['**/*.{js,mjs,cjs,ts}'] },
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  pluginJs.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    ignores: [
      'src/generated/**/*',
      'dist/**/*',
      'eslint.config.mjs',
    ],
  },
  {
    plugins: { '@stylistic': stylistic },
    rules: {
      '@stylistic/quotes': ['error', 'single'],
      '@stylistic/no-trailing-spaces': ['error'],
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
      '@stylistic/comma-style': ['error', 'last'],
      '@stylistic/no-multiple-empty-lines': ['error', {
        max: 1,
        maxEOF: 0,
      }],
      'object-shorthand': ['error'],
      '@stylistic/quote-props': ['error', 'as-needed'],
      'prefer-destructuring': ['error', {
        array: false,
        object: true,
      }],
      '@stylistic/object-curly-newline': ['error', {
        ObjectExpression:  {
          multiline: true,
          minProperties: 3,
        },
        ObjectPattern:  {
          multiline: true,
          minProperties: 3,
        },
        ImportDeclaration:  {
          multiline: true,
          minProperties: 3,
        },
        ExportDeclaration: {
          multiline: true,
          minProperties: 3,
        },
      }],
      '@stylistic/object-curly-spacing': ['error', 'always'],
      '@stylistic/space-infix-ops': ['error'],
      '@stylistic/semi': ['error'],
      '@stylistic/object-property-newline': ['error'],
      '@stylistic/indent': ['error', 2],
      '@stylistic/type-annotation-spacing': ['error'],
      '@typescript-eslint/no-unsafe-call': ['warn'],
      '@typescript-eslint/no-unsafe-argument': ['warn'],
      '@typescript-eslint/no-unused-expressions': ['error', {
        allowShortCircuit: true,
        allowTernary: true,
      }],
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
    },
  },
];
