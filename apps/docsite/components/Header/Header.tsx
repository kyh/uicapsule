import React from "react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import {
	Container,
	View,
	Icon,
	Actionable,
	Button,
	Hidden,
	ThemeProvider,
	Text,
	Link,
} from "reshaped";
import useAuth from "hooks/useAuth";
import Price from "constants/prices";
import IconReshapedColored from "icons/colored/Reshaped";
import IconReshaped from "icons/Reshaped";
import IconReshapedText from "icons/colored/ReshapedText";
import IconArrowRight from "icons/ArrowRight";
import IconClose from "icons/Close";
import * as ga from "utilities/ga";
import HeaderMenu from "./HeaderMenu";
import HeaderProfile from "./HeaderProfile";
import s from "./Header.module.css";

const useIsomorphicLayoutEffect =
	typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

const Header = () => {
	const router = useRouter();
	const { loggedIn } = useAuth();
	const [bg, setBg] = React.useState(false);
	const [showBanner, setShowBanner] = React.useState(false);
	const isFigmaPlugin = router.asPath.startsWith("/figma-plugin");
	const isMinimal =
		router.asPath.startsWith("/pricing") || router.asPath.startsWith("/welcome") || isFigmaPlugin;
	const isArticle = router.asPath.startsWith("/content");
	const hasBackground = bg || isArticle;
	const rootClassNames =
		s.root +
		(isFigmaPlugin ? ` ${s["root--figma-plugin"]}` : "") +
		(hasBackground ? ` ${s["root--bg"]}` : "") +
		(isMinimal ? ` ${s["root--minimal"]}` : "");

	let containerWidth = "1056px";
	if (isArticle) containerWidth = "1440px";
	if (isFigmaPlugin) containerWidth = "1000px";

	const handleBannerClose = () => {
		localStorage.setItem("disableBlackFriday2022", "1");
		setShowBanner(false);
	};

	React.useEffect(() => {
		const handleScroll = () => {
			setBg(window.pageYOffset > 20);
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	useIsomorphicLayoutEffect(() => {
		if (localStorage.getItem("disableBlackFriday2022")) return;
		setShowBanner(true);
	}, []);

	return (
		<>
			{showBanner && !isArticle && !isMinimal && (
				<ThemeProvider colorMode="inverted">
					<View backgroundColor="page" padding={4} className={s.banner}>
						<Text variant="body-medium-2">
							<View direction={{ s: "column", l: "row" }} justify="center">
								<NextLink href="/pricing" passHref>
									<Link color="inherit" variant="plain">
										Black Friday deal is here! 🎁{" "}
										<Hidden hide={{ s: false, m: true }}>
											{(className) => <br className={className} />}
										</Hidden>
										<Link color="inherit">Get Reshaped</Link> for <b>$59</b>{" "}
										<Text color="neutral-faded" as="s">
											$89
										</Text>{" "}
										for a limited time
									</Link>
								</NextLink>
							</View>
						</Text>
						<div className={s.close}>
							<Button variant="ghost" icon={IconClose} size="small" onClick={handleBannerClose} />
						</div>
					</View>
				</ThemeProvider>
			)}

			<header className={rootClassNames}>
				<Container width={containerWidth}>
					<View
						direction="row"
						align="center"
						gap={3}
						justify={isFigmaPlugin ? { s: "center", l: "start" } : undefined}
					>
						<View.Item grow={!isFigmaPlugin} className={s.logo}>
							<NextLink href="/" passHref>
								<Actionable attributes={{ "aria-label": "Reshaped" }}>
									<View
										direction="row"
										align="center"
										gap={2}
										height="36px"
										// Required for the figma plugin page
										attributes={isFigmaPlugin ? { "data-interactive": true } : undefined}
									>
										{isFigmaPlugin ? (
											<Icon svg={IconReshaped} size={8} />
										) : (
											<Icon svg={IconReshapedColored} size={6} />
										)}
										{!isMinimal && <IconReshapedText />}
									</View>
								</Actionable>
							</NextLink>
						</View.Item>

						{!isMinimal && <HeaderMenu />}

						{!isMinimal && !loggedIn && (
							<Hidden hide={{ s: true, l: false }}>
								{(className) => (
									<View.Item grow className={className}>
										<View direction="row" justify="end" gap={3}>
											<NextLink href="/login">
												<Button variant="ghost">Log in</Button>
											</NextLink>
											<NextLink href="/pricing" passHref>
												<Button
													color="primary"
													endIcon={IconArrowRight}
													onClick={() => {
														ga.trackEvent({
															category: ga.EventCategory.Pricing,
															action: "pricing_click_license_header",
														});
													}}
												>
													${Price.seat / 100} Buy now
												</Button>
											</NextLink>
										</View>
									</View.Item>
								)}
							</Hidden>
						)}

						<HeaderProfile />
					</View>
				</Container>
			</header>
		</>
	);
};

export default Header;
