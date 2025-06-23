import { type FC } from "react";
import type { RoundListResponse } from "../../core/types";
import { Round } from "./Round";

export type RoundsProps = {
  data: RoundListResponse;
};

export const Rounds: FC<RoundsProps> = (props) => {
  return (
    <nav className={"flex flex-col gap-8"}>
      {props.data.items.map((round) => (
        <Round key={round.id} round={round} />
      ))}
    </nav>
  );
};
