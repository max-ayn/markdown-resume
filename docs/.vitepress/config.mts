import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Markdown Resume',
  description: 'Generate resumes from semantic Markdown + CSS into HTML and PDF.',
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Ecosystem', link: '/ecosystem/cli-tool' },
      { text: 'Reference', link: '/reference/markdown' },
      { text: 'Changelog', link: '/changelog' },
    ],
    sidebar: [
      {
        text: 'Getting started',
        items: [
          { text: 'What is Markdown Resume', link: '/guide/getting-started#what-is-markdown-resume' },
          { text: 'Why', link: '/guide/getting-started#why' },
          { text: 'Installation', link: '/guide/getting-started#installation' },
          { text: 'Your first example', link: '/guide/getting-started#your-first-example' },
          { text: 'Where to go next', link: '/guide/getting-started#where-to-go-next' },
        ],
      },
      {
        text: 'Tooling',
        items: [
          { text: 'Playground (not implemented yet)', link: '/guide/tooling/playground' },
          { text: 'CLI reference', link: '/guide/tooling/cli-reference' },
        ],
      },
      {
        text: 'Ecosystem',
        items: [
          { text: 'Playgrounds (not implemented yet)', link: '/ecosystem/playgrounds' },
          { text: 'CLI Tool', link: '/ecosystem/cli-tool' },
          {
            text: 'Editor Support',
            items: [
              { text: 'VS Code (not implemented yet)', link: '/ecosystem/editor-support/vscode' },
            ],
          },
          { text: 'MCP (not implemented yet)', link: '/ecosystem/mcp' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'Markdown', link: '/reference/markdown' },
          { text: 'YAML', link: '/reference/yaml' },
        ],
      },
      {
        text: 'Changelog',
        link: '/changelog',
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/max-ayn/markdown-resume' },
    ],
  },
})
