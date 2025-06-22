import type { FC } from "react";
import type { RoundListResponse } from "../../core/types";
import { Link } from "react-router";

export type RoundsProps = {
  data: RoundListResponse;
};

export const Rounds: FC<RoundsProps> = (props) => {
  return (
    <nav className={"p-5"}>
      {props.data.items.map((round) => (
        <Link
          key={round.id}
          to={`/games/${round.id}`}
          className={"p-2 underline hover:no-underline"}
        >
          <span>{round.name}</span>
        </Link>
      ))}
    </nav>
  );
};
