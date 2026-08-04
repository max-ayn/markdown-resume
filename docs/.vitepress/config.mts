import { defineConfig } from 'vitepress'
import llmstxt, { copyOrDownloadAsMarkdownButtons } from 'vitepress-plugin-llms'

export default defineConfig({
  base: process.env.CI ? '/markdown-resume/' : '/',
  title: '*.md Resume',
  description: 'Generate resumes from semantic Markdown + CSS into HTML and PDF.',
  head: [['link', { rel: 'icon', type: 'image/png', href: '/logo.svg' }]],
  vite: {
    plugins: [llmstxt()],
  },
  markdown: {
    config(md) {
      md.use(copyOrDownloadAsMarkdownButtons)
    },
  },
  themeConfig: {
    logo: { light: '/logo-white.svg', dark: '/logo-dark.svg' },
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Ecosystem', link: '/ecosystem/cli-tool' },
      { text: 'Reference', link: '/reference/markdown/' },
      { text: 'Changelog', link: '/changelog' },
    ],
    sidebar: [
      {
        text: 'Getting started',
        link: '/guide/getting-started',
      },
      {
        text: 'Ecosystem',
        items: [
          { text: 'CLI Tool', link: '/ecosystem/cli-tool' },
          {
            text: 'Editor Support',
            items: [
              { text: 'VS Code (not implemented yet)', link: '/ecosystem/editor-support/vscode' },
            ],
          },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'Frontmatter Config', link: '/reference/frontmatter-config' },
          {
            text: 'Markdown',
            link: '/reference/markdown/',
            items: [
              { text: 'Custom fields', link: '/reference/markdown/custom-fields' },
              { text: 'Directives', link: '/reference/markdown/directives' },
              { text: 'Validation', link: '/reference/markdown/validation' },
            ],
          },
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
    footer: {
      message: 'Released under the <a href="https://www.gnu.org/licenses/gpl-3.0.html" target="_blank">GPL-3.0 License</a>.',
      copyright: 'Copyright © 2026-PRESENT <a href="https://max.abylon.dev" target="_blank">Max Ayn</a>',
    },
  },
})
