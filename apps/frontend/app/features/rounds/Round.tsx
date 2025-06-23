import { type FC, useEffect, useState } from "react";
import type { Round as TRound } from "../../core/types";
import { Link } from "react-router";

export const Round: FC<{
  round: TRound;
}> = ({ round }) => {
  const msUntilStart = new Date(round.startedAt).getTime() - Date.now();

  // секунды до старта, округлённые вниз
  const secondsUntilStart = Math.max(0, Math.floor(msUntilStart / 1000));
  console.log(secondsUntilStart);
  const [seconds, setSeconds] = useState(secondsUntilStart);
  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <Link
      key={round.id}
      to={`/games/${round.id}`}
      className={"p-2 hover:bg-sky-600 hover:border-sky-600 border-2"}
    >
      <p>{round.name}</p>
      {seconds > 0 ? (
        <p>До начала раунда осталось {seconds} секунд</p>
      ) : (
        <p>Раунд завершен</p>
      )}
    </Link>
  );
};
