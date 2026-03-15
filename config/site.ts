// config/site.ts
//
// Dados globais do site — nome, autor, URLs, redes sociais.
// Camada transversal: pode ser importada por qualquer camada exceto domain/ e components/.

export const siteConfig = {
  name: 'mks.dev',
  title: 'mks.dev — Kaio Campos',
  description: 'Engenharia de software. Arquitetura, código e pensamento técnico.',
  url: 'https://mks.dev',
  author: {
    name: 'Kaio Campos',
    role: 'engenheiro de software',
    github: 'https://github.com/kaiokampos',
    linkedin: 'https://linkedin.com/in/kaiocamposti',
  },
} as const
