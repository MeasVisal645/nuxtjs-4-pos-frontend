type LoginPayload = { username: string; password: string };

export const useAuth = () => {
  const config = useRuntimeConfig();
  const token = useCookie<string | null>("token", { default: () => null });

  const login = async (payload: LoginPayload) => {
    const res = await $fetch<any>(
      `${config.public.apiBaseUrl}/api/v1/auth/signin`,
      {
        method: "POST",
        body: payload,
      },
    );

    const t = res?.token;

    if (!t) throw new Error("Token not found in login response");

    token.value = t;
  };

  const logout = async () => {
    token.value = null;
    await navigateTo("/login");
  };

  return { token, login, logout };
};
