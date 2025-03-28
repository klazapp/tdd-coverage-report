import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import ejs from "ejs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the package directory dynamically
const packageDir = __dirname;

// Function to resolve asset paths correctly
const assetPath = (filename) => path.join(packageDir, filename);

class CustomHTMLReporter {
  constructor(globalConfig, options) {
    this.options = options;

    const defaultCoverageTarget = {
      total: 80,
      branches: 80,
      functions: 80,
      statements: 80,
      lines: 80,
    };

    // Merge provided coverage targets with default values
    this.coverageTarget = {
      ...defaultCoverageTarget,
      ...(this.options.coverageTarget || {}),
    };

    this.totalCoverageTarget = this.coverageTarget.total || "";
    this.branchCoverageTarget = this.coverageTarget.branches || "";
    this.functionsCoverageTarget = this.coverageTarget.functions || "";
    this.statementsCoverageTarget = this.coverageTarget.statements || "";
    this.linesCoverageTarget = this.coverageTarget.lines || "";

    this.reportTitle = this.options.reportTitle || "Jest Coverage Report";
    this.enableDetailedLog = this.options.enableDetailedLog || false;
    this.disableAutoOpen = this.options.disableAutoOpen || false;
  }

  async onRunComplete(contexts, results) {
    const outputPath = path.resolve(process.cwd(), "tdd-coverage-report.html");
    const testResults = this.processTestResults(results);

    process.nextTick(async () => {
      try {
        const coverageSummary = await this.getCoverageSummary();
        const coverageFilesData = this.getHtmlFiles("coverage/lcov-report");

        const reportContent = this.generateReport(
            results,
            coverageSummary,
            testResults,
            coverageFilesData,
        );

        fs.writeFileSync(outputPath, reportContent);

        if (!this.disableAutoOpen) {
          this.openReportInBrowser(outputPath);
        }
      } catch (err) {
        console.error("Error during report generation:", err);
      }
    });
  }

  getHtmlFiles(dir) {
    const fullPath = path.resolve(process.cwd(), dir);

    const htmlFiles = [];

    // Recursively scan directories
    function scanDirectory(directory) {
      if (!fs.existsSync(directory)) {
        console.warn(`⚠️ No directory found: ${directory}`);
        return;
      }

      fs.readdirSync(directory).forEach((file) => {
        const filePath = path.join(directory, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          // ✅ If folder, scan recursively
          scanDirectory(filePath);
        } else if (file.endsWith(".html") && file !== "index.html") {
          // ✅ If HTML file (not index.html), add it to list
          const fileContent = fs.readFileSync(filePath, "utf8");
          htmlFiles.push({
            fileName: file,
            content: fileContent,
            path: filePath.replace(fullPath, ""), // Relative path for reference
          });
        }
      });
    }

    // Start scanning from base directory
    scanDirectory(fullPath);

    return htmlFiles;
  }

  async getCoverageSummary() {
    const coveragePath = path.resolve(
        process.cwd(),
        "coverage",
        "coverage-final.json",
    );
    const maxRetries = 5;
    const delayBetweenRetries = 1000;

    let attempts = 0;

    while (attempts < maxRetries) {
      if (fs.existsSync(coveragePath)) {
        const data = fs.readFileSync(coveragePath, "utf8");
        const coverage = JSON.parse(data);
        return this.processCoverageData(coverage);
      } else {
        console.log(`Coverage file not found, waiting...`);
        await this.delay(delayBetweenRetries);
        attempts++;
      }
    }

    throw new Error("Coverage file could not be found after waiting.");
  }

