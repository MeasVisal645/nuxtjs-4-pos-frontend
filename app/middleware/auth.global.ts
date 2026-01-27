export default defineNuxtRouteMiddleware((to) => {
  const token = useCookie<string | null>("token", { default: () => null });

  // allow the login page without token
  if (!token.value && to.path !== "/signin") {
    return navigateTo("/signin");
  }

  // if already logged in, don't allow going back to login page
  if (token.value && to.path === "/signin") {
    return navigateTo("/");
  }
});
