import { useEffect, useState } from 'react'

const blueskyThreadEndpoint = 'https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread'

type BlueskyAuthor = {
  handle: string
  displayName?: string
  avatar?: string
}

type BlueskyPostRecord = {
  text?: string
}

type BlueskyPost = {
  uri: string
  author: BlueskyAuthor
  record?: BlueskyPostRecord
  indexedAt: string
  replyCount?: number
  repostCount?: number
  likeCount?: number
}

type UnavailableThreadItem =
  | { uri: string; notFound: true; blocked?: never }
  | { uri: string; blocked: true; notFound?: never }

type ThreadViewPost = {
  post: BlueskyPost
  replies: ThreadItem[]
}

type ThreadItem = ThreadViewPost | UnavailableThreadItem

type CommentsState =
  | { status: 'loading' }
  | { status: 'loaded'; thread: ThreadViewPost }
  | { status: 'error' }

export function BlueskyComments({ threadUri }: { threadUri: string }) {
  const [state, setState] = useState<CommentsState>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()
    const url = new URL(blueskyThreadEndpoint)
    url.searchParams.set('uri', threadUri)
    url.searchParams.set('depth', '2')
    url.searchParams.set('parentHeight', '0')

    setState({ status: 'loading' })

    async function loadComments() {
      try {
        const response = await fetch(url, { signal: controller.signal })

        if (!response.ok) {
          throw new Error('Unable to load Bluesky comments')
        }

        const data: unknown = await response.json()
        const thread = parseThreadResponse(data)

        if (!thread) {
          throw new Error('Bluesky thread is unavailable')
        }

        setState({ status: 'loaded', thread })
      } catch {
        if (controller.signal.aborted) return

        setState({ status: 'error' })
      }
    }

    void loadComments()

    return () => controller.abort()
  }, [threadUri])

  const rootPost = state.status === 'loaded' ? state.thread.post : null
  const rootUrl = rootPost ? blueskyPostUrl(rootPost) : blueskyUriToPostUrl(threadUri)
  const replyItems = state.status === 'loaded' ? state.thread.replies : []
  const replies = replyItems.filter(isThreadViewPost)
  const unavailableReplyCount = countUnavailableReplies(replyItems)

  return (
    <section
      aria-labelledby="bluesky-comments-heading"
      className="mx-auto mt-16 max-w-2xl border-t border-blog-rule pt-8"
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono mb-2 text-[9px] uppercase tracking-widest text-blog-faint">
            Discussion
          </p>
          <h2
            id="bluesky-comments-heading"
            className="text-balance font-heading text-2xl font-extrabold uppercase tracking-[-0.03em] text-blog-text"
          >
            On the Atmosphere
          </h2>
        </div>
        <a
          href={rootUrl}
          target="_blank"
          rel="noreferrer"
          className="font-mono border border-blog-rule bg-blog-panel px-3 py-2 text-[10px] uppercase tracking-widest text-blog-muted transition-colors hover:border-blog-accent hover:text-blog-accent focus-visible:outline-2! focus-visible:outline-blog-accent! focus-visible:outline-offset-2!"
        >
          Open thread
        </a>
      </div>

      {state.status === 'loading' ? (
        <output className="font-reading block text-sm leading-6 text-blog-description">
          Loading Bluesky comments...
        </output>
      ) : null}

      {state.status === 'error' ? (
        <output className="font-reading block text-sm leading-6 text-blog-description">
          Bluesky comments could not be loaded here. Open the Bluesky thread to read or reply.
        </output>
      ) : null}

      {state.status === 'loaded' ? (
        <div className="space-y-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-blog-muted">
            {formatStat(rootPost?.replyCount ?? replies.length, 'reply')}
          </p>
          {unavailableReplyCount > 0 ? (
            <p className="font-reading text-sm leading-6 text-blog-description">
              {formatStat(unavailableReplyCount, 'reply')} could not be displayed because it was
              deleted, blocked, or unavailable through the public API.
            </p>
          ) : null}
          {replies.length > 0 ? (
            <ol className="space-y-4">
              {replies.map((reply) => (
                <BlueskyComment key={reply.post.uri} thread={reply} />
              ))}
            </ol>
          ) : (
            <p className="font-reading text-sm leading-6 text-blog-description">
              {(rootPost?.replyCount ?? 0) > 0
                ? 'Replies exist on Bluesky, but they cannot be displayed here. Open the Bluesky thread to view them.'
                : 'No replies yet. Open the Bluesky thread to start the conversation.'}
            </p>
          )}
        </div>
      ) : null}
    </section>
  )
}

