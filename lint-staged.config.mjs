/** @type {import('lint-staged').Config} */
export default {
  '*.{ts,tsx,js,jsx,mjs}': ['eslint --fix', 'prettier --write'],
  '*.{json,md,css,yaml,yml}': ['prettier --write'],
}
