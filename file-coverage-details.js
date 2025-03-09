document.addEventListener("DOMContentLoaded", function () {
  const sscovSection = document.getElementById("sscov-section");
  const fileData = document.querySelectorAll(".sscov-data-only");
  const itemRows = document.querySelectorAll(".sscov-item-row");
  const fileDetails = document.querySelectorAll(".sscov-file-details");
  const fileDetailsOverlay = document.querySelector(
    ".sscov-file-details-overlay",
  );

  const lineCoverageTarget = parseFloat(
    sscovSection.getAttribute("data-line-target"),
  );
  const statementCoverageTarget = parseFloat(
    sscovSection.getAttribute("data-statement-target"),
  );
  const branchCoverageTarget = parseFloat(
    sscovSection.getAttribute("data-branch-target"),
  );
  const functionCoverageTarget = parseFloat(
    sscovSection.getAttribute("data-function-target"),
  );
  const totalCoverageTarget = parseFloat(
    sscovSection.getAttribute("data-total-target"),
  );

  const targetVals = {
    lineCoverageTarget,
    statementCoverageTarget,
    branchCoverageTarget,
    functionCoverageTarget,
    totalCoverageTarget,
  };

  let percentageData = calculatePercentageData();
  populateFileDetails(percentageData);
  addNameAndPercentageToItemRows();
  addOpenDetailsListenerToItemRows();
  addCloseDetailsListener();

  function calculatePercentageData() {
    let percentageData = [];

    fileDetails.forEach((fileDetail, index) => {
      const fileNameData = fileData[index]?.getAttribute(
        "data-sscov-file-name",
      );
      const fileContent = fileData[index]?.getAttribute(
        "data-sscov-file-content",
      );

      // Create temporary DOM element to parse the HTML content
      const parser = new DOMParser();
      const doc = parser.parseFromString(fileContent, "text/html");

      // Extract the required elements by class names
      const statements = doc.querySelector(".pad1y.space-right2:nth-child(1)");
      const branches = doc.querySelector(".pad1y.space-right2:nth-child(2)");
      const functions = doc.querySelector(".pad1y.space-right2:nth-child(3)");
      const lines = doc.querySelector(".pad1y.space-right2:nth-child(4)");

      // Get the percentage and fraction values for each field
      const coverageData = {
        statements: {
          percentage: statements.querySelector(".strong").textContent.trim(),
          fraction: statements.querySelector(".fraction").textContent.trim(),
        },
        branches: {
          percentage: branches.querySelector(".strong").textContent.trim(),
          fraction: branches.querySelector(".fraction").textContent.trim(),
        },
        functions: {
          percentage: functions.querySelector(".strong").textContent.trim(),
          fraction: functions.querySelector(".fraction").textContent.trim(),
        },
        lines: {
          percentage: lines.querySelector(".strong").textContent.trim(),
          fraction: lines.querySelector(".fraction").textContent.trim(),
        },
      };

      //Calculate total percentage
      const statementsPercentageVal = parseFloat(
        coverageData.statements.percentage.replace("%", ""),
      );
      const branchesPercentageVal = parseFloat(
        coverageData.branches.percentage.replace("%", ""),
      );
      const functionsPercentageVal = parseFloat(
        coverageData.functions.percentage.replace("%", ""),
      );
      const linesPercentageVal = parseFloat(
        coverageData.lines.percentage.replace("%", ""),
      );

      const totalCoveragePercentageVal = Math.round(
        (statementsPercentageVal +
          branchesPercentageVal +
          functionsPercentageVal +
          linesPercentageVal) /
          4,
      );

      const statementsFractionVal = coverageData.statements.fraction.split("/");
      const branchesFractionVal = coverageData.branches.fraction.split("/");
      const functionsFractionVal = coverageData.functions.fraction.split("/");
      const linesFractionVal = coverageData.lines.fraction.split("/");

      const totalNumerator =
        parseInt(statementsFractionVal[0]) +
        parseInt(branchesFractionVal[0]) +
        parseInt(functionsFractionVal[0]) +
        parseInt(linesFractionVal[0]);

      const totalDenominator =
        parseInt(statementsFractionVal[1]) +
        parseInt(branchesFractionVal[1]) +
        parseInt(functionsFractionVal[1]) +
        parseInt(linesFractionVal[1]);

      const totalFractionVal = totalNumerator + "/" + totalDenominator;
      const branchFractionVal =
        branchesFractionVal[0] + "/" + branchesFractionVal[1];
      const statementFractionVal =
        statementsFractionVal[0] + "/" + statementsFractionVal[1];
      const lineFractionVal = linesFractionVal[0] + "/" + linesFractionVal[1];
      const functionFractionVal =
        functionsFractionVal[0] + "/" + functionsFractionVal[1];

      const hitTotalTarget =
        totalCoveragePercentageVal >= targetVals.totalCoverageTarget;
      const hitBranchTarget =
        branchesPercentageVal >= targetVals.branchCoverageTarget;
      const hitFunctionsTarget =
        functionsPercentageVal >= targetVals.functionCoverageTarget;
      const hitLinesTarget =
        linesPercentageVal >= targetVals.lineCoverageTarget;
      const hitStatementsTarget =
        statementsPercentageVal >= targetVals.statementCoverageTarget;

      percentageData.push({
        index,
        fileNameData,
        statementsPercentageVal,
        statementFractionVal,
        hitStatementsTarget,
        branchesPercentageVal,
        branchFractionVal,
        hitBranchTarget,
        functionsPercentageVal,
        functionFractionVal,
        hitFunctionsTarget,
        linesPercentageVal,
        lineFractionVal,
        hitLinesTarget,
        totalCoveragePercentageVal,
        totalFractionVal,
        hitTotalTarget,
      });
    });

    return percentageData;
  }

  function showFileDetailsWindow(fileName) {
    const fileDetailsWindows = document.querySelectorAll(".sscov-file-details");
    fileDetailsWindows.forEach((fileWindow) => {
      const fileDetailsName = fileWindow
        .querySelector(".sscov-file-details-name")
        .textContent.trim();

      if (fileDetailsName === fileName) {
        fileWindow.classList.add("visible");
        fileDetailsOverlay.classList.add("visible");
      }
    });
  }

  function closeFileDetailsWindow() {
    const openWindows = document.querySelectorAll(
      ".sscov-file-details.visible",
    );
    openWindows.forEach((window) => {
      window.classList.remove("visible");
    });
    fileDetailsOverlay.classList.remove("visible");
  }

  function addOpenDetailsListenerToItemRows() {
    itemRows.forEach((row, index) => {
      //Assign click event listener
      row.addEventListener("click", function () {
        const fileName = fileData[index]?.getAttribute("data-sscov-file-name");
        closeFileDetailsWindow();
        showFileDetailsWindow(fileName);
      });
    });
  }

  function addNameAndPercentageToItemRows() {
    itemRows.forEach((row, rowIndex) => {
      const fileName = fileData[rowIndex]?.getAttribute("data-sscov-file-name");
      const fileNameDiv = row.querySelector(".sscov-file-name");
      const filePercentageTotalDiv = row.querySelector(
        ".sscov-coverage-percentage.total",
      );
      const filePercentageLinesDiv = row.querySelector(
        ".sscov-coverage-percentage.lines",
      );
      const filePercentageFunctionsDiv = row.querySelector(
        ".sscov-coverage-percentage.functions",
      );
      const filePercentageBranchesDiv = row.querySelector(
        ".sscov-coverage-percentage.branches",
      );
      const filePercentageStatementsDiv = row.querySelector(
        ".sscov-coverage-percentage.statements",
      );
      const result = getPercentageDataByFileName(fileName);

      //Deconstruct result
      const [
        {
          index,
          fileNameData,
          statementsPercentageVal,
          statementFractionVal,
          hitStatementsTarget,
          branchesPercentageVal,
          branchFractionVal,
          hitBranchTarget,
          functionsPercentageVal,
          functionFractionVal,
          hitFunctionsTarget,
          linesPercentageVal,
          lineFractionVal,
          hitLinesTarget,
          totalCoveragePercentageVal,
          totalFractionVal,
          hitTotalTarget,
        },
      ] = result;

      if (!fileName) return;

      fileNameDiv.textContent = fileName;
      filePercentageTotalDiv.textContent = totalCoveragePercentageVal;
      if (hitTotalTarget) {
        filePercentageTotalDiv.classList.add("hit-target");
      } else {
        filePercentageTotalDiv.classList.remove("hit-target");
      }
      filePercentageLinesDiv.textContent = linesPercentageVal;
      if (hitLinesTarget) {
        filePercentageLinesDiv.classList.add("hit-target");
      } else {
        filePercentageLinesDiv.classList.remove("hit-target");
      }
      filePercentageFunctionsDiv.textContent = functionsPercentageVal;
      if (hitFunctionsTarget) {
        filePercentageFunctionsDiv.classList.add("hit-target");
      } else {
        filePercentageFunctionsDiv.classList.remove("hit-target");
      }
      filePercentageBranchesDiv.textContent = branchesPercentageVal;
      if (hitBranchTarget) {
        filePercentageBranchesDiv.classList.add("hit-target");
      } else {
        filePercentageBranchesDiv.classList.remove("hit-target");
      }
      filePercentageStatementsDiv.textContent = statementsPercentageVal;
      if (hitStatementsTarget) {
        filePercentageStatementsDiv.classList.add("hit-target");
      } else {
        filePercentageStatementsDiv.classList.remove("hit-target");
      }
    });
  }

  function addCloseDetailsListener() {
    const closeButtons = document.querySelectorAll(".sscov-close-file-details");
    closeButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const parentWindow = button.closest(".sscov-file-details");
        if (parentWindow) {
          parentWindow.classList.add("hidden");
        }
      });
    });

    fileDetailsOverlay.addEventListener("click", function () {
      closeFileDetailsWindow();
    });
  }

  function populateFileDetails() {
    fileDetails.forEach((fileDetail, index) => {
      const fileName = fileData[index]?.getAttribute("data-sscov-file-name");
      const fileContent = fileData[index]?.getAttribute(
        "data-sscov-file-content",
      );

      //Set file name
      const fileNameDiv = fileDetail.querySelector(".sscov-file-details-name");
      if (fileNameDiv) {
        fileNameDiv.textContent = fileName;
      }

      const fileCloseDiv = fileDetail.querySelector(
        ".sscov-file-details-close",
      );
      if (fileCloseDiv) {
        fileCloseDiv.addEventListener("click", function () {
          closeFileDetailsWindow();
        });
      }

      SetFileDetailsCoverage(fileName, fileDetail, fileContent, targetVals);

      SetFileDetailsScript(fileDetail, fileContent);
    });
  }

  function getPercentageDataByFileName(fileName) {
    const res = percentageData.filter(
      (entry) => entry.fileNameData === fileName,
    );

    return res;
  }

  function SetFileDetailsCoverage(fileName, fileDetail) {
    const fileDetailsCoverage = fileDetail.querySelector(
      ".sscov-file-details-coverage",
    );

    const [totalTitle, totalPercentage, totalFraction] =
      fileDetailsCoverage.querySelectorAll(
        ".sscov-file-details-coverage .total .title, .sscov-file-details-coverage .total .percentage, .sscov-file-details-coverage .total .fraction",
      );

    const [branchesTitle, branchesPercentage, branchesFraction] =
      fileDetailsCoverage.querySelectorAll(
        ".sscov-file-details-coverage .branches .title, .sscov-file-details-coverage .branches .percentage, .sscov-file-details-coverage .branches .fraction",
      );

    const [functionsTitle, functionsPercentage, functionsFraction] =
      fileDetailsCoverage.querySelectorAll(
        ".sscov-file-details-coverage .functions .title, .sscov-file-details-coverage .functions .percentage, .sscov-file-details-coverage .functions .fraction",
      );

    const [linesTitle, linesPercentage, linesFraction] =
      fileDetailsCoverage.querySelectorAll(
        ".sscov-file-details-coverage .lines .title, .sscov-file-details-coverage .lines .percentage, .sscov-file-details-coverage .lines .fraction",
      );

    const [statementsTitle, statementsPercentage, statementsFraction] =
      fileDetailsCoverage.querySelectorAll(
        ".sscov-file-details-coverage .statements .title, .sscov-file-details-coverage .statements .percentage, .sscov-file-details-coverage .statements .fraction",
      );

    const result = getPercentageDataByFileName(fileName);

    //Deconstruct result
    const [
      {
        index,
        fileNameData,
        statementsPercentageVal,
        statementFractionVal,
        hitStatementsTarget,
        branchesPercentageVal,
        branchFractionVal,
        hitBranchTarget,
        functionsPercentageVal,
        functionFractionVal,
        hitFunctionsTarget,
        linesPercentageVal,
        lineFractionVal,
        hitLinesTarget,
        totalCoveragePercentageVal,
        totalFractionVal,
        hitTotalTarget,
      },
    ] = result;

    totalTitle.textContent = "Total:";
    totalPercentage.textContent = totalCoveragePercentageVal + "%";
    if (hitTotalTarget) {
      totalPercentage.classList.add("hit-target");
    } else {
      totalPercentage.classList.remove("hit-target");
    }
    totalFraction.textContent = totalFractionVal;

    branchesTitle.textContent = "Branches:";
    branchesPercentage.textContent = branchesPercentageVal + "%";
    if (hitBranchTarget) {
      branchesPercentage.classList.add("hit-target");
    } else {
      branchesPercentage.classList.remove("hit-target");
    }
    branchesFraction.textContent = branchFractionVal;

    functionsTitle.textContent = "Functions:";
    functionsPercentage.textContent = functionsPercentageVal + "%";
    if (hitFunctionsTarget) {
      functionsPercentage.classList.add("hit-target");
    } else {
      functionsPercentage.classList.remove("hit-target");
    }
    functionsFraction.textContent = functionFractionVal;

    linesTitle.textContent = "Lines:";
    linesPercentage.textContent = linesPercentageVal + "%";
    if (hitLinesTarget) {
      linesPercentage.classList.add("hit-target");
    } else {
      linesPercentage.classList.remove("hit-target");
    }
    linesFraction.textContent = lineFractionVal;
    statementsTitle.textContent = "Statements:";
    statementsPercentage.textContent = statementsPercentageVal + "%";
    if (hitStatementsTarget) {
      statementsPercentage.classList.add("hit-target");
    } else {
      statementsPercentage.classList.remove("hit-target");
    }
    statementsFraction.textContent = statementFractionVal;
  }
});

