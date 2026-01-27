type LoginPayload = { username: string; password: string };

export const useAuth = () => {
  const token = useCookie<string | null>("token", { default: () => null });

  const login = async (payload: LoginPayload) => {
    const res = await $fetch<any>("http://localhost:8081/api/v1/auth/signin", {
      method: "POST",
      body: payload,
    });

    // backend returns { token: "xxxx" }
    const t = res?.token;

    if (!t) throw new Error("Token not found in login response");

    token.value = t; // 🔥 store RAW token only
  };

  const logout = async () => {
    token.value = null;
    await navigateTo("/login");
  };

  return { token, login, logout };
};
