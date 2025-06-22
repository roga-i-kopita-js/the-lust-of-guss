import { type FC, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Button,
  Form,
  Input,
  Label,
  TextField,
  Text,
} from "react-aria-components";

export type LoginData = {
  username: string;
  password: string;
};

export type LoginProps = {
  onSubmit: (data: LoginData) => void;
  serverErrors?: LoginData;
};

export const Login: FC<LoginProps> = ({ onSubmit, serverErrors }) => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginData>();

  useEffect(() => {
    if (serverErrors?.username) {
      setError("username", {
        message: serverErrors.username,
      });
    }

    if (serverErrors?.password) {
      setError("password", {
        message: serverErrors.password,
      });
    }
  }, [serverErrors]);

  return (
    <Form
      className={"p-5 border-2 flex flex-col justify-center items-center"}
      onSubmit={handleSubmit(onSubmit, (e) => console.warn(e))}
    >
      <Text className={"mb-5"}>Авторизация </Text>

      <TextField className={"mb-3 flex flex-col"}>
        <Label className={"mb-2"}>Username *</Label>
        <Input {...register("username")} className={"border-1 p-1 rounded-2"} />
        {errors.username?.message && (
          <p className={"text-red-500"}>{errors.username.message}</p>
        )}
      </TextField>

      <TextField className={"flex flex-col mb-5"}>
        <Label className={"mb-2"}>Password *</Label>
        <Input
          {...register("password")}
          type={"password"}
          className={"border-1 p-1 rounded-2"}
        />
        {errors.password?.message && (
          <p className={"text-red-500"}>{errors?.password.message}</p>
        )}
      </TextField>

      <Button
        type={"submit"}
        className={
          "border-1 p-2 w-full cursor-pointer hover:bg-sky-600 hover:border-sky-600"
        }
      >
        Войти
      </Button>
    </Form>
  );
};
