import React from "react";
import { render, screen } from "@testing-library/react";
import Overlay from "components/Overlay";

const fixtures = {
	content: "Content",
	className: "test-className",
	scrimClassName: "test-scrim-className",
	id: "test-id",
};

describe("Components/Overlay", () => {
	test("renders children", () => {
		render(<Overlay>{fixtures.content}</Overlay>);

		const el = screen.getByText(fixtures.content);
		expect(el).toBeInTheDocument();
	});

	test("works with className and attributes", () => {
		const { container } = render(
			<Overlay
				className={fixtures.className}
				scrimClassName={fixtures.scrimClassName}
				attributes={{ id: fixtures.id }}
			>
				{fixtures.content}
			</Overlay>
		);

		const elRoot = container.firstChild;
		const elScrim = container.querySelector(`.${fixtures.scrimClassName}`);

		expect(elRoot).toHaveClass(fixtures.className);
		expect(elRoot).toHaveAttribute("id", fixtures.id);
		expect(elScrim).toBeInTheDocument();
	});
});
