import React from "react";
import { render, fireEvent } from "@testing-library/react";
import * as keys from "constants/keys";
import useKeyboardCallback from "hooks/useKeyboardCallback";

const Component = (props: { handler: () => void }) => {
	useKeyboardCallback(keys.ESC, props.handler);
	return <div />;
};

describe("useKeyboardCallback", () => {
	test("gets triggered on key press", () => {
		const noop = jest.fn();
		render(<Component handler={noop} />);

		fireEvent.keyDown(document.body, {
			key: "Escape",
			keyCode: 27,
			which: 27,
		});

		expect(noop).toBeCalledTimes(1);
	});
});
