import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import useRTLGlobal from "components/Reshaped/hooks/useRTLGlobal";

const Test = () => {
	const [rtl, setRTL] = useRTLGlobal();

	return (
		<button type="button" onClick={() => setRTL(!rtl)}>
			{rtl ? "RTL" : "LTR"}
		</button>
	);
};

describe("Utilities/Reshaped/useRTLGlobal", () => {
	it("toggles dir", async () => {
		render(<Test />);

		const button = screen.getByRole("button");
		await userEvent.click(button);
		expect(document.body).toHaveAttribute("dir", "rtl");
		await userEvent.click(button);
		expect(document.body).toHaveAttribute("dir", "ltr");
	});

	it("updates state on attribute manual change", async () => {
		render(<Test />);

		document.body.setAttribute("dir", "rtl");
		await waitFor(() => {
			expect(screen.queryByText("RTL")).toBeInTheDocument();
		});
	});
});
