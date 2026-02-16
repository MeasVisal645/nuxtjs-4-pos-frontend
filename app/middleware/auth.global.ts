import { jwtDecode } from "jwt-decode";

type JwtPayload = {
  exp: number;
  role?: string;   
  roles?: string[];  
  authorities?: string[]; 
};

export default defineNuxtRouteMiddleware((to) => {
const toast = useToast()

  const token = useCookie<string | null>("token", {
    default: () => null,
    sameSite: "lax",
  });

  const publicRoutes = ["/signin", "/terms", "/privacy"];

  const logout = () => {
    token.value = null;
    return navigateTo("/signin", { replace: true });
  };

  // Not logged in
  if (!token.value) {
    if (!publicRoutes.includes(to.path)) return logout();
    return;
  }

  // Decode token
  let payload: JwtPayload;
  try {
    payload = jwtDecode<JwtPayload>(token.value);
  } catch {
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
      // Use alert (simple). If you prefer toast, see below.
      toast.add({
        title: 'Access denied',
        description: 'Insufficient Privileges!',
        color: 'error'
      })
      return navigateTo("/", { replace: true });
    }
  }

  // Already logged in, prevent going to signin
  if (to.path === "/signin") {
    return navigateTo("/", { replace: true });
  }
});
