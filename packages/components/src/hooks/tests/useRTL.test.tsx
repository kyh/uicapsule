import React from "react";
import { act } from "react-dom/test-utils";
import { render } from "@testing-library/react";
import UIC from "components/UIC";
import useRTL from "hooks/useRTL";

const Component = () => {
  const [rtl, setRTL] = useRTL();

  React.useEffect(() => {
    act(() => setRTL(true));
  }, [setRTL]);

  return <div>{rtl}</div>;
};

describe("useRTL", () => {
  test("switches to RTL", () => {
    render(
      <UIC theme="uicapsule">
        <Component />
      </UIC>
    );

    expect(document.documentElement).toHaveAttribute("dir", "rtl");
  });

  test("defaults to RTL", () => {
    render(<UIC theme="uicapsule" defaultRTL />);

    expect(document.documentElement).toHaveAttribute("dir", "rtl");
  });
});
