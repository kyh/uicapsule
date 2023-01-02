export const getHeadingId = (text: string) => {
  return text.toLowerCase().replace(/ /g, "-");
};
