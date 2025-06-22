import type { Route } from "~/.react-router/types/app/routes/+types/games.$id";
import { parseAuthCookie } from "../../shared/utils/auth.cookie";
import { redirect } from "react-router";
import { HttpClient } from "../core/http-client";

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
  return (
    <section className={"flex items-start justify-between"}>
      <h1>{params.loaderData.game.name}</h1>
    </section>
  );
}