function SetFileDetailsScript(fileDetail, fileContent) {
  const fileContentDiv = fileDetail.querySelector(".sscov-file-details-grid");
  if (fileContentDiv) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(fileContent, "text/html");

    const lineCountAnchors = doc.querySelectorAll("td:first-child a[href]");
    const totalRows = lineCountAnchors.length;
    const lineCoverageCount = doc.querySelectorAll("td:nth-child(2) span");
    const lineCodePre = doc.querySelector("td:nth-child(3) pre");
    const codeLines = lineCodePre ? lineCodePre.innerHTML.split("\n") : [];

    let gridContent = "";

    for (let i = 0; i < totalRows; i++) {
      const lineNumber = lineCountAnchors[i].textContent;
      const secondColumnContent = lineCoverageCount[i].textContent;
      let codeLine = codeLines[i] || "";

      codeLine = processNestedSpans(codeLine);

      if (codeLine.includes("span")) {
        gridContent += `
          <div class="grid-row">
            <div class="grid-line-number">${lineNumber}</div>
            <div class="grid-line-coverage-count">${secondColumnContent ? secondColumnContent : ""}</div> 
            <div class="grid-line-script-code">${codeLine}</div> 
          </div>
        `;
        continue;
      }

      codeLine = codeLine.replace(
        /"([^"]*)"/g,
        '<span class="string-code">"$1"</span>',
      );

      if (codeLine.includes("//")) {
        const [beforeComment, comment] = codeLine.split("//");
        codeLine = `${beforeComment}<span class="commented-code">//${comment}</span>`;
      }

      gridContent += `
        <div class="grid-row">
          <div class="grid-line-number">${lineNumber}</div>
          <div class="grid-line-coverage-count">${secondColumnContent ? secondColumnContent : ""}</div> 
          <div class="grid-line-script-code">${codeLine}</div>
        </div>
      `;
    }

    fileContentDiv.innerHTML = gridContent;

    function processNestedSpans(codeLine) {
      codeLine = codeLine.replace(
        /<span[^>]*title="statement not covered"[^>]*>(.*?)<\/span>/,
        '<span class="statement-not-covered">$1</span>',
      );

      codeLine = codeLine.replace(
        /<span[^>]*title="line not covered"[^>]*>(.*?)<\/span>/,
        '<span class="line-not-covered">$1</span>',
      );

      codeLine = codeLine.replace(
        /<span[^>]*title="function not covered"[^>]*>(.*?)<\/span>/,
        '<span class="function-not-covered">$1</span>',
      );

      codeLine = codeLine.replace(
        /<span[^>]*title="branch not covered"[^>]*>(.*?)<\/span>/,
        '<span class="branch-not-covered">$1</span>',
      );

      codeLine = codeLine.replace(
        /<span[^>]*title="if path not taken"[^>]*>(.*?)<\/span>/,
        '<span class="path-not-taken">$1</span>',
      );

      codeLine = codeLine.replace(
        /<span[^>]*title="else path not taken"[^>]*>(.*?)<\/span>/,
        '<span class="path-not-taken">$1</span>',
      );

      return codeLine;
    }
  }
}
