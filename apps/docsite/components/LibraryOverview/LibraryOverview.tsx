import React from "react";
import NextLink from "next/link";
import { View, Actionable, Text, Avatar, useToggle } from "reshaped";
import VideoDemo from "components/VideoDemo";
import IconReact from "icons/colored/React";
import IconFigma from "icons/colored/Figma";
import IconNotion from "icons/colored/Notion";
import IconGithub from "icons/colored/Github";
import IconPlay from "icons/Play";
import IconDocumentation from "icons/Documentation";
import IconDownload from "icons/Download";
import { reactDemoSrc, figmaDemoSrc } from "constants/vimeo";
import useAuth from "hooks/useAuth";
import Section from "./components/Section";
import * as T from "./LibraryOverview.types";

const LibraryOverview = (props: T.Props) => {
	const { includeDocumentation, includeDownloads } = props;
	const { hasLibraryAccess, hasSourceCodeAccess } = useAuth();
	const reactToggle = useToggle();
	const figmaToggle = useToggle();

	return (
		<View direction="row" gap={5}>
			<View.Item columns={{ s: 12, m: 4 }}>
				<Section title="React">
					<NextLink href="/content/docs/getting-started/react" passHref>
						<Actionable>
							<View direction="row" align="center" gap={3}>
								<Avatar size={12} icon={IconReact} squared />
								<View.Item grow>
									<Text variant="body-medium-2">React setup</Text>
									<Text variant="caption-1">Getting started guide</Text>
								</View.Item>
							</View>
						</Actionable>
					</NextLink>

					<>
						<Actionable onClick={reactToggle.activate}>
							<View direction="row" align="center" gap={3}>
								<Avatar size={12} icon={IconPlay} squared />
								<View.Item grow>
									<Text variant="body-medium-2">React demo</Text>
									<Text variant="caption-1">How to build with Reshaped</Text>
								</View.Item>
							</View>
						</Actionable>

						<VideoDemo
							src={reactDemoSrc}
							active={reactToggle.active}
							onClose={reactToggle.deactivate}
						/>
					</>

					{includeDownloads && hasLibraryAccess && (
						<Actionable
							href="/api/download/latest/react"
							attributes={{
								download: true,
							}}
						>
							<View direction="row" align="center" gap={3}>
								<Avatar size={12} icon={IconDownload} squared />
								<View.Item grow>
									<Text variant="body-medium-2">Download React library</Text>
									<Text variant="caption-1">Latest React release</Text>
								</View.Item>
							</View>
						</Actionable>
					)}

					{includeDownloads && hasSourceCodeAccess && (
						<Actionable
							href="/api/download/latest/source"
							attributes={{
								download: true,
							}}
						>
							<View direction="row" align="center" gap={3}>
								<Avatar size={12} icon={IconDownload} squared />
								<View.Item grow>
									<Text variant="body-medium-2">Download source code</Text>
									<Text variant="caption-1">Latest React release</Text>
								</View.Item>
							</View>
						</Actionable>
					)}
				</Section>
			</View.Item>
			<View.Item columns={{ s: 12, m: 4 }}>
				<Section title="Figma">
					<NextLink href="/content/docs/getting-started/figma/libraries" passHref>
						<Actionable>
							<View direction="row" align="center" gap={3}>
								<Avatar size={12} icon={IconFigma} squared />
								<View.Item grow>
									<Text variant="body-medium-2">Figma setup</Text>
									<Text variant="caption-1">Getting started guide</Text>
								</View.Item>
							</View>
						</Actionable>
					</NextLink>

					<>
						<Actionable onClick={figmaToggle.activate}>
							<View direction="row" align="center" gap={3}>
								<Avatar size={12} icon={IconPlay} squared />
								<View.Item grow>
									<Text variant="body-medium-2">Figma demo</Text>
									<Text variant="caption-1">How to build with Reshaped</Text>
								</View.Item>
							</View>
						</Actionable>

						<VideoDemo
							src={figmaDemoSrc}
							active={figmaToggle.active}
							onClose={figmaToggle.deactivate}
						/>
					</>

					{includeDownloads && hasLibraryAccess && (
						<Actionable
							href="/api/download/latest/figma"
							attributes={{
								download: true,
							}}
						>
							<View direction="row" align="center" gap={3}>
								<Avatar size={12} icon={IconDownload} squared />
								<View.Item grow>
									<Text variant="body-medium-2">Download Figma library</Text>
									<Text variant="caption-1">Latest Figma release</Text>
								</View.Item>
							</View>
						</Actionable>
					)}
				</Section>
			</View.Item>

			<View.Item columns={{ s: 12, m: 4 }}>
				<Section title="Community">
					{includeDocumentation && (
						<Actionable
							href="/content/docs/getting-started/overview"
							attributes={{ target: "_blank" }}
						>
							<View direction="row" align="center" gap={3}>
								<Avatar size={12} icon={IconDocumentation} squared />
								<View.Item grow>
									<Text variant="body-medium-2" maxLines={1}>
										Documentation
									</Text>
									<Text variant="caption-1">Public guidelines</Text>
								</View.Item>
							</View>
						</Actionable>
					)}

					<Actionable
						href="https://github.com/reshaped/community"
						attributes={{ target: "_blank" }}
					>
						<View direction="row" align="center" gap={3}>
							<Avatar size={12} icon={IconGithub} squared />
							<View.Item grow>
								<Text variant="body-medium-2" maxLines={1}>
									Community repository
								</Text>
								<Text variant="caption-1">Bug reports and requests</Text>
							</View.Item>
						</View>
					</Actionable>

					<Actionable
						href="https://blvworkspace.notion.site/64cf1f5713344a7383330e0402f43949?v=b88a6dbbcb9a4faeb867d40d09ec0b12"
						attributes={{ target: "_blank" }}
					>
						<View direction="row" align="center" gap={3}>
							<Avatar size={12} icon={IconNotion} squared />
							<View.Item grow>
								<Text variant="body-medium-2">Public roadmap</Text>
								<Text variant="caption-1">What&apos;s coming next</Text>
							</View.Item>
						</View>
					</Actionable>
				</Section>
			</View.Item>
		</View>
	);
};

export default LibraryOverview;
