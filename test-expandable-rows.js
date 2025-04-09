document.addEventListener("DOMContentLoaded", function () {
  const testSuiteRows = document.querySelectorAll(".tres-suite-row");

  const testResultsDiv = document.querySelector("[data-test-results]");
  const dataTestResults = testResultsDiv.getAttribute("data-test-results");
  const decodedDataTestResults = dataTestResults.replace(/&quot;/g, '"');

  const testResults = JSON.parse(decodedDataTestResults);

  const expandAllButton = document.querySelector(".tres-expand-all");
  const collapseAllButton = document.querySelector(".tres-collapse-all");

  // Original population and event assignments
  testSuiteRows.forEach((row, suiteIndex) => {
    const describeBlockContainer = document.getElementById(
        `tres-describe-block-details-${suiteIndex}`
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

    updateClassBasedOnCount(passedCountEl, testSuite.passedCount, "passed");
    updateClassBasedOnCount(skippedCountEl, testSuite.skippedCount, "pending");
    updateClassBasedOnCount(failedCountEl, testSuite.failedCount, "failed");

    Object.keys(testSuite.groupedTests).forEach((describeBlock, index) => {
      const tests = testSuite.groupedTests[describeBlock];
      const describeBlockRow = describeBlockContainer.querySelectorAll(
          ".tres-describe-block-row"
      )[index];

      const describeBlockTitle = describeBlockRow.querySelector(
          ".tres-describe-block-row-title"
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

      const passedCountEl2 = describeBlockRow.querySelector(
          ".tres-describe-block-status-count:nth-child(2)"
      );
      const skippedCountEl2 = describeBlockRow.querySelector(
          ".tres-describe-block-status-count:nth-child(3)"
      );
      const failedCountEl2 = describeBlockRow.querySelector(
          ".tres-describe-block-status-count:nth-child(4)"
      );

      passedCountEl2.textContent = String(passedCount);
      skippedCountEl2.textContent = String(skippedCount);
      failedCountEl2.textContent = String(failedCount);

      updateClassBasedOnCount(passedCountEl2, passedCount, "passed");
      updateClassBasedOnCount(skippedCountEl2, skippedCount, "pending");
      updateClassBasedOnCount(failedCountEl2, failedCount, "failed");
    });

    row.addEventListener("click", function (event) {
      if (event.target.closest(".tres-item-row")) return;
      const suiteIndex = this.getAttribute("data-index");
      const details = document.getElementById(
          `tres-describe-block-details-${suiteIndex}`
      );
      if (details.style.display === "none" || details.style.display === "") {
        details.style.display = "grid";
      } else {
        details.style.display = "none";
      }
    });
  });

  expandAllButton.addEventListener("click", () => {
    testSuiteRows.forEach((row) => {
      const suiteIndex = row.getAttribute("data-index");
      const details = document.getElementById(
          `tres-describe-block-details-${suiteIndex}`
      );
      details.style.display = "grid";
    });
  });
  collapseAllButton.addEventListener("click", () => {
    testSuiteRows.forEach((row) => {
      const suiteIndex = row.getAttribute("data-index");
      const details = document.getElementById(
          `tres-describe-block-details-${suiteIndex}`
      );
      details.style.display = "none";
    });
  });

  // Sorting logic below

  const rowArray = Array.from(testSuiteRows);
  const suiteIndexToBlock = {};
  rowArray.forEach((row) => {
    const sIndex = row.getAttribute("data-index");
    suiteIndexToBlock[sIndex] = document.getElementById(
        `tres-describe-block-details-${sIndex}`
    );
  });

  const tresGrid = document.querySelector(".tres-grid");

  function reAppendInOrder() {
    rowArray.forEach((row) => {
      tresGrid.appendChild(row);
      const idx = row.getAttribute("data-index");
      const block = suiteIndexToBlock[idx];
      if (block) {
        tresGrid.appendChild(block);
      }
    });
  }

  // Helper for repeated patterns
  function createSortHandler(directionVar, getValueFn, headerElement, isTitle) {
    // directionVar is an object with { value: 1 } or something similar, or just a numeric variable in closure
    headerElement.addEventListener("click", function () {
      // Flip direction
      directionVar.value *= -1;

      // Sort rowArray
      rowArray.sort((rowA, rowB) => {
        const idxA = rowA.getAttribute("data-index");
        const idxB = rowB.getAttribute("data-index");
        const valA = getValueFn(idxA);
        const valB = getValueFn(idxB);
        if (!isTitle) {
          return (valA - valB) * directionVar.value;
        } else {
          return (valB - valA) * directionVar.value;
        }
      });

      reAppendInOrder();

      // Clear flips from all icons
      document.querySelectorAll(".tres-header-status-icon").forEach((icon) => {
        icon.classList.remove("sort-asc", "sort-desc");
      });

      // Locate icon for this column, apply asc/desc
      const icon = headerElement.querySelector(".tres-header-status-icon");
      if (!icon) return;
      if (directionVar.value === 1) {
        icon.classList.add("sort-asc");
      } else {
        icon.classList.add("sort-desc");
      }
    });
  }

  // Track direction variables in simple objects so each reference is consistent
  const dirTitle = { value: 1 };
  const dirPassed = { value: 1 };
  const dirPending = { value: 1 };
  const dirFailed = { value: 1 };

  const headerTitle = document.querySelector(".tres-header-title-container");
  const headerPassed = document.querySelectorAll(".tres-header-status-container")[0];
  const headerPending = document.querySelectorAll(".tres-header-status-container")[1];
  const headerFailed = document.querySelectorAll(".tres-header-status-container")[2];

  // Title
  createSortHandler(dirTitle, (idx) => {
    return testResults[idx].fileName.toLowerCase().charCodeAt(0);
    // or a more direct compare in .sort() if desired
  }, headerTitle, true);

  // Passed
  createSortHandler(dirPassed, (idx) => testResults[idx].passedCount, headerPassed, false);

  // Pending
  createSortHandler(dirPending, (idx) => testResults[idx].skippedCount, headerPending, false);

  // Failed
  createSortHandler(dirFailed, (idx) => testResults[idx].failedCount, headerFailed, false);
});

function updateClassBasedOnCount(element, count, className) {
  if (count >= 1) {
    element.classList.add(className);
  } else {
    element.classList.remove(className);
  }
}
