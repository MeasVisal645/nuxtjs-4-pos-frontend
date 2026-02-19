let refreshPromise: Promise<string | null> | null = null

export const useApi = async <T = any>(
  path: string,
  opts: any = {},
): Promise<T> => {
  const config = useRuntimeConfig()
  const token = useCookie<string | null>("accessToken", { default: () => null })
  const baseURL = `${config.public.apiBaseUrl}/api/v1`
  const state = useState("globalSessionExpired", () => ({ show: false })) 

  const buildAuthHeader = (t: string | null) => {
    if (!t) return null
    return t.startsWith("Bearer ") ? t : `Bearer ${t}`
  }

  const doFetch = (overrideToken?: string | null) => {
    const authHeader = buildAuthHeader(overrideToken ?? token.value)

    return $fetch<T>(baseURL + path, {
      ...opts,
      headers: {
        ...(opts.headers as Record<string, string> | undefined),
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      credentials: "include",
    })
  }

  const refreshAccessToken = async (): Promise<string | null> => {
    if (!refreshPromise) {
      refreshPromise = $fetch<{ accessToken: string }>(`${baseURL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      })
        .then((r) => r.accessToken)
        .catch(() => null)
        .finally(() => {
          refreshPromise = null
        })
    }
    return refreshPromise
  }

  try {
    return await doFetch()
  } catch (err: any) {
    const status = err?.response?.status ?? err?.status

    if (status === 401 && path !== "/auth/refresh") {
      const newToken = await refreshAccessToken()

      if (newToken) {
        token.value = newToken
        return await doFetch(newToken)
      }

      token.value = null
      state.value = { show: true }
    }

    throw err
  }
}
