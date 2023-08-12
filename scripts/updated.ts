#!/usr/bin/env ts-node

import * as fs from "fs";
import * as path from "path";

function renameFolderAndFiles(directory: string) {
  const files = fs.readdirSync(directory);

  files.forEach((file) => {
    const filePath = path.join(directory, file);
    const stats = fs.statSync(filePath);

    let parsedPath = path.parse(filePath);
    const newFileName = parsedPath.base
      .replace(/reshaped/g, "uicapsule")
      .replace(/Reshaped/g, "UIC");

    const newFilePath = path.join(parsedPath.dir, newFileName);
    if (filePath !== newFilePath) {
      fs.renameSync(filePath, newFilePath);
    }

    if (stats.isDirectory()) {
      renameFolderAndFiles(newFilePath);
    }
  });
}

function processFile(filePath: string) {
  const fileContent = fs.readFileSync(filePath, "utf-8");

  const replacedContent = fileContent
    .replace(/--rs/g, "--uic")
    .replace(/_rs/g, "_uic")
    .replace(/"rs"/g, '"uic"')
    .replace(/data-rs-/g, "data-uic-")
    .replace(/reshaped\.so/g, "uicapsule.com")
    .replace(/reshaped/g, "uicapsule")
    .replace(/Reshaped/g, "UIC");

  fs.writeFileSync(filePath, replacedContent);
}

function processDirectory(directory: string) {
  const files = fs.readdirSync(directory);

  files.forEach((file) => {
    const filePath = path.join(directory, file);
    const stats = fs.statSync(filePath);

    if (stats.isFile()) {
      processFile(filePath);
    } else if (stats.isDirectory()) {
      processDirectory(filePath);
    }
  });
}

function runFileConverter(targetDirectory: string) {
  if (!fs.existsSync(targetDirectory)) {
    console.error("Invalid directory path:", targetDirectory);
    process.exit(1);
  }

  const absolutePath = path.resolve(targetDirectory);
  renameFolderAndFiles(absolutePath);
  processDirectory(absolutePath);
  console.log("File processing complete.");
}

const targetDirectory = process.argv[2];

if (!targetDirectory) {
  console.error("Please provide a directory path.");
  process.exit(1);
}

runFileConverter(targetDirectory);