  getHtmlContentForFile(scriptName) {
    const coverageReportDir = path.resolve(
        process.cwd(),
        "coverage/lcov-report",
    );
    const fileName =
        path.basename(scriptName, path.extname(scriptName)) + ".html";
    const filePath = path.join(coverageReportDir, fileName);

    // Check if HTML coverage report exists
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, "utf8");
    } else {
      return "No HTML coverage report found.";
    }
  }

  getTestFunctionCode(testFilePath, testTitle) {
    const fileContent = fs.readFileSync(testFilePath, "utf-8");
    const lines = fileContent.split("\n");

    // Find start and end of the test function
    const startLineIndex = lines.findIndex((line) =>
        line.includes(`("${testTitle}"`),
    );
    if (startLineIndex === -1) return "Test function not found.";

    let endLineIndex = startLineIndex;
    let bracketCount = 0;
    let insideFunction = false;

    // Loop to find the complete test function block
    for (let i = startLineIndex; i < lines.length; i++) {
      const line = lines[i];

      if (line.includes("{")) bracketCount++;
      if (line.includes("}")) bracketCount--;

      if (!insideFunction && line.includes("{")) insideFunction = true;

      if (insideFunction && bracketCount === 0) {
        endLineIndex = i;
        break;
      }
    }

    // Get the test code and attach line numbers
    const testCode = lines
        .slice(startLineIndex, endLineIndex + 1)
        .map((line, index) => {
          const lineNumber = startLineIndex + index + 1; // Get the actual line number
          return `${lineNumber.toString().padStart(4, " ")} | ${line}`; // Format with line number
        })
        .join("\n");

    return testCode;
  }

  wrapFileName(fileName, maxWidth) {
    // Breaks the file name into lines of at most `maxWidth` characters
    const lines = [];
    let index = 0;

    while (index < fileName.length) {
      lines.push(fileName.slice(index, index + maxWidth));
      index += maxWidth;
    }

    return lines;
  }

  /**
   * Always prints two rows per file:
   *  - Row 1: Possibly the first line of the file name + coverage columns
   *  - Row 2: The second line (if any) of the file name, with blank coverage columns
   *
   * @param {Array} fileCoverageArray - e.g. [{ File, Statements, Branches, Functions, Lines }, ...]
   * @param {number} fileNameWidth    - max width for the first line of file name
   */
  printTwoRowsPerFile(fileCoverageArray, fileNameWidth = 30) {
    // Print a header (custom ASCII style)
    // Adjust these widths to your liking
    const colStatementsWidth = 18;
    const colBranchesWidth = 18;
    const colFunctionsWidth = 18;
    const colLinesWidth = 18;

    console.log(
        " File Name".padEnd(fileNameWidth) +
        " | " +
        "Statements".padEnd(colStatementsWidth) +
        " | " +
        "Branches".padEnd(colBranchesWidth) +
        " | " +
        "Functions".padEnd(colFunctionsWidth) +
        " | " +
        "Lines".padEnd(colLinesWidth)
    );

    // Simple separator line
    console.log("-".repeat(fileNameWidth + colStatementsWidth + colBranchesWidth + colFunctionsWidth + colLinesWidth + 12));

    fileCoverageArray.forEach((entry, index) => {
      // 1) Slice the file name into two lines (max 2)
      const fileName = entry.File;
      const firstLine = fileName.slice(0, fileNameWidth);
      let secondLine = fileName.length > fileNameWidth
          ? fileName.slice(fileNameWidth)
          : "";
      // If there's leftover beyond the firstLine, put it in secondLine
      if (fileName.length > fileNameWidth) {
        secondLine = fileName.slice(fileNameWidth);
      }

      const statementsCell = this.padColorString(entry.Statements, colStatementsWidth);
      const branchesCell   = this.padColorString(entry.Branches, colBranchesWidth);
      const functionsCell  = this.padColorString(entry.Functions, colFunctionsWidth);
      const linesCell      = this.padColorString(entry.Lines, colLinesWidth);

      // Print Row 1 → coverage columns
      console.log(
          firstLine.padEnd(fileNameWidth) +
          " | " + statementsCell +
          " | " + branchesCell +
          " | " + functionsCell +
          " | " + linesCell
      );

      // Print Row 2 → leftover file name, coverage is empty
      console.log(
          secondLine.padEnd(fileNameWidth) +
          " | " +
          " ".repeat(colStatementsWidth) +
          " | " +
          " ".repeat(colBranchesWidth) +
          " | " +
          " ".repeat(colFunctionsWidth) +
          " | " +
          " ".repeat(colLinesWidth)
      );
    });
  }

  formatCoverage(covered, total) {
    if (!total) {
      return "N/A (0/0)";
    }
    const pct = ((covered / total) * 100).toFixed(2);
    return `${pct}% (${covered}/${total})`;
  }

  colorCoverage(coverageString, coverageValue, coverageType) {
    const userThreshold = this.coverageTarget[coverageType] || 80;

    // coverageValue is e.g. numeric 0..100
    if (coverageValue >= userThreshold) {
      return `\x1b[32m${coverageString}\x1b[0m`; // green
    } else if (coverageValue >= userThreshold - 10) {
      return `\x1b[33m${coverageString}\x1b[0m`; // yellow
    } else {
      return `\x1b[31m${coverageString}\x1b[0m`; // red
    }
  }

  stripAnsi(str) {
    return str.replace(/\x1b\[[0-9;]*m/g, "");
  }

  padColorString(coloredStr, targetWidth) {
    const visible = this.stripAnsi(coloredStr);
    const visibleLength = visible.length;
    const needed = Math.max(targetWidth - visibleLength, 0);
    return coloredStr + " ".repeat(needed);
  }

  processCoverageData(coverage) {
    let totalStatements = 0,
        coveredStatements = 0;
    let totalFunctions = 0,
        coveredFunctions = 0;
    let totalBranches = 0,
        coveredBranches = 0;
    let totalLines = 0,
        coveredLines = 0;

    // Store file-level coverage for console.table
    const fileCoverageTable = [];

    const fileCoverageObject = {};

    // For returning detailed coverage data at the end
    const coverageData = {};

    // 1. Iterate over each file's coverage data
    for (const file in coverage) {
      const fileCoverage = coverage[file];

      // Distinguish covered vs. total for each metric
      const totalFileStatements = Object.keys(fileCoverage.s).length;
      const coveredFileStatements = Object.values(fileCoverage.s).filter(
          (count) => count > 0
      ).length;

      const totalFileFunctions = Object.keys(fileCoverage.f).length;
      const coveredFileFunctions = Object.values(fileCoverage.f).filter(
          (count) => count > 0
      ).length;

      const totalFileBranches = Object.keys(fileCoverage.b).reduce(
          (sum, key) => sum + fileCoverage.b[key].length,
          0
      );
      const coveredFileBranches = Object.values(fileCoverage.b).reduce(
          (acc, branchArray) => acc + branchArray.filter((count) => count > 0).length,
          0
      );

      // Lines: we track unique lines vs. covered lines
      const uniqueLines = new Set();
      const coveredLineSet = new Set();
      for (const key in fileCoverage.statementMap) {
        const lineNumber = fileCoverage.statementMap[key].start.line;
        uniqueLines.add(lineNumber);
        if (fileCoverage.s[key] > 0) {
          coveredLineSet.add(lineNumber);
        }
      }

      const totalFileLines = uniqueLines.size;
      const coveredFileLines = coveredLineSet.size;

      // 2. Accumulate to overall coverage
      totalStatements += totalFileStatements;
      coveredStatements += coveredFileStatements;
      totalFunctions += totalFileFunctions;
      coveredFunctions += coveredFileFunctions;
      totalBranches += totalFileBranches;
      coveredBranches += coveredFileBranches;
      totalLines += totalFileLines;
      coveredLines += coveredFileLines;

      // 3. Build file-level coverage (percentage) to store in coverageData
      //    for returning at the end or generating HTML
      const statementPct = (coveredStatements / totalStatements) * 100 || 0;
      const branchPct = (coveredBranches / totalBranches) * 100 || 0;
      const functionPct = (coveredFunctions / totalFunctions) * 100 || 0;
      const linePct = totalLines ? (coveredLines / totalLines) * 100 : 0;

      coverageData[file] = {
        statementCoverage: statementPct.toFixed(2),
        functionCoverage: functionPct.toFixed(2),
        branchCoverage: branchPct.toFixed(2),
        lineCoverage: linePct.toFixed(2),
        htmlContent: this.getHtmlContentForFile(file),
      };

      // 4. Prepare an entry for the console.table
      //    Show the coverage for *this file only* using formatCoverage(...)
      //    Shorten the file path relative to process.cwd()
      // const shortFile = path.relative(process.cwd(), file);
      const shortFile = path.basename(file);

      // Add row to the object, so each file is a property -> row label
      fileCoverageObject[shortFile] = {
        Statements: this.formatCoverage(coveredFileStatements, totalFileStatements),
        Branches: this.formatCoverage(coveredFileBranches, totalFileBranches),
        Functions: this.formatCoverage(coveredFileFunctions, totalFileFunctions),
        Lines: this.formatCoverage(coveredFileLines, totalFileLines),
      };

      // 1) Compute raw coverage values (0–100)
      const statementsValue = totalFileStatements
          ? (coveredFileStatements / totalFileStatements) * 100
          : 0;
      const branchesValue = totalFileBranches
          ? (coveredFileBranches / totalFileBranches) * 100
          : 0;
      const functionsValue = totalFileFunctions
          ? (coveredFileFunctions / totalFileFunctions) * 100
          : 0;
      const linesValue = totalFileLines
          ? (coveredFileLines / totalFileLines) * 100
          : 0;

      // 2) Format coverage strings normally
      const statementsText = this.formatCoverage(
          coveredFileStatements,
          totalFileStatements
      );
      const branchesText = this.formatCoverage(
          coveredFileBranches,
          totalFileBranches
      );
      const functionsText = this.formatCoverage(
          coveredFileFunctions,
          totalFileFunctions
      );
      const linesText = this.formatCoverage(coveredFileLines, totalFileLines);

      // 3) Apply color
      const coloredStatements = this.colorCoverage(statementsText, statementsValue, "statements");
      const coloredBranches   = this.colorCoverage(branchesText,   branchesValue,   "branches");
      const coloredFunctions  = this.colorCoverage(functionsText,  functionsValue,  "functions");
      const coloredLines      = this.colorCoverage(linesText,      linesValue,      "lines");

      // 4) Push into fileCoverageTable
      fileCoverageTable.push({
        File: shortFile,
        Statements: coloredStatements,  // now includes ANSI color codes
        Branches: coloredBranches,
        Functions: coloredFunctions,
        Lines: coloredLines,
      });
    }

    // 5. Calculate overall coverage
    const lineCoverage = totalLines > 0 ? (coveredLines / totalLines) * 100 : 0;
    const statementCoverage =
        totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0;
    const functionCoverage =
        totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0;
    const branchCoverage =
        totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0;

    console.log("\n📊 File-Level Coverage\n");
    this.printTwoRowsPerFile(fileCoverageTable, 30); // e.g. 30 chars for file name col

    // 7. Print a console.table of overall coverage
    console.log("\n📈 Overall Coverage Totals:\n");
    console.table([
      {
        Metric: "Lines",
        Covered: coveredLines,
        Total: totalLines,
        Percentage: `${lineCoverage.toFixed(2)}%`,
      },
      {
        Metric: "Statements",
        Covered: coveredStatements,
        Total: totalStatements,
        Percentage: `${statementCoverage.toFixed(2)}%`,
      },
      {
        Metric: "Functions",
        Covered: coveredFunctions,
        Total: totalFunctions,
        Percentage: `${functionCoverage.toFixed(2)}%`,
      },
      {
        Metric: "Branches",
        Covered: coveredBranches,
        Total: totalBranches,
        Percentage: `${branchCoverage.toFixed(2)}%`,
      },
    ]);

    // 8. Return coverage details so the rest of your reporter can use them
    return {
      lines: {
        total: totalLines,
        covered: coveredLines,
        pct: lineCoverage.toFixed(2),
      },
      statements: {
        total: totalStatements,
        covered: coveredStatements,
        pct: statementCoverage.toFixed(2),
      },
      functions: {
        total: totalFunctions,
        covered: coveredFunctions,
        pct: functionCoverage.toFixed(2),
      },
      branches: {
        total: totalBranches,
        covered: coveredBranches,
        pct: branchCoverage.toFixed(2),
      },
      coverageData,
    };
  }

  processTestResults(results) {
    return results.testResults.map((testSuite) => {
      const fileName = path.basename(testSuite.testFilePath);
      const groupedTests = {};

      let passedCount = 0;
      let skippedCount = 0;
      let failedCount = 0;

      testSuite.testResults.forEach((test) => {
        const testNameParts = test.ancestorTitles;
        const describeBlock = testNameParts.join(" > ") || "Ungrouped Tests";

        if (!groupedTests[describeBlock]) {
          groupedTests[describeBlock] = [];
        }

        const testFunction = this.getTestFunctionCode(
            testSuite.testFilePath,
            test.title,
        );

        const testError =
            test.status === "failed" && test.failureMessages
                ? test.failureMessages.join("\n")
                : null;

        groupedTests[describeBlock].push({
          testTitle: test.title,
          testStatus: test.status,
          testFunction: testFunction,
          testError: testError,
        });

        if (test.status === "passed") {
          passedCount++;
        } else if (test.status === "failed") {
          failedCount++;
        } else if (test.status === "pending") {
          skippedCount++;
        }
      });

      return {
        fileName: fileName,
        groupedTests: groupedTests,
        passedCount: passedCount,
        skippedCount: skippedCount,
        failedCount: failedCount,
      };
    });
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  generateReport(results, coverageSummary, testResults, coverageFilesData) {
    let totalTestSuites = results.numTotalTestSuites;
    let totalTests = results.numTotalTests;
    let passedTests = results.numPassedTests;
    let failedSuites = results.numFailedTestSuites;
    let failedTests = results.numFailedTests;
    let skippedTests = results.numPendingTests;
    let runtimeError = results.numRuntimeErrorTestSuites;

    const branchCoverage = isNaN(coverageSummary?.branches?.pct)
        ? "N/A"
        : Math.round(parseFloat(coverageSummary.branches.pct));
    const functionCoverage = isNaN(coverageSummary?.functions?.pct)
        ? "N/A"
        : Math.round(parseFloat(coverageSummary.functions.pct));
    const statementCoverage = isNaN(coverageSummary?.statements?.pct)
        ? "N/A"
        : Math.round(parseFloat(coverageSummary.statements.pct));
    const lineCoverage = isNaN(coverageSummary?.lines?.pct)
        ? "N/A"
        : Math.round(parseFloat(coverageSummary.lines.pct));
    const coverageValues = [
      isNaN(branchCoverage) ? null : parseFloat(branchCoverage),
      isNaN(functionCoverage) ? null : parseFloat(functionCoverage),
      isNaN(statementCoverage) ? null : parseFloat(statementCoverage),
      isNaN(lineCoverage) ? null : parseFloat(lineCoverage),
    ].filter((value) => value !== null);

    const totalCoverage =
        coverageValues.length > 0
            ? coverageValues.reduce((acc, value) => acc + value, 0) /
            coverageValues.length
            : "N/A";

    return this.generateHtmlReport(
        totalTestSuites,
        totalTests,
        passedTests,
        failedSuites,
        failedTests,
        skippedTests,
        runtimeError,
        branchCoverage,
        functionCoverage,
        statementCoverage,
        lineCoverage,
        totalCoverage,
        testResults,
        coverageFilesData,
    );
  }

  generateHtmlReport(
      totalTestSuites,
      totalTests,
      passedTests,
      failedSuites,
      failedTests,
      skippedTests,
      runtimeError,
      branchCoverage,
      functionCoverage,
      statementCoverage,
      lineCoverage,
      totalCoverage,
      testResults,
      coverageFilesData,
  ) {
    const templatePath = assetPath("jest-reporter-template.html");

    return ejs.render(fs.readFileSync(templatePath, "utf-8"), {
      reportTitle: this.reportTitle,
      totalCoverageTarget: this.totalCoverageTarget,
      branchCoverageTarget: this.branchCoverageTarget,
      functionsCoverageTarget: this.functionsCoverageTarget,
      statementsCoverageTarget: this.statementsCoverageTarget,
      linesCoverageTarget: this.linesCoverageTarget,

      totalTestSuites,
      totalTests,
      passedTests,
      failedSuites,
      failedTests,
      skippedTests,
      runtimeError,
      branchCoverage,
      functionCoverage,
      statementCoverage,
      lineCoverage,
      totalCoverage,
      testResults,
      coverageFilesData,

      // Inject correct asset paths dynamically
      stylesPath: assetPath("styles.css"),
      bentoGridPath: assetPath("bento-grid.js"),
      navbarPath: assetPath("navbar.js"),
      testExpandableRowsPath: assetPath("test-expandable-rows.js"),
      testPopupPath: assetPath("test-popup.js"),
      fileCoverageDetailsPath: assetPath("file-coverage-details.js"),
      fileCoverageDetailsBannerPath: assetPath("file-coverage-details-banner.js"),
      savePdfPath: assetPath("save-pdf.js"),
      devIconPath: assetPath("dev-icon.svg"),
      classicCoveragePath: "./coverage/lcov-report/index.html",
      // ✅ Inject the new JS file dynamically
      classicCoverageScriptPath: assetPath("classic-coverage.js"),
    });
  }

  openReportInBrowser(outputPath) {
    const platform = process.platform;
    let command;

    if (platform === "darwin") {
      // macOS
      command = `open "${outputPath}"`;
    } else if (platform === "win32") {
      // Windows
      command = `start "" "${outputPath}"`;
    } else if (platform === "linux") {
      // Linux
      command = `xdg-open "${outputPath}"`;
    }

    if (command) {
      exec(command, (error) => {
        if (error) {
          console.error(`Error opening HTML report: ${error.message}`);
        }
      });
    } else {
      console.error(
          "Unsupported platform for automatically opening the report.",
      );
    }
  }
}

export default CustomHTMLReporter;
