import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

const BLOG_ROOT = 'content/blog'
const GENERATED_PUBLICATION_FILE = 'src/lib/standard-site.generated.ts'
const DID = 'did:plc:nmwj6xne7mdpkry5pzvfendv'
const SITE_URL = 'https://ndo.dev'
const DEFAULT_PDS_HOST = 'https://pds.ndo.dev'
const MAX_COVER_IMAGE_BYTES = 1_000_000

type Session = {
  accessJwt: string
  did: string
}

type FrontmatterPost = {
  body: string
  contentPath: string
  date: string
  description: string
  draft: boolean
  frontmatter: string
  publishedAt: string
  slug: string
  standardSiteUri: string | null
  tags: string[]
  title: string
  coverImagePath: string | null
}

type BlobRef = {
  $type: 'blob'
  ref: { $link: string }
  mimeType: string
  size: number
}

type PublicationRecord = {
  $type: 'site.standard.publication'
  name: string
  url: string
  description: string
  preferences: { showInDiscover: boolean }
}

type DocumentRecord = {
  $type: 'site.standard.document'
  site: string
  title: string
  publishedAt: string
  path: string
  description: string
  tags?: string[]
  textContent: string
  coverImage?: BlobRef
}

type UploadBlobResponse = {
  blob: BlobRef
}

const options = {
  dryRun: process.argv.includes('--dry-run'),
  omitOversizedCovers: process.argv.includes('--omit-oversized-covers'),
  post: optionValue('--post'),
}
const PUBLICATION_RKEY = 'ndo-dev'

const pdsHost = process.env.ATP_PDS_HOST ?? DEFAULT_PDS_HOST
const identifier = process.env.ATP_IDENTIFIER
const password = process.env.ATP_PASSWORD

if (!options.dryRun && (!identifier || !password)) {
  throw new Error('Set ATP_IDENTIFIER and ATP_PASSWORD before running this script')
}

const session = options.dryRun ? null : await createSession()

if (session && session.did !== DID) {
  throw new Error(`Logged in as ${session.did}, expected ${DID}`)
}

const publicationUri = await upsertPublication()
const posts = readPosts().filter((post) => !post.draft && (!options.post || post.slug === options.post))

if (options.post && posts.length === 0) {
  throw new Error(`No published post found for slug: ${options.post}`)
}

for (const post of posts) {
  await publishPost(post, publicationUri)
}

function optionValue(name: string) {
  const index = process.argv.indexOf(name)

  if (index === -1) return undefined

  const value = process.argv[index + 1]

  if (!value || value.startsWith('--')) {
    throw new Error(`${name} requires a value, e.g. ${name} link-screenshot`)
  }

  return value
}

async function createSession(): Promise<Session> {
  return await xrpc<Session>('com.atproto.server.createSession', {
    identifier: requireEnv(identifier, 'ATP_IDENTIFIER'),
    password: requireEnv(password, 'ATP_PASSWORD'),
  })
}

async function upsertPublication() {
  const publicationRecord: PublicationRecord = {
    $type: 'site.standard.publication',
    name: 'ndo.dev',
    url: SITE_URL,
    description: 'Personal writing and technical notes by Nico Domino.',
    preferences: { showInDiscover: true },
  }
  const existingUri = process.env.STANDARD_SITE_PUBLICATION_URI ?? readGeneratedPublicationUri()

  if (options.dryRun) {
    console.log(existingUri ? `Would update publication ${existingUri}` : 'Would create publication')
    return existingUri || 'at://dry-run/site.standard.publication/dryrun'
  }

  if (existingUri) {
    await putRecordByUri(existingUri, publicationRecord)
    console.log(`Updated publication ${existingUri}`)

    return existingUri
  }

  const uri = recordUri('site.standard.publication', PUBLICATION_RKEY)
  await putRecordByKey('site.standard.publication', PUBLICATION_RKEY, publicationRecord)
  writeGeneratedPublicationUri(uri)
  console.log(`Created publication ${uri}`)

  return uri
}

async function publishPost(post: FrontmatterPost, publicationUri: string) {
  ensurePortableMarkdown(post)

  const coverImage = post.coverImagePath ? await uploadCoverImage(post.coverImagePath) : undefined
  const record: DocumentRecord = removeUndefined({
    $type: 'site.standard.document',
    site: publicationUri,
    title: post.title,
    publishedAt: toDatetime(post.publishedAt || post.date),
    path: `/blog/${post.slug}`,
    description: post.description,
    tags: post.tags.length > 0 ? post.tags : undefined,
    textContent: toTextContent(post.body),
    coverImage,
  })

  if (options.dryRun) {
    console.log(post.standardSiteUri ? `Would update ${post.slug}` : `Would create ${post.slug}`)
    return
  }

  if (post.standardSiteUri) {
    await putRecordByUri(post.standardSiteUri, record)
    console.log(`Updated ${post.slug}: ${post.standardSiteUri}`)

    return
  }

  const uri = recordUri('site.standard.document', post.slug)
  await putRecordByKey('site.standard.document', post.slug, record)
  writeStandardSiteUri(post.contentPath, post.frontmatter, post.body, uri)
  console.log(`Created ${post.slug}: ${uri}`)
}

