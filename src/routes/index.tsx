import { createFileRoute, Link } from '@tanstack/react-router'
import type { BlogPost } from '../lib/blog'
import { getPublishedPosts } from '../lib/blog'

type PostData = Omit<BlogPost, 'Component'>

export const Route = createFileRoute('/')({
  loader: () => getPublishedPosts().map(({ Component: _c, ...post }): PostData => post),
  component: Home,
})

const TICKER =
  '01001110 01000100 00110000 00110001 · ndom91 · SOFTWARE_ENGINEER · yo@ndo.dev · BERLIN_DE · 01111001 01101111 · '

function Ticker({ faint }: { faint?: boolean }) {
  return (
    <div
      className="overflow-hidden"
      style={{
        borderTop: faint ? '1px solid #1a1a1a' : undefined,
        borderBottom: faint ? undefined : '1px solid #1a1a1a',
      }}
    >
      <div className="py-1.5">
        <span
          className="ticker-track font-mono text-[9px] tracking-wide"
          style={{ color: faint ? '#181818' : '#2c2c2c' }}
        >
          {TICKER.repeat(10)}
        </span>
      </div>
    </div>
  )
}

function PostCard({ post }: { post: PostData }) {
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className="group flex items-start justify-between gap-6 px-6 py-5 transition-colors hover:bg-[#0c0c0c]"
      style={{ borderBottom: '1px solid #1a1a1a' }}
    >
      <div className="min-w-0 flex-1">
        <h3 className="font-mono text-sm font-medium leading-snug text-[#f0ece3] transition-colors group-hover:text-white">
          {post.title}
        </h3>
        <p className="font-mono mt-1 line-clamp-1 text-xs leading-relaxed text-[#484848]">
          {post.description}
        </p>
      </div>
      <div className="mt-0.5 flex shrink-0 items-center gap-3">
        {(post.tags ?? []).slice(0, 1).map((tag) => (
          <span
            key={tag}
            className="font-mono px-2 py-0.5 text-[9px] uppercase tracking-widest text-[#333] transition-colors group-hover:text-[#555]"
            style={{ border: '1px solid #1a1a1a' }}
          >
            {tag}
          </span>
        ))}
        <time
          dateTime={post.publishedAt}
          className="font-mono whitespace-nowrap text-[10px] text-[#333] transition-colors group-hover:text-[#c8ff00]"
        >
          {post.publishedAt}
        </time>
        <span className="font-mono text-xs text-[#2a2a2a] transition-colors group-hover:text-[#c8ff00]">
          →
        </span>
      </div>
    </Link>
  )
}

