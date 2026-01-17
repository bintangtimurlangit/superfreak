// Native Payload auth endpoints
export const AUTH_ENDPOINTS = {
  app: {
    login: '/api/app-users/login',
    logout: '/api/app-users/logout',
    me: '/api/app-users/me',
    refresh: '/api/app-users/refresh-token',
  },
  admin: {
    login: '/api/admin-users/login',
    logout: '/api/admin-users/logout',
    me: '/api/admin-users/me',
    refresh: '/api/admin-users/refresh-token',
  },
}

// Helper functions for app-user auth
export const appAuth = {
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

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.user || null
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

// Helper functions for admin auth
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
