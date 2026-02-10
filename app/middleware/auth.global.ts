import { jwtDecode } from "jwt-decode";

export default defineNuxtRouteMiddleware((to) => {
  const token = useCookie<string | null>("token", {
    default: () => null,
    sameSite: "lax"
  });

  const publicRoutes = ["/signin", "/terms", "/privacy"];

  const logout = () => {
    token.value = null;            
    return navigateTo("/signin", { replace: true });
  };

  if (!token.value) {
    if (!publicRoutes.includes(to.path)) return logout();
    return;
  }

  try {
    const { exp } = jwtDecode<{ exp: number }>(token.value);

    const isExpired = Date.now() >= exp * 1000;

    if (isExpired) {
      return logout();   
    }

  } catch {
    return logout();     
  }

  if (to.path === "/signin") {
    return navigateTo("/", { replace: true });
  }
});
