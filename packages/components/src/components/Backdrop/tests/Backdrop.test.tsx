import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Backdrop from "components/Backdrop";
import UIC from "components/UIC";

const fixtures = {
  content: "Content",
  testId: "test-id",
};

describe("Utilities/Backdrop", () => {
  test("renders children", () => {
    render(
      <UIC>
        <Backdrop active>{fixtures.content}</Backdrop>
      </UIC>
    );

    const el = screen.getByText(fixtures.content);
    expect(el).toBeInTheDocument();
  });

  test("renders children as a function", () => {
    render(
      <UIC>
        <Backdrop active>
          {({ active }) => (active ? fixtures.content : "")}
        </Backdrop>
      </UIC>
    );

    const el = screen.getByText(fixtures.content);
    expect(el).toBeInTheDocument();
  });

  test("triggers onOpen and onClose", async () => {
    const handleCloseMock = jest.fn();
    const Component = () => {
      const [active, setActive] = React.useState(true);

      const handleClose = () => {
        setActive(false);
        handleCloseMock();
      };

      const handleOpen = () => {
        setActive(true);
      };

      return (
        <UIC>
          <button
            type="button"
            data-testid={fixtures.testId}
            onClick={handleOpen}
          >
            Open
          </button>
          <Backdrop active={active} onClose={handleClose}>
            {fixtures.content}
          </Backdrop>
        </UIC>
      );
    };

    render(<Component />);

    const elButton = screen.getByTestId(fixtures.testId);

    await userEvent.click(screen.getByText(fixtures.content));

    expect(handleCloseMock).toBeCalledTimes(1);
    waitFor(() => {
      expect(screen.getByText(fixtures.content)).not.toBeInTheDocument();
    });

    await userEvent.click(elButton);
    expect(screen.getByText(fixtures.content)).toBeInTheDocument();
  });
});
