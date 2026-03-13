/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'hero',
        'blog',
        'projects',
        'lab',
        'config',
        'server',
        'domain',
        'components',
        'lib',
        'docs',
        'ci',
        'deps',
      ],
    ],
    'scope-case': [2, 'always', 'lower-case'],
    'subject-case': [2, 'always', 'lower-case'],
    'header-max-length': [2, 'always', 100],
  },
}
