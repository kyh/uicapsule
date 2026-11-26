import { lstat, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { Visitor, parseSync } from "oxc-parser";
import type { Argument } from "oxc-parser";
import { z } from "zod";

import {
  contentMetaSchema,
  contentPackageSchema,
} from "../apps/web/src/lib/content/content-schema";

export const ignoredDirectories = new Set(["node_modules", "dist", ".cache", ".turbo"]);
const codeExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mts", ".cts", ".mjs", ".cjs"]);

const staticSpecifier = (node: Argument | null | undefined) => {
  if (node?.type === "Literal") {
    return z.string().safeParse(node.value).data;
  }

  return node?.type === "TemplateLiteral" && node.expressions.length === 0
    ? node.quasis[0]?.value.raw
    : undefined;
};

export const validateContentDirectory = async (directory: string) => {
  const issues: string[] = [];

  const meta = await readFile(path.join(directory, "meta.json"), "utf-8")
    .then((source) => contentMetaSchema.safeParse(JSON.parse(source)))
    .catch(() => null);

  if (!meta) {
    return ["missing or unparseable meta.json"];
  }

  if (!meta.success) {
    return meta.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
  }

  if (meta.data.type === "remote") {
    return issues;
  }

  const preview = await lstat(path.join(directory, "preview.tsx")).catch(() => null);

  if (preview?.isFile() !== true) {
    issues.push("missing preview.tsx");
  }

  const pkg = await readFile(path.join(directory, "package.json"), "utf-8")
    .then((source) => contentPackageSchema.safeParse(JSON.parse(source)))
    .catch(() => null);

  if (pkg?.success === true) {
    for (const group of [
      pkg.data.dependencies,
      pkg.data.devDependencies,
      pkg.data.peerDependencies,
    ]) {
      for (const [name, version] of Object.entries(group ?? {})) {
        if (name.startsWith("@repo/") || /^(?:workspace|file|link):/u.test(version)) {
          issues.push(`package.json: ${name} must be installable outside this workspace`);
        }
      }
    }
  } else {
    issues.push("missing or invalid package.json");
  }

  const checkImport = (file: string, specifier: string) => {
    const fileName = path.relative(directory, file);

    if (specifier.startsWith("@repo/") || specifier.startsWith("@/")) {
      issues.push(`${fileName}: private import ${specifier}`);
    } else if (specifier.startsWith(".") || path.isAbsolute(specifier)) {
      const target = path.relative(directory, path.resolve(path.dirname(file), specifier));

      if (target === ".." || target.startsWith(`..${path.sep}`) || path.isAbsolute(target)) {
        issues.push(`${fileName}: import escapes component directory: ${specifier}`);
      }
    }
  };

  const sourceFilesOf: (directoryPath: string) => Promise<string[]> = async (directoryPath) => {
    const entries = await readdir(directoryPath, { withFileTypes: true });

    const nested = await Promise.all(
      entries
        .filter((entry) => !ignoredDirectories.has(entry.name))
        .map(async (entry) => {
          const file = path.join(directoryPath, entry.name);

          if (entry.isDirectory()) {
            return await sourceFilesOf(file);
          }

          const extension = path.extname(file);

          return entry.isFile() && (codeExtensions.has(extension) || extension === ".css")
            ? [file]
            : [];
        }),
    );

    return nested.flat();
  };

  const checkSource = (file: string, source: string) => {
    if (path.extname(file) === ".css") {
      const css = source.replaceAll(/\/\*[\s\S]*?\*\//gu, "");

      for (const match of css.matchAll(/@import\s+(?:url\(\s*)?["'](?<specifier>[^"']+)["']/gu)) {
        const specifier = match.groups?.specifier;

        if (specifier !== undefined && specifier !== "") {
          checkImport(file, specifier);
        }
      }

      return;
    }

    const { program, errors } = parseSync(file, source, { sourceType: "unambiguous" });

    for (const error of errors) {
      issues.push(`${path.relative(directory, file)}: ${error.message}`);
    }

    const check = (node: Argument | null | undefined) => {
      const specifier = staticSpecifier(node);

      if (specifier !== undefined && specifier !== "") {
        checkImport(file, specifier);
      }
    };

    new Visitor({
      CallExpression: (node) => {
        if (node.callee.type === "Identifier" && node.callee.name === "require") {
          check(node.arguments[0]);
        }
      },
      ExportAllDeclaration: (node) => {
        check(node.source);
      },
      ExportNamedDeclaration: (node) => {
        check(node.source);
      },
      ImportDeclaration: (node) => {
        check(node.source);
      },
      ImportExpression: (node) => {
        check(node.source);
      },
    }).visit(program);
  };

  const files = await sourceFilesOf(directory);
  const sources = await Promise.all(files.map(async (file) => await readFile(file, "utf-8")));

  for (const [index, file] of files.entries()) {
    checkSource(file, sources[index] ?? "");
  }

  return issues;
};
