import type { Route } from "~/.react-router/types/app/routes/+types/games";
import { parseAuthCookie } from "../../shared/utils/auth.cookie";
import { type ClientLoaderFunction, redirect } from "react-router";

export const clientLoader = (async ({ request }: Route.ClientLoaderArgs) => {
  const auth = await parseAuthCookie(request);
  if (!auth) {
    return redirect("/");
  }
}) satisfies ClientLoaderFunction;

export default function Games() {
  return (
    <section className={"flex items-center justify-center flex-1"}>
      <h1>Games page</h1>
    </section>
  );
}