function Home() {
  const posts = Route.useLoaderData()

  return (
    <div className="min-h-screen bg-[#080808] text-[#f0ece3]">
      <Ticker />

      {/* Navigation */}
      <nav
        className="grid border-b"
        style={{ gridTemplateColumns: 'auto 1fr auto', borderColor: '#1a1a1a' }}
      >
        <div className="border-r px-6 py-4" style={{ borderColor: '#1a1a1a' }}>
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.25em]">
            NDOM91
          </span>
        </div>
        <div className="flex items-center gap-7 px-7">
          <Link
            to="/blog"
            className="font-mono text-[10px] uppercase tracking-widest text-[#3a3a3a] transition-colors hover:text-[#f0ece3]"
          >
            WRITING
          </Link>
          <a
            href="https://github.com/ndom91"
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[10px] uppercase tracking-widest text-[#3a3a3a] transition-colors hover:text-[#f0ece3]"
          >
            GITHUB
          </a>
          <a
            href="mailto:yo@ndo.dev"
            className="font-mono text-[10px] uppercase tracking-widest text-[#3a3a3a] transition-colors hover:text-[#f0ece3]"
          >
            CONTACT
          </a>
        </div>
        <div
          className="flex items-center gap-2.5 border-l px-6 py-4"
          style={{ borderColor: '#1a1a1a' }}
        >
          <span className="block size-1.5 animate-pulse rounded-full bg-[#c8ff00]" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#3a3a3a]">
            OPEN TO WORK
          </span>
        </div>
      </nav>

      {/* Hero */}
      <section id="about">
        <div className="flex items-center border-b px-6 py-2.5" style={{ borderColor: '#1a1a1a' }}>
          <span className="font-mono text-[9px] uppercase tracking-widest text-[#252525]">
            SOFTWARE ENGINEER · OPEN SOURCE · TYPESCRIPT · REACT · GO
          </span>
          <span
            className="ml-auto border-l pl-5 font-mono text-[9px] uppercase tracking-widest text-[#252525]"
            style={{ borderColor: '#1a1a1a' }}
          >
            BERLIN, DE
          </span>
          <span
            className="ml-4 border-l pl-4 font-mono text-[9px] uppercase tracking-widest text-[#252525]"
            style={{ borderColor: '#1a1a1a' }}
          >
            {new Date().getFullYear()}
          </span>
        </div>

        {/* Giant type */}
        <div className="select-none overflow-hidden px-4 pb-0 pt-6">
          <div className="hero-in hero-in-1">
            <p
              className="font-heading leading-none tracking-[-0.03em] text-[#f0ece3] uppercase"
              style={{ fontSize: 'clamp(5rem, 17.5vw, 22rem)', fontWeight: 800 }}
            >
              SOFTWARE
            </p>
          </div>
          <div className="hero-in hero-in-2 flex items-end">
            <p
              className="font-heading leading-none tracking-[-0.03em] uppercase"
              style={{
                fontSize: 'clamp(5rem, 17.5vw, 22rem)',
                fontWeight: 800,
                color: 'transparent',
                WebkitTextStroke: '1px #2c2c2c',
              }}
            >
              ENGINEER
            </p>
            <span
              className="ml-3 mb-3 shrink-0 bg-[#c8ff00]"
              style={{
                width: 'clamp(0.5rem, 1.2vw, 1.5rem)',
                height: 'clamp(0.5rem, 1.2vw, 1.5rem)',
              }}
            />
          </div>
        </div>

        {/* Info grid */}
        <div
          className="hero-in hero-in-3 grid grid-cols-3 border-t border-b"
          style={{ borderColor: '#1a1a1a' }}
        >
          <div className="border-r px-6 py-5" style={{ borderColor: '#1a1a1a' }}>
            <p className="font-mono mb-2 text-[9px] uppercase tracking-widest text-[#252525]">
              STATUS
            </p>
            <p className="font-mono text-sm text-[#f0ece3]">Open to work</p>
            <p className="font-mono mt-0.5 text-xs text-[#444]">Full-time · Freelance</p>
          </div>
          <div className="border-r px-6 py-5" style={{ borderColor: '#1a1a1a' }}>
            <p className="font-mono mb-2 text-[9px] uppercase tracking-widest text-[#252525]">
              STACK
            </p>
            <p className="font-mono text-sm text-[#f0ece3]">TypeScript · React</p>
            <p className="font-mono mt-0.5 text-xs text-[#444]">Go · Kubernetes · Linux</p>
          </div>
          <div className="px-6 py-5">
            <p className="font-mono mb-2 text-[9px] uppercase tracking-widest text-[#252525]">
              CONTACT
            </p>
            <a
              href="mailto:yo@ndo.dev"
              className="font-mono block text-sm text-[#f0ece3] transition-colors hover:text-[#c8ff00]"
            >
              yo@ndo.dev
            </a>
            <a
              href="https://github.com/ndom91"
              target="_blank"
              rel="noreferrer"
              className="font-mono mt-0.5 block text-xs text-[#444] transition-colors hover:text-[#c8ff00]"
            >
              github.com/ndom91
            </a>
          </div>
        </div>
      </section>

      {/* Writing */}
      <section>
        <div
          className="flex items-center justify-between border-b px-6 py-4"
          style={{ borderColor: '#1a1a1a' }}
        >
          <div className="flex items-center gap-4">
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#252525]">
              WRITING
            </span>
            <span className="h-3 w-px bg-[#1a1a1a]" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#252525]">
              {posts.length} {posts.length === 1 ? 'ENTRY' : 'ENTRIES'}
            </span>
          </div>
          <Link
            to="/blog"
            className="font-mono text-[10px] uppercase tracking-widest text-[#2a2a2a] transition-colors hover:text-[#c8ff00]"
          >
            ALL POSTS →
          </Link>
        </div>
        {posts.length === 0 ? (
          <div className="px-6 py-10">
            <p className="font-mono text-xs text-[#252525]">{'// no posts published yet'}</p>
          </div>
        ) : (
          posts.slice(0, 5).map((post) => <PostCard key={post.slug} post={post} />)
        )}
      </section>

      <Ticker faint />

      {/* Footer */}
      <footer
        className="grid border-t"
        style={{ gridTemplateColumns: '1fr auto', borderColor: '#1a1a1a' }}
      >
        <div className="border-r px-6 py-5" style={{ borderColor: '#1a1a1a' }}>
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#1c1c1c]">
            NDOM91 · YO@NDO.DEV · NDO.DEV
          </p>
          <p className="font-mono mt-1 text-[9px] text-[#181818]">
            © {new Date().getFullYear()} · BUILT WITH TANSTACK START · DEPLOYED ON CLOUDFLARE
          </p>
        </div>
        <div className="flex items-center gap-5 px-6 py-5">
          {(
            [
              ['GH', 'https://github.com/ndom91'],
              ['X', 'https://x.com/ndom91'],
              ['ML', 'mailto:yo@ndo.dev'],
            ] as const
          ).map(([label, href]) => (
            <a
              key={label}
              href={href}
              className="font-mono text-[10px] uppercase tracking-widest text-[#222] transition-colors hover:text-[#c8ff00]"
            >
              {label}
            </a>
          ))}
        </div>
      </footer>
    </div>
  )
}
