/**
 * Get the JWT token from cookies
 * This is needed because Payload's authentication middleware doesn't properly
 * read cookies in Next.js App Router, so we need to manually send the token
 * in the Authorization header for authenticated requests.
 */
export function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null
  
  const cookies = document.cookie.split(';')
  const authCookie = cookies.find(c => c.trim().startsWith('payload-token-app-users='))
  
  if (!authCookie) return null
  
  const token = authCookie.split('=')[1]
  return token || null
}

/**
 * Make an authenticated request to Payload API
 * Automatically includes the JWT token in the Authorization header
 */
export async function payloadFetch(url: string, options: RequestInit = {}) {
  const token = getAuthToken()
  
  const headers = new Headers(options.headers)
  
  // Only set Content-Type for non-FormData requests
  // FormData will set its own Content-Type with boundary
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  
  if (token) {
    headers.set('Authorization', `JWT ${token}`)
  }
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Still send cookies as fallback
  })
}
