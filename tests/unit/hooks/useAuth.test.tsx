import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth, AuthProvider } from '@/hooks/useAuth'
import { type ReactNode } from 'react'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Wrapper with AuthProvider
const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('starts with loading state', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves

      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.user).toBe(null)
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('fetches current user on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            user: { id: '1', email: 'test@test.com', username: 'tester', role: 'PLAYER' },
          },
        }),
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.user).toEqual({
        id: '1',
        email: 'test@test.com',
        username: 'tester',
        role: 'PLAYER',
      })
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('sets user to null when not authenticated', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          success: false,
          error: { message: 'Unauthorized' },
        }),
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.user).toBe(null)
      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  describe('login', () => {
    it('updates user state after successful login', async () => {
      // Initial fetch returns no user
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ success: false }),
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Mock login API call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            user: { id: '1', email: 'test@test.com', username: 'tester', role: 'PLAYER' },
          },
        }),
      })

      await act(async () => {
        await result.current.login('test@test.com', 'password123')
      })

      expect(result.current.user).toEqual({
        id: '1',
        email: 'test@test.com',
        username: 'tester',
        role: 'PLAYER',
      })
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('throws error on failed login', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ success: false }),
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          success: false,
          error: { message: 'Invalid credentials' },
        }),
      })

      await expect(
        act(async () => {
          await result.current.login('wrong@test.com', 'wrongpass')
        })
      ).rejects.toThrow('Invalid credentials')
    })
  })

  describe('logout', () => {
    it('clears user state after logout', async () => {
      // Start with authenticated user
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            user: { id: '1', email: 'test@test.com', username: 'tester', role: 'PLAYER' },
          },
        }),
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })

      // Mock logout API call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      await act(async () => {
        await result.current.logout()
      })

      expect(result.current.user).toBe(null)
      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  describe('register', () => {
    it('updates user state after successful registration', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ success: false }),
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            user: { id: '1', email: 'new@test.com', username: 'newuser', role: 'PLAYER' },
          },
        }),
      })

      await act(async () => {
        await result.current.register('newuser', 'new@test.com', 'password123')
      })

      expect(result.current.user).toEqual({
        id: '1',
        email: 'new@test.com',
        username: 'newuser',
        role: 'PLAYER',
      })
    })
  })

  describe('guest mode', () => {
    it('sets guest user without API call', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ success: false }),
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.continueAsGuest()
      })

      expect(result.current.user).toEqual({
        id: 'guest',
        email: '',
        username: 'Guest',
        role: 'GUEST',
      })
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isGuest).toBe(true)
    })
  })
})
