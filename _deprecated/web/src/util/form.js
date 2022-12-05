import { useForm as useReactHookForm } from "react-hook-form";

export const useForm = () => {
  const { register, ...rest } = useReactHookForm();

  return {
    register: (...args) => {
      const { ref, ...restRegister } = register(...args);
      return { inputRef: ref, ...restRegister };
    },
    ...rest,
  };
};
