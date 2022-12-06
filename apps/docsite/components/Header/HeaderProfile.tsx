import React from "react";
import { useRouter } from "next/router";
import { View, Button, Modal, Text, useToggle, Dismissible, Hidden } from "reshaped";
import DownloadButton from "components/DownloadButton";
import useAuth from "hooks/useAuth";
import IconArrowRight from "icons/ArrowRight";
import IconFigma from "icons/colored/Figma";
import IconReact from "icons/colored/React";
import IconDownload from "icons/Download";
import IconUser from "icons/User";
import IconLicenseArrow from "icons/colored/LicenseArrow";
import * as ga from "utilities/ga";
import s from "./Header.module.css";

const HeaderProfile = () => {
	const { loggedIn, signOut, user, hasSourceCodeAccess } = useAuth();
	const { active, activate, deactivate } = useToggle(false);
	const router = useRouter();
	const isWelcome = router.asPath.startsWith("/welcome");

	React.useEffect(() => {
		if (!loggedIn && active) deactivate();
	}, [loggedIn, active, deactivate]);

	if (!loggedIn || !user) return null;

	return (
		<View.Item grow={true} order={1}>
			<Hidden hide={{ s: true, l: false }}>
				<View align="end" gap={3}>
					<Button onClick={activate} startIcon={IconUser} attributes={{ "data-interactive": true }}>
						Profile
					</Button>
					{isWelcome && (
						<div className={s.arrow}>
							<IconLicenseArrow />
						</div>
					)}
				</View>
			</Hidden>

			<Hidden hide={{ s: false, l: true }}>
				<View align="end">
					<Button
						attributes={{ "aria-label": "Open profile" }}
						onClick={activate}
						startIcon={IconUser}
						variant="ghost"
					/>
				</View>
			</Hidden>

			<Modal position="end" active={active} onClose={deactivate}>
				<View gap={8} height="100%">
					<Dismissible onClose={deactivate} closeAriaLabel="Close profile">
						<Text variant="title-3" as="h2">
							{user.name}
						</Text>
						<Text variant="body-1" color="neutral-faded">
							{user.email}
						</Text>
					</Dismissible>

					<View gap={4}>
						<View gap={0}>
							<Text variant="body-medium-1">Library</Text>
							{user.seats && !user.sourceCode && (
								<Text color="neutral-faded">
									{user.seats} seat{user.seats > 1 ? "s" : ""}
								</Text>
							)}
							{user.sourceCode && <Text color="neutral-faded">Unlimited seats</Text>}
						</View>

						<View gap={2}>
							<DownloadButton
								size="large"
								variant="outline"
								fullWidth
								icon={IconReact}
								type="react"
							/>
							<DownloadButton
								size="large"
								variant="outline"
								fullWidth
								icon={IconFigma}
								type="figma"
							/>
						</View>
					</View>

					{hasSourceCodeAccess && (
						<View gap={3} align="start">
							<Text variant="body-medium-1">Source code</Text>

							<DownloadButton
								size="large"
								variant="outline"
								fullWidth
								icon={IconDownload}
								type="source"
							/>
						</View>
					)}

					<View gap={2}>
						<View gap={0}>
							<Text variant="body-medium-1">Support</Text>
							<Text>Got a question about Reshaped?</Text>
						</View>

						<View direction="row" gap={2}>
							<View.Item columns={6}>
								<Button
									fullWidth
									href="https://github.com/reshaped/community/issues"
									attributes={{ target: "_blank" }}
									onClick={() => {
										ga.trackEvent({
											category: ga.EventCategory.External,
											action: "external_submit_request",
										});
									}}
								>
									Submit a request
								</Button>
							</View.Item>
							<View.Item columns={6}>
								<Button fullWidth href="mailto:hello@reshaped.so" attributes={{ target: "_blank" }}>
									Send an email
								</Button>
							</View.Item>
						</View>
					</View>
					<View.Item gapBefore="auto">
						<View direction="row" gap={4}>
							<View.Item grow>
								<Button.Aligner position={["start", "bottom"]}>
									<Button
										variant="ghost"
										href="https://blvworkspace.notion.site/64cf1f5713344a7383330e0402f43949?v=b88a6dbbcb9a4faeb867d40d09ec0b12"
										attributes={{ target: "_blank" }}
									>
										Roadmap
									</Button>
								</Button.Aligner>
							</View.Item>
							<Button.Aligner position={["end", "bottom"]}>
								<Button variant="ghost" endIcon={IconArrowRight} onClick={signOut}>
									Sign out
								</Button>
							</Button.Aligner>
						</View>
					</View.Item>
				</View>
			</Modal>
		</View.Item>
	);
};

export default HeaderProfile;
