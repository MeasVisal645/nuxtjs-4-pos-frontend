type LoginPayload = { username: string; password: string }

export const useAuth = () => {
  const config = useRuntimeConfig()
  const token = useCookie<string | null>("accessToken", {
    default: () => null,
    watch: true,
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
  })

  const baseURL = `${config.public.apiBaseUrl}/api/v1`

  const login = async (payload: LoginPayload) => {
    const res = await $fetch<{ accessToken: string }>(`${baseURL}/auth/signin`, {
      method: "POST",
      body: payload,
      credentials: "include",
    })

    if (!res?.accessToken) throw new Error("Invalid login response: missing accessToken")

    token.value = res.accessToken
  }

  const logout = async () => {
    try {
      await $fetch(`${baseURL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      })
    } catch {
    }

    token.value = null
    return navigateTo("/signin", { replace: true })
  }

  const ensureAuth = async () => {
    if (!token.value) return false
    try {
      await useApi("/user/me")
      return true
    } catch {
      return false
    }
  }

  return { token, login, logout, ensureAuth }
}
