import { jwtDecode } from "jwt-decode";

type JwtPayload = {
  exp: number;
  role?: string;
  roles?: string[];
  authorities?: string[];
};

export default defineNuxtRouteMiddleware((to) => {
  const toast = useToast();

  const token = useCookie<string | null>("token", {
    default: () => null,
    sameSite: "lax",
  });

  const publicRoutes = ["/signin", "/terms", "/privacy"];

  // Global state for the modal
  const expiredModalOpen = useState<boolean>("auth:expiredModalOpen", () => false);
  const expiredReason = useState<string>("auth:expiredReason", () => "");

  const logout = () => {
    token.value = null;
    // open modal (only once)
    expiredReason.value = "Your session has expired. Please login again.";
    expiredModalOpen.value = true;

    // allow navigation to continue; the modal will redirect from UI
    // BUT if user is on protected route, we can still prevent it:
    if (!publicRoutes.includes(to.path)) return abortNavigation();
  };

  // Not logged in
  if (!token.value) {
    if (!publicRoutes.includes(to.path)) {
      // no token is a login-required case (you can reuse same modal or just redirect)
      return navigateTo("/signin", { replace: true });
    }
    return;
  }

  // Decode token
  let payload: JwtPayload;
  try {
    payload = jwtDecode<JwtPayload>(token.value);
  } catch (err) {
    console.error("Failed to decode JWT token:", err);
    return logout();
  }

  // Expired
  const isExpired = Date.now() >= payload.exp * 1000;
  if (isExpired) return logout();

  // Block ROLE_USER from /admin/*
  if (to.path.startsWith("/admin")) {
    const role =
      payload.role ??
      payload.roles?.[0] ??
      payload.authorities?.[0] ??
      "";

    const isAdmin =
      role === "ROLE_ADMIN" ||
      payload.roles?.includes("ROLE_ADMIN") ||
      payload.authorities?.includes("ROLE_ADMIN");

    if (!isAdmin) {
      toast.add({
        title: "Access denied",
        description: "Insufficient Privileges!",
        color: "error",
      });
      return navigateTo("/", { replace: true });
    }
  }

  if (to.path === "/signin") {
    return navigateTo("/", { replace: true });
  }
});
