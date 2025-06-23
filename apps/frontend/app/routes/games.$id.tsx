import type { Route } from "~/.react-router/types/app/routes/+types/games.$id";
import { parseAuthCookie } from "../../shared/utils/auth.cookie";
import { redirect } from "react-router";
import { HttpClient } from "../core/http-client";
import { Game } from "../features/game/Game";
import { useWebSocket } from "../core/web-socket-context-value";
import type { HitInfo, Round } from "../core/types";
import { useEffect, useState } from "react";

export const clientLoader = async ({
  request,
  params,
}: Route.ClientLoaderArgs) => {
  const auth = await parseAuthCookie(request);

  if (!auth) {
    return redirect("/");
  }

  const httpClient = new HttpClient(
    import.meta.env.VITE_BACKEND_URL,
    auth.token,
  );

  const game = await httpClient.getGameById(params.id);

  return {
    game,
  };
};

export default function Games(params: Route.ComponentProps) {
  const { client } = useWebSocket();
  const touchGuss = (game: Round) => {
    client.emit("play", { id: game.id });
  };

  // подписываемся на обновление списка раундов по вебсокету, чтобы синхронизировать состояние с другими игроками
  const [info, setInfo] = useState<HitInfo | undefined>();

  useEffect(() => {
    const handleHit = (data: HitInfo) => {
      setInfo(data);
    };

    client.on("round.hit", handleHit);
    return () => {
      client.off("round.hit", handleHit);
    };
  }, [client]);
  // ------------------------------------------------------------

  return (
    <section className={"flex flex-1 items-center justify-center"}>
      <Game game={params.loaderData.game} touch={touchGuss} hitInfo={info} />
    </section>
  );
}
