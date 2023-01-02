import NextLink from "next/link";
import { Button, View, Text, Link } from "@uicapsule/components";
import IconLock from "icons/Lock";
import DownloadButton from "components/DownloadButton";
import ArticleItem from "./ArticleItem";
import ArticleHeading from "./ArticleHeading";
import s from "../Article.module.css";

type Props = {
  version: string;
  date: `${number}-${number}-${number}`;
};

const FIRST_SOURCE_CODE_VERSION = "0.17.0";
const FIRST_FIGMA_VERSION = "0.16.0";

const ArticleRelease = (props: Props) => {
  const { version, date } = props;

  const d = new Date(date);
  const hasLibraryAccess = false;
  const hasSourceCodeAccess = false;

  const downloadActions =
    !hasLibraryAccess && !hasSourceCodeAccess ? (
      <ArticleItem className={s.download}>
        <View gap={2} align="start">
          <Button startIcon={IconLock} disabled>
            Download v{version}
          </Button>
          <Text color="neutral-faded">
            Unlock the releases by{" "}
            <NextLink href="/pricing" passHref>
              <Link color="primary">purchasing a license</Link>
            </NextLink>
          </Text>
        </View>
      </ArticleItem>
    ) : (
      <ArticleItem className={s.download}>
        <View gap={3} direction="row">
          {hasLibraryAccess && (
            <DownloadButton type="react" version={version} />
          )}
          {hasLibraryAccess && version >= FIRST_FIGMA_VERSION && (
            <DownloadButton type="figma" version={version} />
          )}

          {hasSourceCodeAccess && version >= FIRST_SOURCE_CODE_VERSION && (
            <DownloadButton type="source" version={version} />
          )}
        </View>
      </ArticleItem>
    );

  return (
    <>
      <ArticleHeading level={2}>{version}</ArticleHeading>
      <ArticleHeading level={4}>
        {d.toLocaleDateString("en-GB", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </ArticleHeading>
      {downloadActions}
    </>
  );
};

export default ArticleRelease;
