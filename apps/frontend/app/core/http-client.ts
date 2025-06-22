import type { Credentials, Round, RoundListResponse } from "./types";

const isErrorResponse = (data: unknown): data is { message: string } => {
  return (
    typeof data === "object" &&
    data !== null &&
    "token" in data &&
    typeof data.token === "string"
  );
};

export class HttpClient {
  constructor(
    protected readonly apiUrl: string,
    protected token: string | null,
  ) {}

  public setToken(token: string) {
    this.token = token;
  }

  protected getPath(path: string): string {
    return `${this.apiUrl}${path}`;
  }

  public async login(credentials: Credentials): Promise<string> {
    const data = await fetch(this.getPath("user/sign-in"), {
      method: "POST",
      body: JSON.stringify(credentials),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const res = (await data.json()) as { token: string } | { message: string };

    if (isErrorResponse(res)) {
      throw new Error(res.message);
    }

    return res.token;
  }

  public async register(credentials: Credentials): Promise<string> {
    const data = await fetch(this.getPath("user"), {
      method: "POST",
      body: JSON.stringify(credentials),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const res = (await data.json()) as { token: string } | { message: string };

    if (isErrorResponse(res)) {
      throw new Error(res.message);
    }

    return res.token;
  }

  public async getGames(): Promise<RoundListResponse> {
    const data = await fetch(this.getPath("round/list"), {
      headers: {
        Authorization: this.token ?? "",
      },
    });

    const res = (await data.json()) as RoundListResponse | { message: string };

    if (isErrorResponse(res)) {
      throw new Error(res.message);
    }
    return res;
  }

  public async getGameById(id: string): Promise<Round> {
    const data = await fetch(this.getPath(`round/list?id=${id}`), {
      headers: {
        Authorization: this.token ?? "",
      },
    });

    const res = (await data.json()) as RoundListResponse | { message: string };

    if (isErrorResponse(res)) {
      throw new Error(res.message);
    }

    if (!res.items[0]) {
      throw new Error("not found");
    }

    return res.items[0];
  }
}
