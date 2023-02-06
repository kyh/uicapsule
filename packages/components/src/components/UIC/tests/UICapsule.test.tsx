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

    expect(document.body).toHaveAttribute("dir", "rtl");
  });

  it("applies light theme", () => {
    render(<UIC theme="uicapsule" />);

    const theme = document.body.getAttribute("data-uic-theme");
    expect(theme).toEqual("uicapsule-light");
  });

  it("applies dark theme", () => {
    render(<UIC theme="uicapsule" defaultColorMode="dark" />);

    const theme = document.body.getAttribute("data-uic-theme");
    expect(theme).toEqual("uicapsule-dark");
  });

  it("applies keyboard mode", async () => {
    const attribute = "data-rs-keyboard";
    render(<UIC theme="uicapsule" />);

    expect(document.body).not.toHaveAttribute(attribute);
    await userEvent.keyboard("{Tab}");
    expect(document.body).toHaveAttribute(attribute);
    await userEvent.click(document.body);
    expect(document.body).not.toHaveAttribute(attribute);
  });
});
