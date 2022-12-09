import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Popover from "components/Popover";

const fixtures = {
	content: "Content",
	openText: "Open",
	className: "test-className",
	id: "test-id",
};

describe("Components/Popover", () => {
	test("doesn't render children", () => {
		render(
			<Popover>
				<Popover.Content>{fixtures.content}</Popover.Content>
			</Popover>
		);

		expect(screen.queryByText(fixtures.content)).not.toBeInTheDocument();
	});

	test("works as controlled", async () => {
		const handleOpenMock = jest.fn();
		const handleCloseMock = jest.fn();
		const Component = () => {
			const [active, setActive] = React.useState(true);

			const handleOpen = () => {
				setActive(true);
				handleOpenMock();
			};

			const handleClose = () => {
				setActive(false);
				handleCloseMock();
			};

			return (
				<Popover active={active} onOpen={handleOpen} onClose={handleClose}>
					<Popover.Trigger>
						{(attributes) => (
							<button type="button" {...attributes}>
								{fixtures.openText}
							</button>
						)}
					</Popover.Trigger>
					<Popover.Content>{fixtures.content}</Popover.Content>
				</Popover>
			);
		};

		render(<Component />);

		const elButton = screen.getByText(fixtures.openText);

		expect(elButton).toHaveAttribute("aria-controls");
		expect(handleOpenMock).not.toBeCalled();
		expect(screen.queryByText(fixtures.content)).toBeInTheDocument();

		await userEvent.keyboard("{Escape}");
		fireEvent.transitionEnd(screen.getByText(fixtures.content));

		expect(handleCloseMock).toBeCalledTimes(1);
		await waitFor(() => {
			expect(screen.queryByText(fixtures.content)).not.toBeInTheDocument();
		});

		await userEvent.click(elButton);
		expect(handleOpenMock).toBeCalledTimes(1);
		expect(screen.getByText(fixtures.content)).toBeInTheDocument();
	});

	test("works as uncontrolled", async () => {
		const handleOpen = jest.fn();
		const handleClose = jest.fn();

		render(
			<Popover defaultActive onOpen={handleOpen} onClose={handleClose}>
				<Popover.Trigger>
					{(attributes) => (
						<button type="button" {...attributes}>
							{fixtures.openText}
						</button>
					)}
				</Popover.Trigger>
				<Popover.Content>{fixtures.content}</Popover.Content>
			</Popover>
		);

		const elButton = screen.getByText(fixtures.openText);

		expect(elButton).toHaveAttribute("aria-controls");
		expect(handleOpen).not.toBeCalled();
		expect(screen.queryByText(fixtures.content)).toBeInTheDocument();

		await userEvent.keyboard("{Escape}");
		await fireEvent.transitionEnd(screen.getByText(fixtures.content));

		await waitFor(() => {
			expect(screen.queryByText(fixtures.content)).not.toBeInTheDocument();
			expect(handleClose).toBeCalledTimes(1);
		});

		await userEvent.click(elButton);
		expect(handleOpen).toBeCalledTimes(1);
		expect(screen.getByText(fixtures.content)).toBeInTheDocument();
	});

	test("works with hover trigger type", async () => {
		const handleOpen = jest.fn();
		const handleClose = jest.fn();

		render(
			<Popover defaultActive triggerType="hover" onOpen={handleOpen} onClose={handleClose}>
				<Popover.Trigger>
					{(attributes) => (
						<button type="button" {...attributes}>
							{fixtures.openText}
						</button>
					)}
				</Popover.Trigger>
				<Popover.Content>{fixtures.content}</Popover.Content>
			</Popover>
		);

		const elButton = screen.getByText(fixtures.openText);

		expect(elButton).not.toHaveAttribute("aria-controls");
		expect(handleOpen).not.toBeCalled();

		await waitFor(() => {
			expect(screen.queryByText(fixtures.content)).toBeInTheDocument();
		});

		await userEvent.unhover(elButton);

		await waitFor(() => {
			expect(handleClose).toBeCalledTimes(1);
		});

		fireEvent.transitionEnd(screen.getByText(fixtures.content));
		expect(screen.queryByText(fixtures.content)).not.toBeInTheDocument();

		await userEvent.hover(elButton);

		await waitFor(() => {
			expect(handleOpen).toBeCalledTimes(1);
			expect(screen.getByText(fixtures.content)).toBeInTheDocument();
		});
	});
});
