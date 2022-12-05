import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MatchMediaMock from "jest-matchmedia-mock";
import UICapsule from "components/UICapsule";

// Render is used in every test because otherwise matchMedia mock is failing
let matchMedia: MatchMediaMock;

const fixtures = {
  content: "Content",
};

describe("Utilities/UICapsule", () => {
  beforeAll(() => {
    matchMedia = new MatchMediaMock();
  });

  afterEach(() => {
    matchMedia.clear();
  });

  it("renders children", () => {
    render(<UICapsule theme="uicapsule">{fixtures.content}</UICapsule>);

    expect(screen.getByText(fixtures.content)).toBeInTheDocument();
  });

  it("applies RTL to html", () => {
    render(<UICapsule theme="uicapsule" defaultRTL />);

    expect(document.body).toHaveAttribute("dir", "rtl");
  });

  it("applies light theme", () => {
    render(<UICapsule theme="uicapsule" />);

    const theme = document.body.getAttribute("data-rs-theme");
    expect(theme).toEqual("uicapsule-light");
  });

  it("applies dark theme", () => {
    render(<UICapsule theme="uicapsule" defaultColorMode="dark" />);

    const theme = document.body.getAttribute("data-rs-theme");
    expect(theme).toEqual("uicapsule-dark");
  });

  it("applies keyboard mode", async () => {
    const attribute = "data-rs-keyboard";
    render(<UICapsule theme="uicapsule" />);

    expect(document.body).not.toHaveAttribute(attribute);
    await userEvent.keyboard("{Tab}");
    expect(document.body).toHaveAttribute(attribute);
    await userEvent.click(document.body);
    expect(document.body).not.toHaveAttribute(attribute);
  });
});
