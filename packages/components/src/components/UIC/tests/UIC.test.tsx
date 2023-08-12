import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MatchMediaMock from "jest-matchmedia-mock";
import UIC from "components/UIC";

// Render is used in every test because otherwise matchMedia mock is failing
let matchMedia: MatchMediaMock;

const fixtures = {
  content: "Content",
};

describe("Utilities/UIC", () => {
  beforeAll(() => {
    matchMedia = new MatchMediaMock();
  });

  afterEach(() => {
    matchMedia.clear();
  });

  it("renders children", () => {
    render(<UIC theme="uicapsule">{fixtures.content}</UIC>);

    expect(screen.getByText(fixtures.content)).toBeInTheDocument();
  });

  it("applies RTL to html", () => {
    render(<UIC theme="uicapsule" defaultRTL />);

    expect(document.documentElement).toHaveAttribute("dir", "rtl");
  });

  it("applies light theme", () => {
    render(<UIC theme="uicapsule" />);

    const theme = document.documentElement.getAttribute("data-uic-theme");
    const colorMode =
      document.documentElement.getAttribute("data-uic-color-mode");

    expect(theme).toEqual("uicapsule");
    expect(colorMode).toEqual("light");
  });

  it("applies dark theme", () => {
    render(<UIC theme="uicapsule" defaultColorMode="dark" />);

    const theme = document.documentElement.getAttribute("data-uic-theme");
    const colorMode =
      document.documentElement.getAttribute("data-uic-color-mode");

    expect(theme).toEqual("uicapsule");
    expect(colorMode).toEqual("dark");
  });

  it("applies keyboard mode", async () => {
    const attribute = "data-uic-keyboard";
    render(<UIC theme="uicapsule" />);

    expect(document.documentElement).not.toHaveAttribute(attribute);
    await userEvent.keyboard("{Tab}");
    expect(document.documentElement).toHaveAttribute(attribute);
    await userEvent.click(document.body);
    expect(document.documentElement).not.toHaveAttribute(attribute);
  });
});
