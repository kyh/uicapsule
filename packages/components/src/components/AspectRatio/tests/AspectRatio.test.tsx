import React from "react";
import { render, screen } from "@testing-library/react";
import AspectRatio from "components/AspectRatio";

const fixtures = {
	content: "Content",
	className: "test-className",
	id: "test-id",
};

describe("Utilities/AspectRatio", () => {
	test("renders children", () => {
		render(<AspectRatio>{fixtures.content}</AspectRatio>);

		const el = screen.getByText(fixtures.content);
		expect(el).toBeInTheDocument();
	});

	test("applies className and attributes", () => {
		const { container } = render(
			<AspectRatio className={fixtures.className} attributes={{ id: fixtures.id }}>
				{fixtures.content}
			</AspectRatio>
		);

		expect(container.firstChild).toHaveClass(fixtures.className);
		expect(container.firstChild).toHaveAttribute("id", fixtures.id);
	});
});
