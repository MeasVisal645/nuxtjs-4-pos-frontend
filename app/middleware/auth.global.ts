export default defineNuxtRouteMiddleware(async (to) => {
  const toast = useToast()

  const token = useCookie<string | null>("accessToken", {
    default: () => null,
    sameSite: "lax",
  })

  const publicRoutes = ["/signin", "/terms", "/privacy"]

  const expiredModalOpen = useState<boolean>("auth:expiredModalOpen", () => false)
  const expiredReason = useState<string>("auth:expiredReason", () => "")

  const forceLogout = (reason = "Your session has expired. Please login again.") => {
    token.value = null
    expiredReason.value = reason
    expiredModalOpen.value = true
  }

  if (!token.value) {
    if (!publicRoutes.includes(to.path)) {
      return navigateTo("/signin", { replace: true })
    }
    return
  }

  if (to.path === "/signin") {
    return navigateTo("/", { replace: true })
  }

  let me: any
  try {
    me = await useApi("/user/me")
  } catch (err: any) {
    forceLogout()
    if (!publicRoutes.includes(to.path)) return abortNavigation()
    return
  }

  if (to.path.startsWith("/admin")) {
    const role =
      me?.role ??
      me?.roles?.[0] ??
      me?.authorities?.[0] ??
      ""

    const isAdmin =
      role === "ROLE_ADMIN" ||
      me?.roles?.includes("ROLE_ADMIN") ||
      me?.authorities?.includes("ROLE_ADMIN")

    if (!isAdmin) {
      toast.add({
        title: "Access denied",
        description: "Insufficient Privileges!",
        color: "error",
      })
      return navigateTo("/", { replace: true })
    }
  }
})
