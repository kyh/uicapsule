import { UGC_MAX_FILE_BYTES, UGC_SHARED_MODULES } from "@repo/contract/ugc/ugc-schema";

import { siteConfig } from "../site-config";

const megabytes = (bytes: number) => `${bytes / 1024 / 1024}MB`;

/** What the publishing MCP server tells a client it is for, and the order its tools run in. */
export const publishInstructions = [
  `This server publishes React components to the signed-in user's ${siteConfig.name} account, where each one gets a sandboxed live preview at /u/<username>/<slug>. The user's code never enters ${siteConfig.name}'s repository; you build it here and upload the build.`,
  "Publishing is four steps. start_publish reserves a build and returns its assetBase and the bundling rules. Bundle the component by those rules into one directory. get_upload_urls returns one signed URL and a curl command per file; run every command from that directory. publish_component then points the slug at the build, and the preview is live at once.",
  "A build never changes once uploaded: to change a component, start a new publish. list_my_components shows what is already published.",
].join(" ");

/** The bundle contract a published build must follow, with an esbuild command that meets it. */
export const bundleRules = (assetBase: string) => ({
  command: [
    "npx esbuild@0.28 <entry>.tsx --bundle --format=esm --jsx=automatic --minify",
    "--outfile=dist/index.js",
    ...UGC_SHARED_MODULES.filter((name) => !name.includes("/")).map((name) => `--external:${name}`),
    `--define:process.env.NODE_ENV='"production"'`,
    `--public-path=${assetBase}`,
    "--loader:.png=file --loader:.svg=file --loader:.woff2=file",
    "&& touch dist/index.css",
  ].join(" "),
  rules: [
    "dist/index.js is an ES module whose default export is the React component to preview. The frame renders it with no props, centred in an empty page, so give it its own demo content.",
    `Leave exactly these imports external; the frame supplies one shared copy of each, React 19: ${UGC_SHARED_MODULES.join(", ")}. Bundle every other dependency in.`,
    "Build for production with the automatic JSX runtime. The frame has no Node globals, so define process.env.NODE_ENV.",
    "dist/index.css holds every style the component needs (compile Tailwind into it if you use it). It may be empty, but it must exist. The frame already loads Tailwind's preflight and the site's theme tokens, and toggles a light or dark class on <html>.",
    `Any other file (code-split chunks, images, fonts) may sit beside them in up to four folders. The bundle must load them by absolute URL under assetBase, so set the bundler's public path to ${assetBase}.`,
    `Each file is at most ${megabytes(UGC_MAX_FILE_BYTES)}. Scripts run only from the frame's own host and the build's storage host, with no cookies or storage, so the component cannot fetch code from anywhere else.`,
  ],
});

/** The shell command that uploads one build file to its signed URL. */
export const uploadCommand = ({
  contentType,
  path,
  url,
}: {
  contentType: string;
  path: string;
  url: string;
}) => `curl -fsS -X PUT -H 'content-type: ${contentType}' --data-binary @'${path}' '${url}'`;
