import type { FC } from "react";
import type { HitInfo, Round } from "../../core/types";
import { useRoundTimer } from "../../../shared/hooks/use-round-timer";
import { Button } from "react-aria-components";

export type GameProps = {
  game: Round;
  hitInfo?: HitInfo;
  touch: (game: Round) => void;
};
export const Game: FC<GameProps> = ({ game, touch, hitInfo }) => {
  const seconds = useRoundTimer(game.startedAt);

  const onTouch = (): void => {
    if (seconds <= 0) {
      touch(game);
    }
  };

  return (
    <div className={"flex flex-col items-center"}>
      <h1 className={"mb-8"}>Round id: {game.id}</h1>

      {seconds > 0 && (
        <p className={"mb-8 text-green-400"}>
          До начала осталось: {seconds} секунд
        </p>
      )}

      {hitInfo && (
        <div>
          <p>Total: {hitInfo.totalClicks}</p>
          <p>Score: {hitInfo.playerScore}</p>
          {hitInfo.winner && (
            <p className={"text-green-400"}>
              Winner: {hitInfo.winner.username}
            </p>
          )}
        </div>
      )}

      <Button
        className={"cursor-pointer max-w-[400px] p-2 bg-white hover:bg-sky-400"}
        onClick={onTouch}
      >
        <img alt={"guss pucture"} src={"/guss.png"} className={"max-w-full"} />
      </Button>
    </div>
  );
};
