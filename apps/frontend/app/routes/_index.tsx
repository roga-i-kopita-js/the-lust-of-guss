import { Login } from "../features/login/Login";
import { type Route } from "~/.react-router/types/app/routes/+types/_index";
import {
  type ClientActionFunction,
  type ClientLoaderFunction,
  redirect,
  useFetcher,
} from "react-router";
import { parseAuthCookie, setAuthCookie } from "../../shared/utils/auth.cookie";
import { HttpClient } from "../core/http-client";

export function meta() {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export const clientLoader = (async ({ request }: Route.ClientLoaderArgs) => {
  const auth = await parseAuthCookie(request);
  if (auth) {
    return redirect("/games");
  }
}) satisfies ClientLoaderFunction;

export const clientAction = (async (parmas: Route.ClientActionArgs) => {
  const data = await parmas.request.json();
  const client = new HttpClient(import.meta.env.VITE_BACKEND_URL, null);
  try {
    // пытаемся залогинить игрока
    document.cookie = await setAuthCookie(await client.login(data));
    return redirect("/games");
  } catch (e) {
    const error = e as { message: string };
    // проверка на отстуствие пользлвателя
    if (
      error.message.includes(
        'Could not find any entity of type "User" matching',
      )
    ) {
      // если такого пользователя нет, то регистрируем игрока и сразу же авторизуем
      document.cookie = await setAuthCookie(await client.register(data));
      return redirect("/games");
    }

    // если такой пользователь уже существует выдаем ошибку
    return { username: "User already exist", type: "action" };
  }
}) satisfies ClientActionFunction;

export default function _index() {
  const fetcher = useFetcher();
  return (
    <section className={"flex items-center justify-center flex-1"}>
      <Login
        serverErrors={
          fetcher.data?.type === "action" ? fetcher.data : undefined
        }
        onSubmit={async (d) => {
          await fetcher.submit(d, {
            method: "POST",
            encType: "application/json",
          });
        }}
      />
    </section>
  );
}
