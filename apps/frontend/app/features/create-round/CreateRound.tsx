import { type FC, useEffect } from "react";
import { Button, Input, Label, TextField } from "react-aria-components";
import { useForm } from "react-hook-form";

export type CreateRoundProps = {
  onCreate: (data: { name: string }) => void;
  error?: string;
};

export const CreateRound: FC<CreateRoundProps> = ({ onCreate, error }) => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<{ name: string }>();

  useEffect(() => {
    if (error) {
      setError("name", {
        message: error,
      });
    }
  }, [error]);

  return (
    <form
      className={"p-5 flex justify-between items-center"}
      onSubmit={handleSubmit(onCreate, (e) => console.warn(e))}
    >
      <TextField className={"mb-3 flex flex-col mr-10"}>
        <Label className={"mb-2"}>Название раунда *</Label>
        <Input {...register("name")} className={"border-1 p-1 rounded-2"} />
        {errors.name?.message && (
          <p className={"text-red-500"}>{errors.name.message}</p>
        )}
      </TextField>

      <Button
        type={"submit"}
        className="border-1 p-2 cursor-pointer hover:bg-sky-600 hover:border-sky-600"
      >
        Создать раунд
      </Button>
    </form>
  );
};
