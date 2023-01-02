export const debounce = (cb: (...args: any) => void, ms: number) => {
  let timerId: ReturnType<typeof setTimeout>;

  return (...args: any) => {
    clearTimeout(timerId);

    timerId = setTimeout(() => {
      cb(...args);
    }, ms);
  };
};
