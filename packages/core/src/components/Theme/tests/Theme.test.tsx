import React from "react";
import { render, screen } from "@testing-library/react";
import ThemeProvider, { useTheme } from "components/Theme";

const Component = () => {
  const { colorMode } = useTheme();

  return <div>{colorMode}</div>;
};

describe("Utilities/Theme", () => {
  test("renders light mode", () => {
    render(
      <ThemeProvider theme="uicapsule">
        <Component />
      </ThemeProvider>
    );

    expect(screen.getByText("light")).toBeInTheDocument();
  });

  test("renders dark mode", () => {
    render(
      <ThemeProvider theme="uicapsule" colorMode="dark">
        <Component />
      </ThemeProvider>
    );

    expect(screen.getByText("dark")).toBeInTheDocument();
  });

  test("renders inverted mode", () => {
    render(
      <ThemeProvider theme="uicapsule" colorMode="inverted">
        <Component />
      </ThemeProvider>
    );

    expect(screen.getByText("dark")).toBeInTheDocument();
  });
});
