import React from "react";
import { debounce } from "utilities/helpers";
import { trapFocus } from "utilities/a11y";
import * as keys from "constants/keys";
import * as timeouts from "constants/timeouts";
import useIsDismissible from "hooks/useIsDismissible";
import useElementId from "hooks/useElementId";
import useIsomorphicLayoutEffect from "hooks/useIsomorphicLayoutEffect";
import useFlyout from "hooks/useFlyout";
import useKeyboardCallback from "hooks/useKeyboardCallback";
import useOnClickOutside from "hooks/useOnClickOutside";
import useRTL from "hooks/useRTL";
import { checkTransitions } from "utilities/animation";
import { Provider } from "./Flyout.context";
import type * as T from "./Flyout.types";

const FlyoutRoot = (props: T.ControlledProps & T.DefaultProps, ref: T.Ref) => {
	const {
		triggerType = "click",
		onOpen,
		onClose,
		children,
		forcePosition,
		trapFocusMode,
		width,
		contentClassName,
		contentAttributes,
		position: passedPosition,
		active: passedActive,
		id: passedId,
	} = props;
	const [isRTL] = useRTL();
	const triggerElRef = React.useRef<HTMLButtonElement | null>(null);
	const flyoutElRef = React.useRef<HTMLDivElement | null>(null);
	const id = useElementId(passedId);
	const timerRef = React.useRef<ReturnType<typeof setTimeout>>();
	const releaseFocusRef = React.useRef<ReturnType<typeof trapFocus> | null>(null);
	const lockedRef = React.useRef(false);
	const shouldReturnFocusRef = React.useRef(true);
	const flyout = useFlyout(triggerElRef, flyoutElRef, {
		width,
		position: passedPosition,
		defaultActive: passedActive,
		forcePosition,
	});
	const { status, updatePosition, render, hide, remove } = flyout;
	// Don't create dismissible queue for hover flyout because they close all together on mouseout
	const isDismissible = useIsDismissible(
		triggerType !== "hover" && status !== "idle",
		flyoutElRef,
		triggerElRef
	);

	const clearTimer = React.useCallback(() => {
		if (timerRef.current) clearTimeout(timerRef.current);
	}, [timerRef]);

	/**
	 * Component open/close handlers
	 * Called from the internal actions
	 */
	const handleOpen = React.useCallback(() => {
		if (lockedRef.current) return;
		if (status === "idle") onOpen?.();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [status]);

	const handleClose = React.useCallback(() => {
		const canClose = triggerType !== "click" || isDismissible();

		if (!canClose) return;
		if (status !== "idle") onClose?.();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [status, isDismissible, triggerType]);

	/**
	 * Trigger event handlers
	 */
	const handleBlur = React.useCallback(
		(e: React.FocusEvent) => {
			// Empty flyouts don't move the focus so they have to be closed on blur
			const focusedContent = flyoutElRef.current?.contains(e.relatedTarget as Node);
			if (triggerType === "click" && focusedContent) return;
			handleClose();
		},
		[handleClose, triggerType]
	);

	const handleFocus = React.useCallback(() => {
		if (triggerType !== "hover") return;
		handleOpen();
	}, [handleOpen, triggerType]);

	const handleMouseEnter = React.useCallback(() => {
		if (triggerType !== "hover") return;

		clearTimer();
		timerRef.current = setTimeout(handleOpen, timeouts.mouseEnter);
	}, [clearTimer, timerRef, handleOpen, triggerType]);

	const handleMouseLeave = React.useCallback(() => {
		if (triggerType !== "hover") return;

		clearTimer();
		timerRef.current = setTimeout(handleClose, timeouts.mouseLeave);
	}, [clearTimer, timerRef, handleClose, triggerType]);

	const handleTriggerClick = React.useCallback(() => {
		if (status !== "idle") {
			handleClose();
			return;
		}

		handleOpen();
	}, [status, handleOpen, handleClose]);

	/**
	 * Control the display based on the props
	 */
	useIsomorphicLayoutEffect(() => {
		if (passedActive) {
			render();
			return;
		}

		if (checkTransitions()) {
			hide();
		} else {
			remove();
		}
	}, [passedActive, render, hide]);

	const handleTransitionEnd = React.useCallback(() => {
		if (status === "hidden") remove();
	}, [remove, status]);

	/**
	 * Handle focus trap
	 *
	 * We release focus on visible change to not wait till animation ends
	 * so if we click outside the flyout, it won't focus the trigger
	 * after the animation and open it again
	 *
	 * Trap focus on visible to avoid scroll jumping, position is defined only when flyout is visible
	 */
	useIsomorphicLayoutEffect(() => {
		if (status !== "visible" || !flyoutElRef.current) return;

		releaseFocusRef.current = trapFocus(flyoutElRef.current!, {
			mode: trapFocusMode,
			// TODO: Turn includeTrigger on for input text and textarea
			includeTrigger: triggerType === "hover",
			onNavigateOutside: () => {
				releaseFocusRef.current = null;
				handleClose();
			},
		});
	}, [status, triggerType, handleClose, trapFocusMode]);

	React.useEffect(() => {
		if (status !== "hidden") return;

		if (releaseFocusRef.current) {
			/* Locking the popover to not open it again on trigger focus */
			if (triggerType === "hover") {
				lockedRef.current = true;
				setTimeout(() => {
					lockedRef.current = false;
				}, 100);
			}
			releaseFocusRef.current({
				withoutFocusReturn: !shouldReturnFocusRef.current,
			});
			releaseFocusRef.current = null;
			shouldReturnFocusRef.current = true;
		}
	}, [status, triggerType]);

	/**
	 * Release focus trapping on unmount
	 */
	React.useEffect(() => {
		return () => {
			if (releaseFocusRef.current) releaseFocusRef.current();
			releaseFocusRef.current = null;
		};
	}, []);

	/**
	 * Update position on resize or RTL
	 */
	React.useEffect(() => {
		const update = debounce(updatePosition, 10);

		window.addEventListener("resize", update);
		return () => window.removeEventListener("resize", update);
	}, [updatePosition]);

	React.useEffect(() => {
		updatePosition();
	}, [isRTL, updatePosition]);

	/**
	 * Imperative methods for controlling Flyout
	 */
	React.useImperativeHandle(
		ref,
		() => ({
			open: handleOpen,
			close: handleClose,
		}),
		[handleOpen, handleClose]
	);

	useKeyboardCallback(
		keys.ESC,
		() => {
			handleClose();
		},
		[handleClose]
	);

	useOnClickOutside([flyoutElRef, triggerElRef], () => {
		// Clicking outside changes focused element so we don't need to set it back ourselves
		shouldReturnFocusRef.current = false;
		handleClose();
	});

	return (
		<Provider
			value={{
				id,
				flyout,
				triggerElRef,
				flyoutElRef,
				handleClose,
				handleFocus,
				handleBlur,
				handleMouseEnter,
				handleMouseLeave,
				handleTransitionEnd,
				handleClick: handleTriggerClick,
				triggerType,
				trapFocusMode,
				contentClassName,
				contentAttributes,
			}}
		>
			{children}
		</Provider>
	);
};

export default React.forwardRef(FlyoutRoot);
