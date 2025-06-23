import type { Credentials, Round, RoundListResponse } from "./types";
import { type ParsedQuery, withQuery } from "ufo";
const isErrorResponse = (data: unknown): data is { message: string } => {
  return (
    typeof data === "object" &&
    data !== null &&
    "message" in data &&
    typeof data.message === "string"
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

  protected getPath(path: string, query?: ParsedQuery): string {
    return withQuery(`${this.apiUrl}${path}`, query ?? {});
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

  public async getGames(params?: {
    // iso string
    startedAt?: string;
    // iso string
    endedAt?: string;
    id?: string;
  }): Promise<RoundListResponse> {
    const options: ParsedQuery = {};
    if (params?.startedAt) {
      options.startedAt = params.startedAt;
    }

    if (params?.endedAt) {
      options.endedAt = params.endedAt;
    }

    if (params?.id) {
      options.id = params.id;
    }

    const data = await fetch(this.getPath("round/list", options), {
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
    const res = await this.getGames({ id });

    if (!res.items[0]) {
      throw new Error("not found");
    }

    return res.items[0];
  }

  public async createGame(options: {
    name: string;
    startedAt: string;
    endedAt: string;
  }): Promise<Round> {
    const data = await fetch(this.getPath("round/create"), {
      method: "POST",
      body: JSON.stringify(options),
      headers: {
        Authorization: this.token ?? "",
        "Content-Type": "application/json",
      },
    });

    const res = (await data.json()) as Round;

    if (isErrorResponse(res)) {
      throw new Error(res.message);
    }
    return res;
  }
}
