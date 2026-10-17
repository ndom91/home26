import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import sharp from 'sharp'
import { descriptionFromContent, parseFrontmatter, slugFromPath } from '../src/lib/post-meta.ts'

const BLOG_ROOT = 'content/blog'
const GENERATED_PUBLICATION_FILE = 'src/lib/standard-site.generated.ts'
const DID = 'did:plc:nmwj6xne7mdpkry5pzvfendv'
const SITE_URL = 'https://ndo.dev'
const DEFAULT_PDS_HOST = 'https://pds.ndo.dev'
const MAX_COVER_IMAGE_BYTES = 1_000_000
// Matches the largest responsive variant the site serves (src/lib/image-variants.ts).
const COVER_WIDTH = 1600
const COVER_QUALITIES = [80, 70, 60, 50]

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
  post: optionValue('--post'),
}
const TID_CHARS = '234567abcdefghijklmnopqrstuvwxyz'

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
    description: 'Personal writing and technical notes by ndom91.',
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

  const rkey = nextTid()
  const uri = recordUri('site.standard.publication', rkey)
  await putRecordByKey('site.standard.publication', rkey, publicationRecord)
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

  const rkey = nextTid()
  const uri = recordUri('site.standard.document', rkey)
  await putRecordByKey('site.standard.document', rkey, record)
  writeStandardSiteUri(post.contentPath, post.frontmatter, post.body, uri)
  console.log(`Created ${post.slug}: ${uri}`)
}

// Re-encodes the cover as WebP so it fits AT Protocol's 1 MB blob limit; the
// source PNG/JPEG covers are all larger than that.
async function coverWebp(imagePath: string) {
  for (const quality of COVER_QUALITIES) {
    const bytes = await sharp(imagePath)
      .rotate()
      .resize({ width: COVER_WIDTH, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer()
    if (bytes.length <= MAX_COVER_IMAGE_BYTES) return bytes
  }
  throw new Error(`Cover still over ${MAX_COVER_IMAGE_BYTES} bytes as WebP: ${imagePath}`)
}

async function uploadCoverImage(imagePath: string): Promise<BlobRef | undefined> {
  const bytes = await coverWebp(imagePath)

  if (options.dryRun) {
    console.log(`Would upload cover ${imagePath} (${Math.round(bytes.length / 1024)} KB WebP)`)
    return undefined
  }

  const response = await fetch(`${pdsHost}/xrpc/com.atproto.repo.uploadBlob`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${requireSession().accessJwt}`,
      'Content-Type': 'image/webp',
    },
    body: new Uint8Array(bytes),
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
    // Newer PDS versions validate site.standard.* records, which require TID
    // rkeys. Older records use slug rkeys, so skip validation only for those.
    validate: isTid(rkey) ? undefined : false,
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
  const parsed = parseFrontmatter(readFileSync(contentPath, 'utf8'))

  if (!parsed) {
    throw new Error(`Missing frontmatter: ${contentPath}`)
  }

  const { raw, data, body } = parsed
  const publishedAt = string(data.publishedAt) ?? string(data.date)

  if (!publishedAt) {
    throw new Error(`Missing publishedAt/date: ${contentPath}`)
  }

  const cover = data.cover as { imageFile?: unknown } | undefined
  const imageFile = string(cover?.imageFile)

  return {
    body,
    contentPath,
    date: string(data.date) ?? publishedAt,
    // Same derivation as the site (content-collections.ts), so ATproto and
    // ndo.dev always show the same description.
    description: string(data.description) ?? descriptionFromContent(body),
    draft: data.draft === true,
    frontmatter: raw,
    publishedAt,
    slug: slugFromPath(relative(BLOG_ROOT, contentPath)),
    standardSiteUri: string(data.standardSiteUri),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    title: string(data.title) ?? fail(`Missing title: ${contentPath}`),
    coverImagePath: imageFile
      ? imageFile.startsWith('./')
        ? join(contentPath, '..', imageFile)
        : join(BLOG_ROOT, imageFile)
      : null,
  }
}

function string(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function ensurePortableMarkdown(post: FrontmatterPost) {
  const withoutCodeBlocks = post.body.replace(/```[\s\S]*?```/g, '')

  if (/^import\s/m.test(withoutCodeBlocks) || /<[A-Z][A-Za-z0-9_.]*(\s|\/|>)/.test(withoutCodeBlocks)) {
    throw new Error(`Post still contains live MDX syntax: ${post.contentPath}`)
  }
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

// TID: microsecond timestamp plus a 10-bit clock id, base32-sortable encoded.
function nextTid() {
  let value = ((BigInt(Date.now()) * 1000n) << 10n) | BigInt(Math.floor(Math.random() * 1024))
  let tid = ''

  for (let i = 0; i < 13; i++) {
    tid = TID_CHARS[Number(value & 31n)] + tid
    value >>= 5n
  }

  return tid
}

function isTid(rkey: string) {
  return /^[234567abcdefghij][234567abcdefghijklmnopqrstuvwxyz]{12}$/.test(rkey)
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
