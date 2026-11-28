import { installCodeTooling } from "eve/extensions/code/sandbox";
import { defineSandbox } from "eve/sandbox";
import { VercelSandbox } from "eve/sandbox/vercel";
import { z } from "zod";

const TOOLING = [
  "sudo apt-get update -q",
  "sudo apt-get install -y -q ffmpeg jq python3",
  "sudo npm install -g n",
  "sudo n 24",
  "sudo npm install -g pnpm@12.23.0 agent-browser@0.43.0 vercel@65.15.0",
  "agent-browser install --with-deps",
  "node --version | grep -q '^v24\\.'",
  "ffmpeg -version",
  "jq --version",
  "python3 --version",
  "agent-browser --version",
].join(" && ");

const sandboxEnvSchema = z.object({
  BLOB_READ_WRITE_TOKEN: z.string().default(""),
  NEXT_PUBLIC_ASSETS_URL: z.string().default(""),
});

export const environment = VercelSandbox.environment({
  prepare: async (sandbox) => {
    const result = await sandbox.run({ command: TOOLING });

    if (result.exitCode !== 0) {
      throw new Error(`request builder tooling failed: ${result.stderr}`);
    }

    await installCodeTooling(sandbox);
  },
});

export default defineSandbox(async () => {
  const env = sandboxEnvSchema.parse(process.env);

  return await environment.open({
    env: {
      BLOB_READ_WRITE_TOKEN: env.BLOB_READ_WRITE_TOKEN,
      EVE_BASE_URL: "http://127.0.0.1:9",
      NEXT_PUBLIC_ASSETS_URL: env.NEXT_PUBLIC_ASSETS_URL,
      TURBO_TELEMETRY_DISABLED: "1",
    },
    resources: { vcpus: 8 },
  });
});
