import fs from "fs";
import path from "path";
import { GetStaticPathsResult } from "next";
import { useRouter } from "next/router";
import NextLink from "next/link";
import { serialize } from "next-mdx-remote/serialize";
import matter from "gray-matter";
import {
  Actionable,
  Badge,
  Text,
  View,
  Link,
  Button,
  Tabs,
  TabsProps,
} from "@uicapsule/components";
import Meta from "components/Meta";
import Article from "components/Article";
import DocsLayout from "components/DocsLayout";
import type { AnchorMenuProps } from "components/AnchorMenu";
import { PropertiesProvider } from "components/Properties";
import IconBell from "icons/Bell";
import { menuData } from "constants/menu";
import { getHeadingId } from "utilities/md";
import IconDocumentation from "icons/Documentation";
import IconInfo from "icons/Info";
import IconIconography from "icons/Iconography";
import IconStorybook from "icons/colored/Storybook";
import { useRef } from "react";

const getAnchorMenu = (source: string) => {
  const result: AnchorMenuProps["items"] = [];
  // Get each line individually, and filter out anything that
  // isn't a heading.
  const headingLines = source.split("\n").filter((line: string) => {
    return line.match(/^###*\s/);
  });

  // Transform the string '## Some text' into an object
  // with the shape '{ text: 'Some text', level: 2 }'
  headingLines.forEach((raw: string) => {
    const text = raw.replace(/^###*\s/, "");
    // I only care about h2 and h3.
    // If I wanted more levels, I'd need to count the
    // number of #s.
    const level = raw.slice(0, 3) === "###" ? 3 : 2;

    result.push({ text, url: `#${getHeadingId(text)}`, level });
  });

  return result;
};

const PostMeta = (props: any) => {
  const { data } = props;
  const {
    componentImport,
    typeImport,
    storybookUrl,
    relatedComponents,
    title,
  } = data;

  if (!componentImport && !typeImport && !storybookUrl && !relatedComponents)
    return null;

  return (
    <View
      backgroundColor="base"
      borderColor="neutral-faded"
      borderRadius="medium"
      padding={4}
      gap={3}
      overflow="hidden"
    >
      <View
        direction={{ s: "column", m: "row" }}
        gap={{ s: 1, m: 3 }}
        align={{ s: "start", m: "center" }}
      >
        <View width="140px">
          <Text variant="caption-1" color="neutral-faded">
            Import
          </Text>
        </View>
        <View.Item grow>
          <Text
            color="primary"
            attributes={{
              style: {
                whiteSpace: "nowrap",
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace",
              },
            }}
          >
            {componentImport}
            <br />
            {typeImport}
          </Text>
        </View.Item>
      </View>
      {!!relatedComponents?.length && (
        <View
          direction={{ s: "column", m: "row" }}
          gap={{ s: 1, m: 3 }}
          align={{ s: "start", m: "center" }}
        >
          <View width="140px">
            <Text variant="caption-1" color="neutral-faded">
              Related components
            </Text>
          </View>
          <View.Item grow>
            <View direction="row" gap={2} align="center">
              {relatedComponents.map((item: any) => (
                <NextLink
                  href={item.url}
                  passHref
                  legacyBehavior
                  key={item.url}
                >
                  <Actionable borderRadius="inherit">
                    <Badge>{item.name}</Badge>
                  </Actionable>
                </NextLink>
              ))}
            </View>
          </View.Item>
        </View>
      )}
      {storybookUrl && (
        <View
          direction={{ s: "column", m: "row" }}
          gap={{ s: 1, m: 3 }}
          align={{ s: "start", m: "center" }}
        >
          <View width="140px">
            <Text variant="caption-1" color="neutral-faded">
              Storybook
            </Text>
          </View>
          <View.Item grow>
            <Button
              variant="outline"
              href={storybookUrl}
              attributes={{ target: "_blank" }}
              endIcon={IconStorybook}
            >
              {title} stories
            </Button>
          </View.Item>
        </View>
      )}
    </View>
  );
};

export default function PostPage(props: any) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const { source, meta, anchorMenu, shareImage } = props;
  const { title, description, tabs, newsletter, hideOutline } = meta;
  const pageId = `/${(router.query.slug as string[]).join("/")}`;
  const { previousId, nextId } = menuData[pageId] || {};
  const previousItem = previousId && menuData[previousId];
  const nextItem = nextId && menuData[nextId];

  const currentRoute = router.asPath.split("#")[0];
  const currentRouteChunks = currentRoute.split("/");
  const isComponentRoute =
    currentRouteChunks.includes("components") ||
    currentRouteChunks.includes("utilities");
  const subRouteName = currentRouteChunks[currentRouteChunks.length - 1];
  const isComponentSubRoute =
    isComponentRoute &&
    (subRouteName === "props" || subRouteName === "examples");

  const handleTabChange: TabsProps["onChange"] = ({ value }) => {
    const normalizedCurrentRouteChunks =
      isComponentRoute && !isComponentSubRoute
        ? [...currentRouteChunks, "documentation"]
        : currentRouteChunks;
    const parentRoute = normalizedCurrentRouteChunks.slice(0, -1).join("/");
    const targetRoute =
      value === "documentation" ? parentRoute : `${parentRoute}/${value}`;

    router.push(targetRoute, targetRoute, { scroll: false });
  };

  return (
    <div ref={rootRef}>
      <DocsLayout anchorMenu={!hideOutline ? { items: anchorMenu } : undefined}>
        <PropertiesProvider properties={meta.properties}>
          <Meta title={title} description={description} image={shareImage} />
          <View gap={4} maxWidth="740px">
            {title && (
              <View gap={2}>
                <View gap={3} direction="row" align="center">
                  <View.Item grow>
                    <Text variant="display-3" as="h1">
                      {title}
                    </Text>
                  </View.Item>
                  {newsletter && (
                    <Button variant="outline" startIcon={IconBell}>
                      Get notified
                    </Button>
                  )}
                </View>
                {description && (
                  <Text variant="body-1" color="neutral-faded">
                    {description}
                  </Text>
                )}
              </View>
            )}

            <PostMeta data={meta} />

            {tabs?.length && (
              <View.Item gapBefore={6}>
                <Tabs
                  onChange={handleTabChange}
                  value={
                    isComponentRoute && !isComponentSubRoute
                      ? tabs[0].value
                      : subRouteName
                  }
                >
                  <Tabs.List>
                    {tabs.map((tab: any) => (
                      <Tabs.Item
                        key={tab.value}
                        value={tab.value}
                        icon={
                          (
                            {
                              documentation: IconDocumentation,
                              props: IconInfo,
                              examples: IconIconography,
                            } as any
                          )[tab.value]
                        }
                      >
                        {tab.label}
                      </Tabs.Item>
                    ))}
                  </Tabs.List>
                </Tabs>
              </View.Item>
            )}

            <View gap={10}>
              <Article source={source} />

              <View direction="row" gap={3}>
                {previousItem && previousItem.url && (
                  <View.Item grow>
                    <Text color="neutral-faded">Previous</Text>
                    <Text variant="featured-3">
                      <NextLink href={previousItem.url} passHref legacyBehavior>
                        <Link variant="plain">{previousItem.title}</Link>
                      </NextLink>
                    </Text>
                  </View.Item>
                )}
                {nextItem && nextItem.url && (
                  <View.Item grow>
                    <View align="end">
                      <Text color="neutral-faded" align="end">
                        Next
                      </Text>
                      <Text variant="featured-3" align="end">
                        <NextLink href={nextItem.url} passHref legacyBehavior>
                          <Link variant="plain">{nextItem.title}</Link>
                        </NextLink>
                      </Text>
                    </View>
                  </View.Item>
                )}
              </View>
            </View>
          </View>
        </PropertiesProvider>
      </DocsLayout>
    </div>
  );
}

const mdxDir = path.join(process.cwd(), "posts");
const ogDir = path.join(process.cwd(), "public/img/og");

export const getStaticProps = async ({ params }: any) => {
  const slugPath = params.slug.join("/");
  const shareImagePath = path.resolve(ogDir, `${slugPath}.png`);
  const slugContentFilePath = path.join(mdxDir, `${slugPath}.mdx`);
  const docsContentFilePath = path.join(mdxDir, slugPath, "index.mdx");
  const contentFilePath = fs.existsSync(slugContentFilePath)
    ? slugContentFilePath
    : docsContentFilePath;
  const contentFileSource = fs.readFileSync(contentFilePath, "utf-8");
  const contentFileParentPath = contentFilePath
    .split("/")
    .slice(0, -1)
    .join("/");
  const relativePath = path.relative(mdxDir, contentFileParentPath);
  let meta;
  try {
    meta = await import(`../../posts/${relativePath}/meta`);
  } catch (e) {}

  let tabs = [];

  const hasExamples = fs.existsSync(
    path.join(contentFileParentPath, "examples.mdx")
  );
  const hasProps = fs.existsSync(path.join(contentFileParentPath, "props.mdx"));

  if (hasExamples || hasProps) {
    tabs.push({ label: "Documentation", value: "documentation" });
    if (hasProps) tabs.push({ label: "Properties", value: "props" });
    if (hasExamples) tabs.push({ label: "Examples", value: "examples" });
  }

  const { content, data: frontMatter } = matter(contentFileSource);
  const mdxSource = await serialize(content, {
    scope: frontMatter,
    mdxOptions: {
      development: false,
    },
  });

  return {
    props: {
      anchorMenu: getAnchorMenu(contentFileSource),
      source: mdxSource,
      meta: {
        ...frontMatter,
        ...meta?.default,
        tabs: frontMatter.tabs || tabs,
      },
      shareImage: fs.existsSync(shareImagePath)
        ? `/img/og/${slugPath}.png`
        : null,
    },
  };
};

export const getStaticPaths = async () => {
  const paths: GetStaticPathsResult["paths"] = [];

  const runDirectory = (dir: string, baseSlug = "") => {
    fs.readdirSync(dir).forEach((itemName) => {
      const dirPath = path.resolve(dir, itemName);
      const isDir = fs.lstatSync(dirPath).isDirectory();
      const nextSlug = [baseSlug, itemName].filter(Boolean).join("/");

      if (itemName.endsWith(".mdx")) {
        const targetSlug =
          itemName === "index.mdx"
            ? nextSlug.replace(/\/index\.mdx$/, "")
            : nextSlug.replace(/\.mdx?$/, "");

        paths.push({
          params: {
            slug: targetSlug.split("/"),
          },
        });
        return;
      }

      if (isDir) {
        runDirectory(dirPath, nextSlug);
      }
    });
  };

  runDirectory(mdxDir);

  return {
    paths,
    fallback: false,
  };
};
