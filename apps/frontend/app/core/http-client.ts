export type Credentials = {
  username: string;
  password: string;
};

const isTokenResponse = (data: unknown): data is { token: string } => {
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

    if (isTokenResponse(res)) {
      return res.token;
    }

    throw new Error(res.message);
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

    if (isTokenResponse(res)) {
      return res.token;
    }

    throw new Error(res.message);
  }
}
