export const useApi = async <T = any>(
  path: string,
  opts: any = {},
): Promise<T> => {
  const token = useCookie<string | null>("token", { default: () => null });
  const baseURL = "http://localhost:8081/api/v1";
  const state = useState("globalSessionExpired", () => ({ show: true }));

  const authHeader = token.value
    ? token.value.startsWith("Bearer ")
      ? token.value
      : `Bearer ${token.value}`
    : null;

  try {
    return await $fetch<T>(baseURL + path, {
      ...opts,
      headers: {
        ...(opts.headers as Record<string, string> | undefined),
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      credentials: "include",
    });
  } catch (err: any) {
    const status = err?.response?.status ?? err?.status;
    if (status === 401 || status === 403) {
      token.value = null;
      state.value = { show: true };
    }
    throw err;
  }
};
