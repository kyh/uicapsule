import React from "react";
import { render, screen } from "@testing-library/react";
import UIC from "components/UIC";
import useResponsiveClientValue from "hooks/useResponsiveClientValue";

const Component = (
  props: Parameters<typeof useResponsiveClientValue<string>>[0]
) => {
  const value = useResponsiveClientValue(props);

  return <div>{value}</div>;
};

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe("useResponsiveClientValue", () => {
  test("returns s value", () => {
    render(
      <UIC>
        <Component s="foo" m="bar" />
      </UIC>
    );

    expect(screen.queryByText("foo")).toBeInTheDocument();
  });

  test("returns m value when UIC has m as defaultViewport", () => {
    render(
      <UIC defaultViewport="m">
        <Component s="foo" m="bar" />
      </UIC>
    );

    expect(screen.queryByText("bar")).toBeInTheDocument();
  });

  test("works with fallback", () => {
    render(
      <UIC defaultViewport="l">
        <Component s="foo" m="bar" />
      </UIC>
    );

    expect(screen.queryByText("bar")).toBeInTheDocument();
  });
});
