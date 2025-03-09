document.addEventListener("DOMContentLoaded", function () {
  const testSuiteRows = document.querySelectorAll(".tres-suite-row");

  const testResultsDiv = document.querySelector("[data-test-results]");
  const dataTestResults = testResultsDiv.getAttribute("data-test-results");
  const decodedDataTestResults = dataTestResults.replace(/&quot;/g, '"');

  const testResults = JSON.parse(decodedDataTestResults);

  const expandAllButton = document.querySelector(".tres-expand-all");
  const collapseAllButton = document.querySelector(".tres-collapse-all");

  testSuiteRows.forEach((row, suiteIndex) => {
    const describeBlockContainer = document.getElementById(
      `tres-describe-block-details-${suiteIndex}`,
    );

    const testSuite = testResults[suiteIndex];

    const suiteTitleEl = row.querySelector(".tres-suite-title");
    const passedCountEl = row.querySelectorAll(".tres-suite-status-count")[0];
    const skippedCountEl = row.querySelectorAll(".tres-suite-status-count")[1];
    const failedCountEl = row.querySelectorAll(".tres-suite-status-count")[2];

    suiteTitleEl.textContent = testSuite.fileName;
    passedCountEl.textContent = testSuite.passedCount;
    skippedCountEl.textContent = testSuite.skippedCount;
    failedCountEl.textContent = testSuite.failedCount;

    // Update classes based on counts
    updateClassBasedOnCount(passedCountEl, testSuite.passedCount, "passed");
    updateClassBasedOnCount(skippedCountEl, testSuite.skippedCount, "pending");
    updateClassBasedOnCount(failedCountEl, testSuite.failedCount, "failed");

    Object.keys(testSuite.groupedTests).forEach((describeBlock, index) => {
      const tests = testSuite.groupedTests[describeBlock];

      const describeBlockRow = describeBlockContainer.querySelectorAll(
        ".tres-describe-block-row",
      )[index];

      const describeBlockTitle = describeBlockRow.querySelector(
        ".tres-describe-block-row-title",
      );
      describeBlockTitle.textContent = describeBlock;

      let passedCount = 0;
      let skippedCount = 0;
      let failedCount = 0;

      tests.forEach((test) => {
        if (test.testStatus === "passed") passedCount++;
        if (test.testStatus === "pending") skippedCount++;
        if (test.testStatus === "failed") failedCount++;
      });

      const passedCountEl = describeBlockRow.querySelector(
        ".tres-describe-block-status-count:nth-child(2)",
      );
      const skippedCountEl = describeBlockRow.querySelector(
        ".tres-describe-block-status-count:nth-child(3)",
      );
      const failedCountEl = describeBlockRow.querySelector(
        ".tres-describe-block-status-count:nth-child(4)",
      );

      passedCountEl.textContent = `${passedCount}`;
      skippedCountEl.textContent = `${skippedCount}`;
      failedCountEl.textContent = `${failedCount}`;

      updateClassBasedOnCount(passedCountEl, passedCount, "passed");
      updateClassBasedOnCount(skippedCountEl, skippedCount, "pending");
      updateClassBasedOnCount(failedCountEl, failedCount, "failed");
    });

    //Assign click listener
    row.addEventListener("click", function (event) {
      if (event.target.closest(".tres-item-row")) {
        return;
      }

      const suiteIndex = this.getAttribute("data-index");
      const details = document.getElementById(
        `tres-describe-block-details-${suiteIndex}`,
      );
      if (details.style.display === "none" || details.style.display === "") {
        details.style.display = "grid";
      } else {
        details.style.display = "none";
      }
    });
  });

  // Expand all rows
  expandAllButton.addEventListener("click", () => {
    testSuiteRows.forEach((row) => {
      const suiteIndex = row.getAttribute("data-index");
      const details = document.getElementById(
        `tres-describe-block-details-${suiteIndex}`,
      );
      details.style.display = "grid"; // Show all rows
    });
  });
  // Collapse all rows
  collapseAllButton.addEventListener("click", () => {
    testSuiteRows.forEach((row) => {
      const suiteIndex = row.getAttribute("data-index");
      const details = document.getElementById(
        `tres-describe-block-details-${suiteIndex}`,
      );
      details.style.display = "none"; // Hide all rows
    });
  });
});

function updateClassBasedOnCount(element, count, className) {
  if (count >= 1) {
    element.classList.add(className);
  } else {
    element.classList.remove(className);
  }
}
