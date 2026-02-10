import { jwtDecode } from "jwt-decode"; // npm install jwt-decode

type LoginPayload = { username: string; password: string };

export const useAuth = () => {
  const config = useRuntimeConfig();
  const token = useCookie<string | null>("token", { 
    default: () => null,
    watch: true, // Ensures state stays in sync
    maxAge: 60 * 60 * 24 * 7 // Optional: Match cookie life to JWT life (e.g. 1 week)
  });

  const checkTokenStatus = () => {
    if (!token.value) return;

    try {
      const { exp } = jwtDecode<{ exp: number }>(token.value);
      const isExpired = Date.now() >= exp * 1000;
      
      if (isExpired) {
        logout();
      }
    } catch (e) {
      logout(); // Logout if token is malformed
    }
  };

  const isExpired = (jwt: string | null) => {
  if (!jwt || !jwt.includes('.')) return true; // Basic validation
  
  try {
    const base64Payload = jwt.split('.')[1]; 
    if (!base64Payload) return true;

    const payload = JSON.parse(atob(base64Payload));
    
    return Date.now() >= payload.exp * 1000;
  } catch (e) {
    return true;
  }
};

  const login = async (payload: LoginPayload) => {
    const res = await $fetch<any>(`${config.public.apiBaseUrl}/api/v1/auth/signin`, {
      method: "POST",
      body: payload,
    });

    if (!res?.token) throw new Error("Token not found");
    token.value = res.token;
  };

  const logout = () => {
    token.value = null;
    return navigateTo("/login");
  };

  return { token, login, logout, checkTokenStatus };
};
