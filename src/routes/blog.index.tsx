import { createFileRoute, Link } from '@tanstack/react-router'
import type { BlogPost } from '../lib/blog'
import { getPublishedPosts } from '../lib/blog'

type PostData = Omit<BlogPost, 'Component'>

export const Route = createFileRoute('/blog/')({
  loader: () => getPublishedPosts().map(({ Component: _c, ...post }): PostData => post),
  component: BlogIndex,
})

function BlogIndex() {
  const posts = Route.useLoaderData()

  return (
    <div className="flex min-h-screen flex-col bg-[#0d0c0a] text-[#ede8df]">
      <nav
        className="grid border-b"
        style={{ gridTemplateColumns: 'auto 1fr auto', borderColor: '#242220' }}
      >
        <div className="border-r px-6 py-4" style={{ borderColor: '#242220' }}>
          <Link
            to="/"
            className="font-mono text-[11px] font-medium uppercase tracking-[0.25em] transition-colors hover:text-white"
          >
            NDOM91
          </Link>
        </div>
        <div className="flex items-center gap-7 px-7">
          <Link
            to="/blog"
            className="font-mono text-[10px] uppercase tracking-widest text-[#ede8df]"
          >
            WRITING
          </Link>
          <a
            href="https://github.com/ndom91"
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[10px] uppercase tracking-widest text-[#606060] transition-colors hover:text-[#ede8df]"
          >
            GITHUB
          </a>
          <a
            href="mailto:yo@ndo.dev"
            className="font-mono text-[10px] uppercase tracking-widest text-[#606060] transition-colors hover:text-[#ede8df]"
          >
            CONTACT
          </a>
        </div>
        <div
          className="flex items-center gap-2.5 border-l px-6 py-4"
          style={{ borderColor: '#242220' }}
        >
          <span className="block size-1.5 rounded-full bg-[#c8ff00]" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#606060]">
            PLAIN.COM
          </span>
        </div>
      </nav>

      <div className="border-b px-6 py-10" style={{ borderColor: '#242220' }}>
        <p className="font-mono mb-3 text-[9px] uppercase tracking-widest text-[#555]">ARCHIVE</p>
        <h1
          className="font-heading uppercase leading-none tracking-[-0.03em] text-[#ede8df]"
          style={{ fontSize: 'clamp(3rem, 10vw, 8rem)', fontWeight: 800 }}
        >
          WRITING
        </h1>
        <p className="font-mono mt-3 text-xs text-[#555]">
          {posts.length} {posts.length === 1 ? 'ENTRY' : 'ENTRIES'}
        </p>
      </div>

      <div className="flex-1">
        {posts.length === 0 ? (
          <div className="px-6 py-10">
            <p className="font-mono text-xs text-[#3a3a3a]">{'// no posts published yet'}</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: '#242220' }}>
            {posts.map((post) => (
              <Link
                key={post.slug}
                to="/blog/$slug"
                params={{ slug: post.slug }}
                className="group flex items-start justify-between gap-6 px-6 py-5 transition-colors hover:bg-[#111009]"
              >
                <div className="min-w-0 flex-1">
                  <h2 className="font-mono text-sm font-medium leading-snug text-[#ede8df] transition-colors group-hover:text-white">
                    {post.title}
                  </h2>
                  <p className="font-mono mt-1 line-clamp-1 text-xs leading-relaxed text-[#505050]">
                    {post.description}
                  </p>
                </div>
                <div className="mt-0.5 flex shrink-0 items-center gap-3">
                  {(post.tags ?? []).slice(0, 1).map((tag) => (
                    <span
                      key={tag}
                      className="font-mono px-2 py-0.5 text-[9px] uppercase tracking-widest text-[#555] transition-colors group-hover:text-[#777]"
                      style={{ border: '1px solid #242220' }}
                    >
                      {tag}
                    </span>
                  ))}
                  <time
                    dateTime={post.publishedAt}
                    className="font-mono whitespace-nowrap text-[10px] text-[#555] transition-colors group-hover:text-[#c8ff00]"
                  >
                    {post.publishedAt}
                  </time>
                  <span className="font-mono text-xs text-[#444] transition-colors group-hover:text-[#c8ff00]">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <footer
        className="grid border-t"
        style={{ gridTemplateColumns: '1fr auto', borderColor: '#242220' }}
      >
        <div className="border-r px-6 py-5" style={{ borderColor: '#242220' }}>
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#333]">
            NDOM91 · YO@NDO.DEV · NDO.DEV
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
              className="font-mono text-[10px] uppercase tracking-widest text-[#555] transition-colors hover:text-[#c8ff00]"
            >
              {label}
            </a>
          ))}
        </div>
      </footer>
    </div>
  )
}