async function uploadCoverImage(imagePath: string): Promise<BlobRef | undefined> {
  const stats = statSync(imagePath)

  if (stats.size > MAX_COVER_IMAGE_BYTES) {
    if (!options.omitOversizedCovers) {
      throw new Error(
        `Cover image is too large for AT Protocol upload: ${imagePath} is ${stats.size} bytes; max is ${MAX_COVER_IMAGE_BYTES}. Compress it, remove cover.imageFile, or pass --omit-oversized-covers.`
      )
    }

    console.log(`Omitting cover over 1 MB: ${imagePath}`)
    return undefined
  }

  if (options.dryRun) {
    console.log(`Would upload cover ${imagePath}`)
    return undefined
  }

  const response = await fetch(`${pdsHost}/xrpc/com.atproto.repo.uploadBlob`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${requireSession().accessJwt}`,
      'Content-Type': mimeType(imagePath),
    },
    body: readFileSync(imagePath),
  })

  if (!response.ok) {
    throw new Error(`Failed uploading ${imagePath}: ${await response.text()}`)
  }

  const data = (await response.json()) as Partial<UploadBlobResponse>

  if (!isBlobRef(data.blob)) {
    throw new Error(`Blob upload for ${imagePath} returned an invalid response`)
  }

  return data.blob
}

async function putRecordByUri(uri: string, record: PublicationRecord | DocumentRecord) {
  const parsed = parseAtUri(uri)

  await putRecordByKey(parsed.collection, parsed.rkey, record)
}

async function putRecordByKey(collection: string, rkey: string, record: PublicationRecord | DocumentRecord) {
  await xrpc('com.atproto.repo.putRecord', {
    collection,
    repo: requireSession().did,
    rkey,
    record,
  })
}

async function xrpc<T = unknown>(endpoint: string, body: unknown): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (endpoint !== 'com.atproto.server.createSession') {
    headers.Authorization = `Bearer ${requireSession().accessJwt}`
  }

  const response = await fetch(`${pdsHost}/xrpc/${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`${endpoint} failed: ${response.status} ${await response.text()}`)
  }

  if (response.headers.get('content-length') === '0') {
    return undefined as T
  }

  return (await response.json()) as T
}

function requireSession() {
  if (!session) {
    throw new Error('AT Protocol session is unavailable')
  }

  return session
}

function requireEnv(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`Set ${name} before running this script`)
  }

  return value
}

function readPosts() {
  return walk(BLOG_ROOT)
    .filter((filePath) => filePath.endsWith('.mdx'))
    .map(readPost)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

function walk(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const filePath = join(directory, entry)

    return statSync(filePath).isDirectory() ? walk(filePath) : [filePath]
  })
}

function readPost(contentPath: string): FrontmatterPost {
  const source = readFileSync(contentPath, 'utf8')
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(source)

  if (!match) {
    throw new Error(`Missing frontmatter: ${contentPath}`)
  }

  const frontmatter = match[1]
  const body = match[2]
  const publishedAt = scalar(frontmatter, 'publishedAt') ?? scalar(frontmatter, 'date')

  if (!publishedAt) {
    throw new Error(`Missing publishedAt/date: ${contentPath}`)
  }

  return {
    body,
    contentPath,
    date: scalar(frontmatter, 'date') ?? publishedAt,
    description: scalar(frontmatter, 'description') ?? descriptionFromContent(body),
    draft: scalar(frontmatter, 'draft') === 'true',
    frontmatter,
    publishedAt,
    slug: slugFromPath(contentPath),
    standardSiteUri: scalar(frontmatter, 'standardSiteUri'),
    tags: tags(frontmatter),
    title: scalar(frontmatter, 'title') ?? fail(`Missing title: ${contentPath}`),
    coverImagePath: coverImagePath(contentPath, frontmatter),
  }
}

function scalar(frontmatter: string, key: string) {
  const match = new RegExp(`^${key}:\\s*(?:"([^"]*)"|'([^']*)'|([^\\n]+))\\s*$`, 'm').exec(
    frontmatter
  )

  return match ? (match[1] ?? match[2] ?? match[3]).trim() : null
}

function tags(frontmatter: string) {
  const inline = /^tags:\s*\[([^\]]*)\]\s*$/m.exec(frontmatter)

  if (inline) {
    return inline[1]
      .split(',')
      .map((tag) => tag.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean)
  }

  const block = /^tags:\s*\n((?:\s+-\s*[^\n]+\n?)*)/m.exec(frontmatter)

  if (!block) return []

  return block[1]
    .split('\n')
    .map((line) => line.replace(/^\s+-\s*/, '').trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean)
}

