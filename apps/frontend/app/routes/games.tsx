import type { Route } from "~/.react-router/types/app/routes/+types/games";
import { parseAuthCookie } from "../../shared/utils/auth.cookie";
import {
  type ClientLoaderFunction,
  Outlet,
  redirect,
  useFetcher,
} from "react-router";
import { HttpClient } from "../core/http-client";
import { Rounds } from "../features/rounds/Rounds";
import { CreateRound } from "../features/create-round/CreateRound";
import { getFutureISOString } from "../../shared/utils/get-futere-date";
import { useEffect, useState } from "react";
import { useWebSocket } from "../core/web-socket-context-value";
import type { Round, RoundListResponse } from "../core/types";

export const clientLoader = (async ({ request }: Route.ClientLoaderArgs) => {
  const auth = await parseAuthCookie(request);

  if (!auth) {
    return redirect("/");
  }

  const httpClient = new HttpClient(
    import.meta.env.VITE_BACKEND_URL,
    auth.token,
  );

  const gameList = await httpClient.getGames({
    startedAt: new Date(
      Date.now() -
        (Number(import.meta.env.VITE_COOLDOWN_DURATION) +
          Number(import.meta.env.VITE_ROUND_DURATION) * 1000),
    ).toISOString(),
  });

  return {
    gameList,
    auth,
  };
}) satisfies ClientLoaderFunction;

export const clientAction = async (params: Route.ClientActionArgs) => {
  const auth = await parseAuthCookie(params.request);

  if (!auth) {
    return redirect("/");
  }

  const httpClient = new HttpClient(
    import.meta.env.VITE_BACKEND_URL,
    auth.token,
  );

  const data = await params.request.json();
  try {
    return await httpClient.createGame(data);
  } catch (e) {
    const error = e as { message: string };

    return {
      message: error.message.includes(
        "duplicate key value violates unique constraint",
      )
        ? "Game with same name already exist"
        : error.message,
      status: "error",
    };
  }
};

export default function Games(params: Route.ComponentProps) {
  // подписываемся на обновление списка раундов по вебсокету, чтобы синхронизировать состояние с другими игроками
  const { client } = useWebSocket();
  const [data, setData] = useState<RoundListResponse>(
    params.loaderData.gameList,
  );
  const fetcher = useFetcher();

  useEffect(() => {
    const handleCreate = (d: Round) => {
      const current = data.items.find((item) => item.id === d.id);
      if (!current) {
        setData((prev) => ({
          ...prev,
          items: [...prev.items, d],
        }));
      }
    };

    client.on("round.create", handleCreate);
    return () => {
      client.off("round.create", handleCreate);
    };
  }, [client]);
  // ------------------------------------------------------------

  return (
    <>
      <div className={"border-1 flex justify-between items-center mb-8 p-8"}>
        <span>player: {params.loaderData.auth.parsed.name}</span>
        {params.loaderData.auth.parsed.role.name === "admin" && (
          <CreateRound
            error={
              fetcher.data?.status === "error"
                ? fetcher.data.message
                : undefined
            }
            onCreate={async ({ name }) => {
              await fetcher.submit(
                {
                  name,
                  startedAt: getFutureISOString(
                    Number(import.meta.env.VITE_COOLDOWN_DURATION),
                  ),
                  endedAt: getFutureISOString(
                    Number(import.meta.env.VITE_COOLDOWN_DURATION) +
                      Number(import.meta.env.VITE_ROUND_DURATION),
                  ),
                },
                {
                  method: "POST",
                  encType: "application/json",
                },
              );
            }}
          />
        )}
      </div>

      <section className={"flex items-start justify-between flex-1"}>
        <Rounds data={data} />
        <Outlet />
      </section>
    </>
  );
}
