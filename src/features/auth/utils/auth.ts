export const AUTH_ENDPOINTS = {
  app: {
    login: '/api/app-users/login',
    logout: '/api/logout', // Custom endpoint that properly clears cookies
    me: '/api/me', // Custom endpoint that properly handles JWT auth
    refresh: '/api/app-users/refresh-token',
  },
  admin: {
    login: '/api/admin-users/login',
    logout: '/api/admin-users/logout',
    me: '/api/admin-users/me',
    refresh: '/api/admin-users/refresh-token',
  },
}

export const appAuth = {
  googleSignIn() {
    window.location.href = '/api/auth/google'
  },

  async login(email: string, password: string) {
    const response = await fetch(AUTH_ENDPOINTS.app.login, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Login failed' }))
      throw new Error(error.message || 'Login failed')
    }

    return response.json()
  },

  async logout() {
    const response = await fetch(AUTH_ENDPOINTS.app.logout, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Logout failed')
    }

    return response.json()
  },

  async getMe() {
    const response = await fetch(AUTH_ENDPOINTS.app.me, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    console.log('[Auth] getMe raw response:', response)

    if (!response.ok) {
      console.log('[Auth] getMe failed:', response.status, response.statusText)
      return null
    }

    const data = await response.json()
    console.log('[Auth] getMe response:', {
      hasUser: !!data.user,
      hasData: !!data,
      userId: data.user?.id || data?.id,
      email: data.user?.email || data?.email,
    })
    return data.user || data || null
  },

  async register(email: string, password: string, name?: string) {
    const response = await fetch('/api/app-users', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Registration failed' }))
      throw new Error(error.message || 'Registration failed')
    }

    return response.json()
  },
}

export const adminAuth = {
  async login(email: string, password: string) {
    const response = await fetch(AUTH_ENDPOINTS.admin.login, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Login failed' }))
      throw new Error(error.message || 'Login failed')
    }

    return response.json()
  },

  async logout() {
    const response = await fetch(AUTH_ENDPOINTS.admin.logout, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Logout failed')
    }

    return response.json()
  },

  async getMe() {
    const response = await fetch(AUTH_ENDPOINTS.admin.me, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.user || null
  },
}
