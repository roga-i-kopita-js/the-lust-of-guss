import { type FC, useEffect } from "react";
import { Button } from "react-aria-components";
import { useForm } from "react-hook-form";

export type CreateRoundProps = {
  onCreate: (data: { name: string }) => void;
  error?: string;
};

export const CreateRound: FC<CreateRoundProps> = ({ onCreate, error }) => {
  const { handleSubmit, setError } = useForm<{ name: string }>();

  useEffect(() => {
    if (error) {
      setError("name", {
        message: error,
      });
    }
  }, [error]);

  return (
    <form
      className={"flex justify-between items-center"}
      onSubmit={handleSubmit(
        () => onCreate({ name: "round" }),
        (e) => console.warn(e),
      )}
    >
      <Button
        type={"submit"}
        className="border-1 p-2 cursor-pointer hover:bg-sky-600 hover:border-sky-600"
      >
        Создать раунд
      </Button>
    </form>
  );
};
