#!/usr/bin/env node

const { execSync } = require("child_process");
const rimraf = require("rimraf"); // cross-platform delete

// e.g., usage: npm run coverageOne -- __tests__/foo.test.ts src/foo.ts
const args = process.argv.slice(2); // collect everything after '--'
if (args.length < 2) {
    console.error("Usage: npm run coverageOne -- <testFile> <fileToCover>");
    process.exit(1);
}

const testFile = args[0];
const coverageFile = args[1];

// 1) Remove old coverage
rimraf.sync("coverage");

// 2) Build coverage array
const coverageArg = `--collectCoverageFrom='["${coverageFile}"]'`;

// 3) Construct command
const cmd = [
    "jest",
    testFile,
    "--no-cache",
    "--coverage",
    "--coverageProvider=v8",
    coverageArg
].join(" ");

console.log("Running coverage command:\n", cmd);

// 4) Execute
execSync(cmd, { stdio: "inherit" });
