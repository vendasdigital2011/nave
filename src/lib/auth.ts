import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, AuthUser } from "./auth-constants";

export async function getSession(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME);

  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString("utf-8"));
    if (decoded && decoded.email) {
      return decoded as AuthUser;
    }
  } catch {
    return null;
  }

  return null;
}
