import { lstat, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { parse } from "@babel/parser";
import {
  isCallExpression,
  isExportAllDeclaration,
  isExportNamedDeclaration,
  isIdentifier,
  isImport,
  isImportDeclaration,
  isImportExpression,
  isStringLiteral,
  isTemplateLiteral,
  traverseFast,
} from "@babel/types";
import type { Node } from "@babel/types";

import {
  contentMetaSchema,
  contentPackageSchema,
} from "../apps/web/src/lib/content/content-schema";

export const ignoredDirectories = new Set(["node_modules", "dist", ".cache", ".turbo"]);
const codeExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mts", ".cts", ".mjs", ".cjs"]);

const staticSpecifier = (node: Node | null | undefined): string | undefined => {
  if (isStringLiteral(node)) {
    return node.value;
  }
  if (isTemplateLiteral(node) && node.expressions.length === 0) {
    return node.quasis[0]?.value.raw;
  }
  return undefined;
};

export const validateContentDirectory = async (directory: string): Promise<string[]> => {
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
  if (!preview?.isFile()) {
    issues.push("missing preview.tsx");
  }

  const pkg = await readFile(path.join(directory, "package.json"), "utf-8")
    .then((source) => contentPackageSchema.safeParse(JSON.parse(source)))
    .catch(() => null);
  if (pkg?.success) {
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

  const visit = async (directoryPath: string) => {
    const entries = await readdir(directoryPath, { withFileTypes: true });
    for (const entry of entries) {
      if (ignoredDirectories.has(entry.name)) {
        continue;
      }
      const file = path.join(directoryPath, entry.name);
      if (entry.isDirectory()) {
        await visit(file);
        continue;
      }
      if (!entry.isFile()) {
        continue;
      }
      const extension = path.extname(file);
      if (!codeExtensions.has(extension) && extension !== ".css") {
        continue;
      }
      const source = await readFile(file, "utf-8");
      if (extension === ".css") {
        const css = source.replaceAll(/\/\*[\s\S]*?\*\//gu, "");
        for (const match of css.matchAll(/@import\s+(?:url\(\s*)?["'](?<specifier>[^"']+)["']/gu)) {
          const specifier = match.groups?.specifier;
          if (specifier) {
            checkImport(file, specifier);
          }
        }
        continue;
      }

      try {
        const syntax = parse(source, {
          plugins: extension.endsWith("x") ? ["typescript", "jsx"] : ["typescript"],
          sourceFilename: file,
          sourceType: "unambiguous",
        });
        traverseFast(syntax, (node) => {
          let specifier: string | undefined;
          if (
            isImportDeclaration(node) ||
            isExportNamedDeclaration(node) ||
            isExportAllDeclaration(node)
          ) {
            specifier = staticSpecifier(node.source);
          } else if (isImportExpression(node)) {
            specifier = staticSpecifier(node.source);
          } else if (
            isCallExpression(node) &&
            (isImport(node.callee) || isIdentifier(node.callee, { name: "require" }))
          ) {
            specifier = staticSpecifier(node.arguments[0]);
          }
          if (specifier) {
            checkImport(file, specifier);
          }
        });
      } catch (error) {
        issues.push(
          `${path.relative(directory, file)}: ${error instanceof Error ? error.message : error}`,
        );
      }
    }
  };

  await visit(directory);
  return issues;
};
