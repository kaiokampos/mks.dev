import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import prettier from 'eslint-config-prettier/flat'
import tseslint from 'typescript-eslint'

export default defineConfig([
  ...nextVitals,

  {
    files: ['**/*.ts', '**/*.tsx'],

    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },

    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },

    settings: {
      'import/resolver': {
        typescript: { project: './tsconfig.json' },
      },
    },

    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  {
    files: ['**/*.ts', '**/*.tsx', '**/*.mjs', '**/*.js'],

    settings: {
      'import/resolver': {
        typescript: { project: './tsconfig.json' },
      },
    },

    rules: {
      'import/no-internal-modules': [
        'error',
        {
          allow: [
            // arquivos de config na raiz do projeto
            '*.mjs',
            '*.js',
            // módulos internos da arquitetura
            '@/features/*',
            '@/domain/*',
            '@/server/*',
            '@/components/*',
            '@/lib/*',
            '@/config/*', 
            '@/content/*',
            // imports relativos
            './**',
            '../**',
            // dependências externas com subpaths
            'next/**',
            'vitest/**',
            'eslint/**',
            'eslint-config-next/**',
            'eslint-config-prettier/**',
            'typescript-eslint',
          ],
        },
      ],
      'import/no-cycle': ['error', { maxDepth: 5 }],
      'import/no-anonymous-default-export': 'off',
    },
  },

  prettier,

  globalIgnores(['.next/**', 'out/**', 'coverage/**', 'node_modules/**', 'next-env.d.ts']),
])