function coverImagePath(contentPath: string, frontmatter: string) {
  const match = /(?:^|\n)cover:\s*\n(?:\s+[^\n]*\n)*?\s+imageFile:\s*(?:"([^"]*)"|'([^']*)'|([^\n]+))/m.exec(
    frontmatter
  )
  const imageFile = match ? (match[1] ?? match[2] ?? match[3]).trim() : null

  if (!imageFile) return null

  return imageFile.startsWith('./')
    ? join(contentPath, '..', imageFile)
    : join(BLOG_ROOT, imageFile)
}

function slugFromPath(contentPath: string) {
  const relativePath = relative(BLOG_ROOT, contentPath)
  const parts = relativePath.split(/[/\\]/)
  const fileName = parts.at(-1)

  if (fileName === 'index.mdx') {
    return parts.at(-2) ?? fail(`Unable to derive slug: ${contentPath}`)
  }

  return fileName?.replace(/\.mdx$/, '') ?? fail(`Unable to derive slug: ${contentPath}`)
}

function ensurePortableMarkdown(post: FrontmatterPost) {
  const withoutCodeBlocks = post.body.replace(/```[\s\S]*?```/g, '')

  if (/^import\s/m.test(withoutCodeBlocks) || /<[A-Z][A-Za-z0-9_.]*(\s|\/|>)/.test(withoutCodeBlocks)) {
    throw new Error(`Post still contains live MDX syntax: ${post.contentPath}`)
  }
}

function descriptionFromContent(content: string) {
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

  return toTextContent(firstParagraph ?? 'Notes from the archive.').slice(0, 3000)
}

function toTextContent(content: string) {
  return content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/[`*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function toDatetime(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T00:00:00.000Z` : date
}

function mimeType(filePath: string) {
  switch (extname(filePath).toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    case '.webp':
      return 'image/webp'
    case '.gif':
      return 'image/gif'
    default:
      throw new Error(`Unsupported cover image type for ${filePath}`)
  }
}

function isBlobRef(value: unknown): value is BlobRef {
  if (!value || typeof value !== 'object') return false

  const blob = value as Partial<BlobRef>

  return (
    blob.$type === 'blob' &&
    typeof blob.mimeType === 'string' &&
    typeof blob.size === 'number' &&
    Boolean(blob.ref) &&
    typeof blob.ref === 'object' &&
    typeof (blob.ref as Partial<BlobRef['ref']>).$link === 'string'
  )
}

function readGeneratedPublicationUri() {
  if (!existsSync(GENERATED_PUBLICATION_FILE)) return ''

  return /standardSitePublicationUri = '([^']*)'/.exec(
    readFileSync(GENERATED_PUBLICATION_FILE, 'utf8')
  )?.[1]
}

function writeGeneratedPublicationUri(uri: string) {
  writeFileSync(GENERATED_PUBLICATION_FILE, `export const standardSitePublicationUri = '${uri}'\n`)
}

function recordUri(collection: string, rkey: string) {
  return `at://${DID}/${collection}/${rkey}`
}

function writeStandardSiteUri(
  contentPath: string,
  frontmatter: string,
  body: string,
  standardSiteUri: string
) {
  const nextFrontmatter = frontmatter.includes('standardSiteUri:')
    ? frontmatter.replace(/^standardSiteUri:.*$/m, `standardSiteUri: ${standardSiteUri}`)
    : insertFrontmatterField(frontmatter, 'standardSiteUri', standardSiteUri)

  writeFileSync(contentPath, `---\n${nextFrontmatter}\n---\n${body}`)
}

function insertFrontmatterField(frontmatter: string, key: string, value: string) {
  const preferredAnchors = ['\ncover:', '\ndiscussionAtprotoUri:', '\ntags:']

  for (const anchor of preferredAnchors) {
    if (frontmatter.includes(anchor)) {
      return frontmatter.replace(anchor, `\n${key}: ${value}${anchor}`)
    }
  }

  return `${frontmatter}\n${key}: ${value}`
}

function parseAtUri(uri: string) {
  const [, , repo, collection, rkey] = uri.split('/')

  if (!uri.startsWith('at://') || !repo || !collection || !rkey) {
    throw new Error(`Invalid AT-URI: ${uri}`)
  }

  return { collection, rkey }
}

function removeUndefined<T extends Record<string, unknown>>(record: T): T {
  return Object.fromEntries(
    Object.entries(record).filter((entry): entry is [string, Exclude<unknown, undefined>] =>
      entry[1] !== undefined
    )
  ) as T
}

function fail(message: string): never {
  throw new Error(message)
}
