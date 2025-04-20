import * as fs from "node:fs";
import * as path from "node:path";
import toCamelCase from "camelcase";

export const rootDir = path.resolve(path.join(process.cwd(), "src"));
export const outputFile = path.join(rootDir, "index.tsx");

export function getRelativeImport(filePath: string) {
  let relPath = "./" + path.relative(rootDir, filePath).replace(/\\/g, "/");
  relPath = relPath.replace(/\.tsx$/, "");
  return relPath;
}

export function findAllTsxFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      results = results.concat(findAllTsxFiles(filePath));
    } else if (file.endsWith(".tsx") && file.toLowerCase() !== "index.tsx") {
      results.push(filePath);
    }
  }
  return results;
}

export function generateIndexFile(tsxFiles: string[]) {
  const imports: string[] = [];
  const exports: string[] = [];

  for (const file of tsxFiles) {
    const fileName = path.basename(file).replace(".tsx", "");
    const componentName = toCamelCase(fileName);
    const importPath = getRelativeImport(file);
    imports.push(`import * as ${componentName} from '${importPath}';`);
    exports.push(`  "${fileName}": ${componentName}`);
  }

  const content = `${imports.join("\n")}

export default {
${exports.join(",\n")}
};
`;

  fs.writeFileSync(outputFile, content);
  console.log(`Generated ${outputFile}`);
}

export const files = findAllTsxFiles(rootDir);

// Check if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateIndexFile(files);
}
