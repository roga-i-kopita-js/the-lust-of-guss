import { type FC } from "react";
import type { Round as TRound } from "../../core/types";
import { Link } from "react-router";
import { useRoundTimer } from "../../../shared/hooks/use-round-timer";

export const Round: FC<{
  round: TRound;
}> = ({ round }) => {
  const seconds = useRoundTimer(round.startedAt);
  const endSeconds = useRoundTimer(round.endedAt);
  return (
    <Link
      key={round.id}
      to={`/games/${round.id}`}
      className={
        "p-2 hover:bg-sky-600 hover:border-sky-600 border-2 flex flex-col gap-2"
      }
    >
      <p>Id: {round.id}</p>
      <div>
        <p>
          Start date:{" "}
          {new Date(round.startedAt).toLocaleString("en-EN", {
            day: "2-digit",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </p>
        <p>
          End date:{" "}
          {new Date(round.endedAt).toLocaleString("en-EN", {
            day: "2-digit",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </p>
      </div>

      {seconds > 0 && endSeconds > 0 && (
        <p className={"text-orange-400"}>Status: Pending</p>
      )}
      {seconds <= 0 && endSeconds > 0 && (
        <p className={"text-green-400"}>Status: Active</p>
      )}
      {seconds <= 0 && endSeconds <= 0 && (
        <p className={"text-red-400"}>Раунд завершен</p>
      )}
    </Link>
  );
};
