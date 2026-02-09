export default defineNuxtRouteMiddleware((to) => {
  const token = useCookie<string | null>("token", { default: () => null });

  // 1. Define all public routes that don't need a token
  const publicRoutes = ["/signin", "/terms", "/privacy"];

  // 2. If no token and trying to access a protected page, redirect to signin
  if (!token.value && !publicRoutes.includes(to.path)) {
    return navigateTo("/signin");
  }

  // 3. If logged in, prevent access to the signin page (but allow terms/privacy)
  if (token.value && to.path === "/signin") {
    return navigateTo("/");
  }
});
