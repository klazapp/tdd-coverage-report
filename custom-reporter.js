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
  }

  async onRunComplete(contexts, results) {
    const outputPath = path.resolve(process.cwd(), "tdd-coverage-report.html");
    const testResults = this.processTestResults(results);

    process.nextTick(async () => {
      try {
        const coverageSummary = await this.getCoverageSummary();
        const coverageFilesData = this.getHtmlFiles("coverage/lcov-report");

        //console.log("coverageFiles =  " + JSON.stringify(coverageFilesData));

        const reportContent = this.generateReport(
          results,
          coverageSummary,
          testResults,
          coverageFilesData,
        );

        fs.writeFileSync(outputPath, reportContent);

        this.openReportInBrowser(outputPath);
      } catch (err) {
        console.error("Error during report generation:", err);
      }
    });
  }

 getHtmlFiles(dir) {
    const fullPath = path.resolve(process.cwd(), dir);
    console.log(`📂 Scanning for coverage HTML files in: ${fullPath}`);

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
          // ✅ If it's a folder, scan it recursively
          scanDirectory(filePath);
        } else if (file.endsWith(".html") && file !== "index.html") {
          // ✅ If it's an HTML file (not index.html), add it to the list
          console.log(`✅ Found coverage file: ${filePath}`);
          const fileContent = fs.readFileSync(filePath, "utf8");
          htmlFiles.push({
            fileName: file,
            content: fileContent,
            path: filePath.replace(fullPath, ""), // Relative path for reference
          });
        }
      });
    }

    // Start scanning from the base directory
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

    // Check if the HTML coverage report exists
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, "utf8");
    } else {
      return "No HTML coverage report found.";
    }
  }

  getTestFunctionCode(testFilePath, testTitle) {
    const fileContent = fs.readFileSync(testFilePath, "utf-8");
    const lines = fileContent.split("\n");

    // Find the start and end of the test function
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

    console.log(
      "test code with line numbers= " + JSON.stringify(testCode, null, 2),
    );
    return testCode;
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

    const coverageData = {};

    // Iterate over each file's coverage data
    for (const file in coverage) {
      let currentTotalStatements = 0;
      let currentCoveredStatements = 0;
      let currentStatementCoverage = 0;
      let currentTotalFunctions = 0;
      let currentCoveredFunctions = 0;
      let currentFunctionCoverage = 0;
      let currentTotalBranches = 0;
      let currentCoveredBranches = 0;
      let currentBranchesCoverage = 0;
      let currentTotalLines = 0;
      let currentCoveredLines = 0;
      let currentLinesCoverage = 0;

      const fileCoverage = coverage[file];

      const uniqueLines = new Set();
      const coveredLineSet = new Set();

      for (const key in fileCoverage.statementMap) {
        const lineNumber = fileCoverage.statementMap[key].start.line;
        uniqueLines.add(lineNumber);

        if (fileCoverage.s[key] > 0) {
          coveredLineSet.add(lineNumber);
        }
      }

      totalLines += uniqueLines.size;
      coveredLines += coveredLineSet.size;

      currentTotalLines += uniqueLines.size;
      currentCoveredLines += coveredLineSet.size;

      // Sum up statements
      totalStatements += Object.keys(fileCoverage.s).length;
      coveredStatements += Object.values(fileCoverage.s).filter(
        (count) => count > 0,
      ).length;

      // Current file's statement
      currentTotalStatements += Object.keys(fileCoverage.s).length;
      currentCoveredStatements += Object.values(fileCoverage.s).filter(
        (count) => count > 0,
      ).length;

      // Sum up functions
      totalFunctions += Object.keys(fileCoverage.f).length;
      coveredFunctions += Object.values(fileCoverage.f).filter(
        (count) => count > 0,
      ).length;

      // Current files' functions
      currentTotalFunctions += Object.keys(fileCoverage.f).length;
      currentCoveredFunctions += Object.values(fileCoverage.f).filter(
        (count) => count > 0,
      ).length;

      // Sum up branches
      totalBranches += Object.keys(fileCoverage.b).reduce(
        (sum, key) => sum + fileCoverage.b[key].length,
        0,
      );
      coveredBranches += Object.values(fileCoverage.b).reduce(
        (acc, branchArray) =>
          acc + branchArray.filter((count) => count > 0).length,
        0,
      );

      // Current branches
      currentTotalBranches += Object.keys(fileCoverage.b).reduce(
        (sum, key) => sum + fileCoverage.b[key].length,
        0,
      );
      currentCoveredBranches += Object.values(fileCoverage.b).reduce(
        (acc, branchArray) =>
          acc + branchArray.filter((count) => count > 0).length,
        0,
      );

      // Current coverages
      currentStatementCoverage =
        (fileCoverage.s ? (coveredStatements / totalStatements) * 100 : 0) ||
        "N/A";
      currentBranchesCoverage =
        (fileCoverage.b ? (coveredBranches / totalBranches) * 100 : 0) || "N/A";
      currentFunctionCoverage =
        (fileCoverage.f ? (coveredFunctions / totalFunctions) * 100 : 0) ||
        "N/A";
      currentLinesCoverage = totalLines
        ? (coveredLines / totalLines) * 100
        : "N/A";

      const htmlContent = this.getHtmlContentForFile(file);

      coverageData[file] = {
        statementCoverage: (
          (coveredStatements / totalStatements) *
          100
        ).toFixed(2),
        functionCoverage: ((coveredFunctions / totalFunctions) * 100).toFixed(
          2,
        ),
        branchCoverage: ((coveredBranches / totalBranches) * 100).toFixed(2),
        lineCoverage: ((coveredLines / totalLines) * 100).toFixed(2),
        htmlContent,
      };

      //TODO: Make this into a nice pretty table
      console.log(`Coverage for ${file}:`);
      console.log(`  Statement : ${currentCoveredStatements}`);
      console.log(`  Branch : ${currentCoveredBranches}`);
      console.log(`  Function : ${currentCoveredFunctions}`);
      console.log(`  Line : ${currentCoveredLines}`);

      console.log(`  total Statement : ${currentTotalStatements}`);
      console.log(`  total Branch : ${currentTotalBranches}`);
      console.log(`  total Function : ${currentTotalFunctions}`);
      console.log(`  total Line : ${currentTotalLines}`);

      console.log(
        `  Statement Coverage: ${currentStatementCoverage.toFixed(2)}%`,
      );
      console.log(`  Branch Coverage: ${currentBranchesCoverage.toFixed(2)}%`);
      console.log(
        `  Function Coverage: ${currentFunctionCoverage.toFixed(2)}%`,
      );
      console.log(`  Line Coverage: ${currentLinesCoverage.toFixed(2)}%`);
    }

    console.log("Covered lines = " + coveredLines);
    console.log("Covered statements = " + coveredStatements);
    console.log("Covered functions = " + coveredFunctions);
    console.log("Covered branches = " + coveredBranches);

    const lineCoverage =
      totalLines > 0 ? (coveredLines / totalLines) * 100 : "N/A";
    const statementCoverage =
      totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : "N/A";
    const functionCoverage =
      totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : "N/A";
    const branchCoverage =
      totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : "N/A";

    console.log("Line coverage = " + lineCoverage);
    console.log("Statement coverage = " + statementCoverage);
    console.log("Function coverage = " + functionCoverage);
    console.log("Branch coverage = " + branchCoverage);

    return {
      lines: {
        total: totalLines,
        covered: coveredLines,
        pct: ((coveredLines / totalLines) * 100).toFixed(2),
      },
      statements: {
        total: totalStatements,
        covered: coveredStatements,
        pct: ((coveredStatements / totalStatements) * 100).toFixed(2),
      },
      functions: {
        total: totalFunctions,
        covered: coveredFunctions,
        pct: ((coveredFunctions / totalFunctions) * 100).toFixed(2),
      },
      branches: {
        total: totalBranches,
        covered: coveredBranches,
        pct: ((coveredBranches / totalBranches) * 100).toFixed(2),
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
    // const templatePath = path.resolve(
    //   process.cwd(),
    //   "./custom-jest-reporter/jest-reporter-template.html",
    // );
    // const templatePath = path.resolve(__dirname, "jest-reporter-template.html");

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

    console.log(`openReportInBrowser: Running command: ${command}`);

    if (command) {
      exec(command, (error) => {
        if (error) {
          console.error(`Error opening HTML report: ${error.message}`);
        } else {
          console.log("HTML report opened successfully in the browser.");
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
