import { lstat, readFile, readdir } from "node:fs/promises";
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
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
  type Node,
} from "@babel/types";

import {
  contentMetaSchema,
  contentPackageSchema,
} from "../apps/web/src/lib/content/content-schema";

const ignoredDirectories = new Set(["node_modules", "dist", ".cache", ".turbo"]);
const codeExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mts", ".cts", ".mjs", ".cjs"]);

const staticSpecifier = (node: Node | null | undefined): string | undefined => {
  if (isStringLiteral(node)) return node.value;
  if (isTemplateLiteral(node) && node.expressions.length === 0) return node.quasis[0]?.value.raw;
  return undefined;
};

export const validateContentDirectory = async (directory: string): Promise<string[]> => {
  const issues: string[] = [];
  const meta = await readFile(join(directory, "meta.json"), "utf-8")
    .then((source) => contentMetaSchema.safeParse(JSON.parse(source)))
    .catch(() => null);
  if (!meta) return ["missing or unparseable meta.json"];
  if (!meta.success) {
    return meta.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
  }
  if (meta.data.type === "remote") return issues;

  const preview = await lstat(join(directory, "preview.tsx")).catch(() => null);
  if (!preview?.isFile()) issues.push("missing preview.tsx");

  const pkg = await readFile(join(directory, "package.json"), "utf-8")
    .then((source) => contentPackageSchema.safeParse(JSON.parse(source)))
    .catch(() => null);
  if (!pkg?.success) {
    issues.push("missing or invalid package.json");
  } else {
    for (const group of [
      pkg.data.dependencies,
      pkg.data.devDependencies,
      pkg.data.peerDependencies,
    ]) {
      for (const [name, version] of Object.entries(group ?? {})) {
        if (name.startsWith("@repo/") || /^(workspace|file|link):/.test(version)) {
          issues.push(`package.json: ${name} must be installable outside this workspace`);
        }
      }
    }
  }

  const checkImport = (file: string, specifier: string) => {
    const fileName = relative(directory, file);
    if (specifier.startsWith("@repo/") || specifier.startsWith("@/")) {
      issues.push(`${fileName}: private import ${specifier}`);
    } else if (specifier.startsWith(".") || isAbsolute(specifier)) {
      const target = relative(directory, resolve(dirname(file), specifier));
      if (target === ".." || target.startsWith(`..${sep}`) || isAbsolute(target)) {
        issues.push(`${fileName}: import escapes component directory: ${specifier}`);
      }
    }
  };

  const visit = async (directoryPath: string) => {
    const entries = await readdir(directoryPath, { withFileTypes: true });
    for (const entry of entries) {
      if (ignoredDirectories.has(entry.name)) continue;
      const file = join(directoryPath, entry.name);
      if (entry.isDirectory()) {
        await visit(file);
        continue;
      }
      if (!entry.isFile()) continue;
      const extension = extname(file);
      if (!codeExtensions.has(extension) && extension !== ".css") continue;
      const source = await readFile(file, "utf-8");
      if (extension === ".css") {
        const css = source.replace(/\/\*[\s\S]*?\*\//g, "");
        for (const match of css.matchAll(/@import\s+(?:url\(\s*)?["']([^"']+)["']/g)) {
          const specifier = match[1];
          if (specifier) checkImport(file, specifier);
        }
        continue;
      }

      try {
        const syntax = parse(source, {
          sourceType: "unambiguous",
          sourceFilename: file,
          plugins: extension.endsWith("x") ? ["typescript", "jsx"] : ["typescript"],
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
          if (specifier) checkImport(file, specifier);
        });
      } catch (error) {
        issues.push(
          `${relative(directory, file)}: ${error instanceof Error ? error.message : error}`,
        );
      }
    }
  };

  await visit(directory);
  return issues;
};