function BlueskyComment({ thread, depth = 0 }: { thread: ThreadViewPost; depth?: number }) {
  const post = thread.post
  const replies = thread.replies.filter(isThreadViewPost)
  const text = post.record?.text?.trim()

  return (
    <li className={depth > 0 ? 'ml-4 border-l border-blog-rule pl-4 sm:ml-6' : undefined}>
      <article className="border border-blog-rule bg-blog-panel p-4">
        <header className="mb-3 flex items-start gap-3">
          {post.author.avatar ? (
            <img
              src={post.author.avatar}
              alt=""
              loading="lazy"
              decoding="async"
              className="size-9 shrink-0 rounded-full border border-blog-rule bg-blog-bg"
            />
          ) : (
            <div className="size-9 shrink-0 rounded-full border border-blog-rule bg-blog-bg" />
          )}
          <div className="min-w-0 flex-1">
            <a
              href={blueskyPostUrl(post)}
              target="_blank"
              rel="noreferrer"
              className="font-reading block truncate text-sm font-semibold text-blog-text transition-colors hover:text-blog-accent"
            >
              {post.author.displayName || post.author.handle}
            </a>
            <p className="font-mono mt-1 truncate text-[10px] text-blog-muted">
              @{post.author.handle} · {formatDate(post.indexedAt)}
            </p>
          </div>
        </header>

        {text ? (
          <p className="whitespace-pre-wrap font-reading text-sm leading-6 text-blog-description">
            {text}
          </p>
        ) : (
          <p className="font-reading text-sm leading-6 text-blog-muted">Media-only reply</p>
        )}

        <footer className="font-mono mt-4 flex flex-wrap gap-3 text-[10px] uppercase tracking-widest text-blog-muted">
          <span>{formatStat(post.likeCount ?? 0, 'like')}</span>
          <span>{formatStat(post.repostCount ?? 0, 'repost')}</span>
          <a
            href={blueskyPostUrl(post)}
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-blog-accent"
          >
            Reply
          </a>
        </footer>
      </article>

      {replies.length > 0 ? (
        <ol className="mt-4 space-y-4">
          {replies.map((reply) => (
            <BlueskyComment key={reply.post.uri} thread={reply} depth={depth + 1} />
          ))}
        </ol>
      ) : null}
    </li>
  )
}

function isThreadViewPost(thread: ThreadItem | undefined): thread is ThreadViewPost {
  return Boolean(thread && 'post' in thread)
}

function parseThreadResponse(data: unknown): ThreadViewPost | null {
  if (!isRecord(data)) return null

  return parseThreadViewPost(data.thread)
}

function parseThreadItem(item: unknown): ThreadItem | null {
  const thread = parseThreadViewPost(item)

  if (thread) return thread
  if (!isRecord(item) || typeof item.uri !== 'string') return null

  if (item.notFound === true) {
    return { uri: item.uri, notFound: true }
  }

  if (item.blocked === true) {
    return { uri: item.uri, blocked: true }
  }

  return null
}

function parseThreadViewPost(item: unknown): ThreadViewPost | null {
  if (!isRecord(item)) return null

  const post = parsePost(item.post)
  if (!post) return null

  const replies = Array.isArray(item.replies)
    ? item.replies.map(parseThreadItem).filter((reply): reply is ThreadItem => reply !== null)
    : []

  return { post, replies }
}

function parsePost(value: unknown): BlueskyPost | null {
  if (!isRecord(value)) return null
  if (typeof value.uri !== 'string' || typeof value.indexedAt !== 'string') return null
  if (Number.isNaN(new Date(value.indexedAt).getTime())) return null

  const author = parseAuthor(value.author)
  if (!author) return null

  return {
    uri: value.uri,
    author,
    indexedAt: value.indexedAt,
    record: parsePostRecord(value.record),
    replyCount: readNumber(value.replyCount),
    repostCount: readNumber(value.repostCount),
    likeCount: readNumber(value.likeCount),
  }
}

function parseAuthor(value: unknown): BlueskyAuthor | null {
  if (!isRecord(value) || typeof value.handle !== 'string') return null

  return {
    handle: value.handle,
    displayName: typeof value.displayName === 'string' ? value.displayName : undefined,
    avatar: typeof value.avatar === 'string' ? value.avatar : undefined,
  }
}

function parsePostRecord(value: unknown): BlueskyPostRecord | undefined {
  if (!isRecord(value)) return undefined

  return {
    text: typeof value.text === 'string' ? value.text : undefined,
  }
}

function readNumber(value: unknown) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function blueskyUriToPostUrl(uri: string) {
  const parts = uri.replace('at://', '').split('/')
  const [repo, collection, rkey] = parts

  if (!repo || collection !== 'app.bsky.feed.post' || !rkey) {
    return 'https://bsky.app'
  }

  return `https://bsky.app/profile/${repo}/post/${rkey}`
}

function countUnavailableReplies(items: ThreadItem[]): number {
  return items.reduce((count, item) => {
    if (!isThreadViewPost(item)) return count + 1

    return count + countUnavailableReplies(item.replies)
  }, 0)
}

function blueskyPostUrl(post: BlueskyPost) {
  const rkey = post.uri.split('/').at(-1)

  if (!rkey) {
    return `https://bsky.app/profile/${post.author.handle}`
  }

  return `https://bsky.app/profile/${post.author.handle}/post/${rkey}`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function formatStat(count: number, label: string) {
  return `${count} ${label}${count === 1 ? '' : 's'}`
}
