export const siteUrl = 'https://ndo.dev/'
export const siteLanguage = 'en'
export const contentLicense = 'https://creativecommons.org/licenses/by/4.0/'

export const websiteId = `${siteUrl}#website`
export const personId = `${siteUrl}#person`
export const blogUrl = `${siteUrl}blog`
export const blogId = `${blogUrl}#blog`
export const blogWebPageId = `${blogUrl}#webpage`

export function absoluteSiteUrl(url: string) {
  return new URL(url, siteUrl).toString()
}

export function isoDateToUtcDateTime(date: string) {
  return `${date}T00:00:00.000Z`
}
