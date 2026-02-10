import { jwtDecode } from "jwt-decode";

export default defineNuxtRouteMiddleware((to) => {
  const token = useCookie<string | null>("token", { default: () => null });
  const publicRoutes = ["/signin", "/terms", "/privacy"];

  if (token.value) {
    try {
      const { exp } = jwtDecode<{ exp: number }>(token.value);
      if (Date.now() >= exp * 1000) {
        token.value = null; 
        if (!publicRoutes.includes(to.path)) {
          return navigateTo("/signin");
        }
      }
    } catch (e) {
      token.value = null;
      if (!publicRoutes.includes(to.path)) {
        return navigateTo("/signin");
      }
    }
  }

  if (!token.value && !publicRoutes.includes(to.path)) {
    return navigateTo("/signin");
  }

  if (token.value && to.path === "/signin") {
    return navigateTo("/");
  }
});
