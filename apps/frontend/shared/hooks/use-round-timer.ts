import { useEffect, useState } from "react";

const format = (date: string): number =>
  Math.max(0, Math.floor((new Date(date).getTime() - Date.now()) / 1000));

export const useRoundTimer = (date: string): number => {
  const [secondsUntilStart, setSecondsUntilStart] = useState(format(date));

  useEffect(() => {
    setSecondsUntilStart(format(date));
  }, [date]);

  useEffect(() => {
    let interval: number;
    if (secondsUntilStart > 0) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      interval = setInterval(() => {
        setSecondsUntilStart((prev) => {
          const result = prev - 1;
          if (result <= 0) {
            clearInterval(interval);
          }
          return result;
        });
      }, 1000);
    }

    return () => {
      clearInterval(interval);
    };
  }, [secondsUntilStart]);

  return secondsUntilStart;
};
