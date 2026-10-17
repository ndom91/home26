import { parse as parseYaml } from 'yaml'

// Post metadata helpers shared by content-collections.ts and the scripts in
// scripts/, so slugs and descriptions are derived one way everywhere. Plain TS
// with no path aliases: the scripts run it directly with `node`.

export type Frontmatter = Record<string, unknown>

/** Splits an MDX source into raw frontmatter text, parsed YAML, and body. */
export function parseFrontmatter(source: string) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(source)
  if (!match) return null
  const data = (parseYaml(match[1]) ?? {}) as Frontmatter
  return { raw: match[1], data, body: match[2] }
}

/** Slug from a path relative to content/blog, e.g. `macbook/index.mdx` -> `macbook`. */
export function slugFromPath(path: string) {
  const parts = path.split(/[/\\]/)
  const fileName = parts.at(-1)

  if (!fileName) {
    throw new Error(`Unable to derive slug from path: ${path}`)
  }

  if (fileName === 'index.mdx') {
    const directoryName = parts.at(-2)

    if (!directoryName) {
      throw new Error(`Unable to derive slug from path: ${path}`)
    }

    return directoryName
  }

  return fileName.replace(/\.mdx$/, '')
}

/** Site description: first prose paragraph, cut at a sentence end near 180 chars. */
export function descriptionFromContent(content: string) {
  const firstParagraph = content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .find(
      (block) =>
        block.length > 0 &&
        !block.startsWith('import ') &&
        !block.startsWith('#') &&
        !block.startsWith('```') &&
        !block.startsWith('<')
    )

  if (!firstParagraph) {
    return 'Notes from the archive.'
  }

  const description = firstParagraph
    .replace(/<([A-Z][A-Za-z0-9]*)\b[^>]*>(.*?)<\/\1>/g, '$2')
    .replace(/<[^>]+>/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[`*_>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  return excerptCompleteSentences(description)
}

function excerptCompleteSentences(text: string, targetLength = 180) {
  if (text.length <= targetLength) {
    return text
  }

  const sentenceEnd = /[.!?](?:["')\]]+)?(?=\s|$)/g
  let lastEndBeforeTarget = 0
  let firstEnd = 0

  for (const match of text.matchAll(sentenceEnd)) {
    const end = match.index + match[0].length

    if (isDottedAbbreviation(text.slice(0, end))) {
      continue
    }

    firstEnd ||= end

    if (end > targetLength) {
      break
    }

    lastEndBeforeTarget = end
  }

  const end = lastEndBeforeTarget || firstEnd

  return end ? text.slice(0, end).trim() : text
}

function isDottedAbbreviation(textBeforeBoundary: string) {
  return /(?:^|\s)(?:e\.g|i\.e|vs|mr|mrs|ms|dr|prof|sr|jr)\.$/i.test(textBeforeBoundary)
}
