import { cacheLife } from "next/cache";

import { publicCaller } from "@/trpc/server";

// Content ships with the deployment and only changes on redeploy. `use cache`
// keys include the build ID, so "max" can never serve a previous deploy's
// content — it just avoids re-reading the content tree on every request.

export const getFeedList = async () => {
  "use cache";
  cacheLife("max");
  return publicCaller.content.feedList();
};

export const getContentList = async (filterTags: string[]) => {
  "use cache";
  cacheLife("max");
  return publicCaller.content.list({ filterTags });
};
