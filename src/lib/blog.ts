import { allPosts } from 'content-collections'

export type BlogPost = (typeof allPosts)[number]

function getAllPosts() {
  return [...allPosts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

export function getPublishedPosts() {
  return getAllPosts().filter((post) => !post.draft)
}

export function getPublishedPost(slug: string) {
  return getPublishedPosts().find((post) => post.slug === slug)
}
