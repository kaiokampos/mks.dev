import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // Simula ambiente de browser (necessário para componentes React)
    environment: 'jsdom',
    // Arquivos de teste — co-localizados com os arquivos que testam
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'out'],
    // Cobertura via v8 (mais rápido que istanbul)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: [
        'node_modules',
        '.next',
        '**/*.config.*',
        '**/*.d.ts',
        '**/index.ts', // barrel exports não precisam de cobertura
      ],
    },
  },
  resolve: {
    // Espelha os path aliases do tsconfig.json
    // Necessário para o Vitest resolver os mesmos imports que o TypeScript
    alias: {
      '@/app': resolve(__dirname, './app'),
      '@/features': resolve(__dirname, './features'),
      '@/domain': resolve(__dirname, './domain'),
      '@/server': resolve(__dirname, './server'),
      '@/components': resolve(__dirname, './components'),
      '@/lib': resolve(__dirname, './lib'),
      '@/config': resolve(__dirname, './config'),
      '@/content': resolve(__dirname, './content'),
    },
  },
})
