import { createCookie } from "react-router";

type EntityName = string;
type ActionList = Array<string>;
export type ParsedToken = {
  id: string;
  exp: number;
  role: {
    name: string;
    permissions: Record<EntityName, ActionList>;
  };
};

const authCookie = createCookie("auth_token", {
  httpOnly: false,
  path: "/",
  sameSite: "lax",
});

function decodeJwt(token: string): ParsedToken {
  const payload = token.split(".")[1];
  const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(json) as ParsedToken;
}

export const parseAuthCookie = async (
  req: Request,
): Promise<ParsedToken | null> => {
  let auth = null;
  try {
    const token: string = await authCookie.parse(
      typeof window === "undefined"
        ? req.headers.get("Cookie")
        : document.cookie,
    );
    const authData = decodeJwt(token);
    if (authData && authData.exp > Date.now() / 1000) {
      auth = authData;
    }
  } catch (_e) {
    console.warn(_e);
    return auth;
  }

  return auth;
};

export const setAuthCookie = async (token: string): Promise<string> => {
  return authCookie.serialize(token);
};
