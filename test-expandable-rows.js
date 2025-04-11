/* ---------- LocalStorage Helpers ---------- */

// 1) Loads from localStorage, returns e.g. ["passed","failed"] or []
function loadFilterState() {
  const stored = localStorage.getItem("myFilterStatus");
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
}

// 2) Saves an array of statuses (e.g. ["passed","failed"]) to localStorage
function saveFilterState(selectedArray) {
  localStorage.setItem("myFilterStatus", JSON.stringify(selectedArray));
}

/* ---------- Main script ---------- */
document.addEventListener("DOMContentLoaded", function () {
  const testSuiteRows = document.querySelectorAll(".tres-suite-row");
  const testResultsDiv = document.querySelector("[data-test-results]");
  const dataTestResults = testResultsDiv.getAttribute("data-test-results");
  const decodedDataTestResults = dataTestResults.replace(/&quot;/g, '"');
  const testResults = JSON.parse(decodedDataTestResults);

  const expandAllButton = document.querySelector(".tres-expand-all");
  const collapseAllButton = document.querySelector(".tres-collapse-all");

  // ---------- Original population ----------
  testSuiteRows.forEach((row, suiteIndex) => {
    const describeBlockContainer = document.getElementById(
        `tres-describe-block-details-${suiteIndex}`
    );
    const suiteData = testResults[suiteIndex];

    // fill top-level suite info
    const suiteTitleEl = row.querySelector(".tres-suite-title");
    const [passedCountEl, skippedCountEl, failedCountEl] =
        row.querySelectorAll(".tres-suite-status-count");

    suiteTitleEl.textContent = suiteData.fileName;
    passedCountEl.textContent = suiteData.passedCount;
    skippedCountEl.textContent = suiteData.skippedCount;
    failedCountEl.textContent = suiteData.failedCount;

    updateClassBasedOnCount(passedCountEl, suiteData.passedCount, "passed");
    updateClassBasedOnCount(skippedCountEl, suiteData.skippedCount, "pending");
    updateClassBasedOnCount(failedCountEl, suiteData.failedCount, "failed");

    // fill each describe-block row
    Object.keys(suiteData.groupedTests).forEach((describeBlock, index) => {
      const tests = suiteData.groupedTests[describeBlock];
      const describeBlockRow = describeBlockContainer.querySelectorAll(
          ".tres-describe-block-row"
      )[index];

      const describeBlockTitleEl = describeBlockRow.querySelector(
          ".tres-describe-block-row-title"
      );
      describeBlockTitleEl.textContent = describeBlock;

      let passedCount = 0, skippedCount = 0, failedCount = 0;
      tests.forEach((test) => {
        if (test.testStatus === "passed") passedCount++;
        if (test.testStatus === "pending") skippedCount++;
        if (test.testStatus === "failed") failedCount++;
      });

      // update describe-block row counts
      const [p2, s2, f2] = describeBlockRow.querySelectorAll(
          ".tres-describe-block-status-count"
      );
      p2.textContent = passedCount;
      s2.textContent = skippedCount;
      f2.textContent = failedCount;

      updateClassBasedOnCount(p2, passedCount, "passed");
      updateClassBasedOnCount(s2, skippedCount, "pending");
      updateClassBasedOnCount(f2, failedCount, "failed");
    });

    // expand/collapse on click
    row.addEventListener("click", function (event) {
      if (event.target.closest(".tres-item-row")) return;
      const suiteIdx = this.getAttribute("data-index");
      const details = document.getElementById(`tres-describe-block-details-${suiteIdx}`);
      details.style.display =
          (details.style.display === "none" || details.style.display === "")
              ? "grid"
              : "none";
    });
  });

  // ---------- Expand/Collapse all ----------
  expandAllButton.addEventListener("click", () => {
    testSuiteRows.forEach((row) => {
      const suiteIndex = row.getAttribute("data-index");
      const details = document.getElementById(`tres-describe-block-details-${suiteIndex}`);
      details.style.display = "grid";
    });
  });
  collapseAllButton.addEventListener("click", () => {
    testSuiteRows.forEach((row) => {
      const suiteIndex = row.getAttribute("data-index");
      const details = document.getElementById(`tres-describe-block-details-${suiteIndex}`);
      details.style.display = "none";
    });
  });

  // ---------- Sorting ----------
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

  function createSortHandler(directionVar, getValueFn, headerElement, isTitle) {
    headerElement.addEventListener("click", function () {
      directionVar.value *= -1;
      rowArray.sort((rowA, rowB) => {
        const idxA = rowA.getAttribute("data-index");
        const idxB = rowB.getAttribute("data-index");
        const valA = getValueFn(idxA);
        const valB = getValueFn(idxB);
        return isTitle
            ? (valB - valA) * directionVar.value
            : (valA - valB) * directionVar.value;
      });
      reAppendInOrder();

      // Clear icons
      document.querySelectorAll(".tres-header-status-icon").forEach((icon) => {
        icon.classList.remove("sort-asc", "sort-desc");
      });

      // Mark the current column icon
      const icon = headerElement.querySelector(".tres-header-status-icon");
      if (!icon) return;
      icon.classList.add(directionVar.value === 1 ? "sort-asc" : "sort-desc");
    });
  }

  const dirTitle = { value: 1 };
  const dirPassed = { value: 1 };
  const dirPending = { value: 1 };
  const dirFailed = { value: 1 };

  const headerTitle = document.querySelector(".tres-header-title-container");
  const headerPassed = document.querySelectorAll(".tres-header-status-container")[0];
  const headerPending = document.querySelectorAll(".tres-header-status-container")[1];
  const headerFailed = document.querySelectorAll(".tres-header-status-container")[2];

  createSortHandler(dirTitle, (idx) => (
      testResults[idx].fileName.toLowerCase().charCodeAt(0)
  ), headerTitle, true);

  createSortHandler(dirPassed, (idx) => testResults[idx].passedCount, headerPassed, false);
  createSortHandler(dirPending, (idx) => testResults[idx].skippedCount, headerPending, false);
  createSortHandler(dirFailed,  (idx) => testResults[idx].failedCount,  headerFailed,  false);

  // ---------- Dropdown Filter with localStorage ----------

  const statusToggle = document.getElementById("statusToggle");
  const statusMenu = document.getElementById("statusMenu");
  const clearAllBtn = document.getElementById("clearAllBtn");
  const selectAllBtn = document.getElementById("selectAllBtn");
  const checkboxes = document.querySelectorAll(".tres-filter-status-checkbox");
  const statusCountEl = document.getElementById("statusCount");
  const arrow = document.getElementById("dropdownArrow");

  // 1) At startup, load any saved filter states from localStorage, check them, then run filter
  const saved = loadFilterState(); // e.g. ["passed","failed"]
  checkboxes.forEach(chk => {
    if (saved.includes(chk.value)) {
      chk.checked = true;
    }
  });
  // Now update the badge count and do initial filter
  updateLabel();
  filterRows();

  // 2) When toggling, keep the dropdown open (unless user clicks outside)
  statusToggle.addEventListener("click", function (e) {
    e.stopPropagation();
    statusMenu.classList.toggle("show");
    arrow.classList.toggle("rotate");
  });

  // close if user clicks outside the menu
  document.addEventListener("click", function (evt) {
    if (!statusMenu.contains(evt.target) && !statusToggle.contains(evt.target)) {
      statusMenu.classList.remove("show");
      arrow.classList.remove("rotate");
    }
  });

  // 3) On each checkbox, update label, filter, and store
  checkboxes.forEach((chk) => {
    chk.addEventListener("change", () => {
      updateLabel();
      filterRows();
      persistFilterSelections();
    });
  });

  // 4) On “Clear All”
  clearAllBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    checkboxes.forEach((chk) => (chk.checked = false));
    updateLabel();
    filterRows();
    persistFilterSelections();
  });

  // 5) On “Select All”
  selectAllBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    checkboxes.forEach((chk) => (chk.checked = true));
    updateLabel();
    filterRows();
    persistFilterSelections();
  });

  // Helper to update the numeric badge
  function updateLabel() {
    let count = 0;
    checkboxes.forEach(chk => {
      if (chk.checked) count++;
    });
    statusCountEl.textContent = count;
  }

  // Save the current set of checked statuses to localStorage
  function persistFilterSelections() {
    const selected = [];
    checkboxes.forEach(chk => {
      if (chk.checked) selected.push(chk.value);
    });
    saveFilterState(selected);
  }

  // The main filter logic
  function filterRows() {
    const selected = new Set();
    checkboxes.forEach(chk => {
      if (chk.checked) selected.add(chk.value); // e.g. 'passed','pending','failed'
    });

    if (selected.size === 0) {
      restoreEverything();
      return;
    }

    // Filter each suite
    testSuiteRows.forEach(row => {
      const idx = parseInt(row.getAttribute("data-index"), 10);
      const block = suiteIndexToBlock[idx];
      if (!block) return;

      let visiblePassed = 0, visiblePending = 0, visibleFailed = 0, totalVisibleItems = 0;

      // per-item filter
      const itemRows = block.querySelectorAll(".tres-item-row");
      itemRows.forEach(item => {
        const itemStatus = item.getAttribute("data-test-result");
        if (selected.has(itemStatus)) {
          item.style.display = "";
          totalVisibleItems++;
          if (itemStatus === "passed")  visiblePassed++;
          if (itemStatus === "pending") visiblePending++;
          if (itemStatus === "failed")  visibleFailed++;
        } else {
          item.style.display = "none";
        }
      });

      // per-describe-block filtering
      const describeRows = block.querySelectorAll(".tres-describe-block-row");
      describeRows.forEach(dRow => {
        const blockTitleEl = dRow.querySelector(".tres-describe-block-row-title");
        const blockTitle = blockTitleEl ? blockTitleEl.textContent : "";
        let blkPassed = 0, blkPending = 0, blkFailed = 0;

        itemRows.forEach(iRow => {
          if (
              iRow.getAttribute("data-describe-block") === blockTitle &&
              iRow.style.display !== "none"
          ) {
            const iStatus = iRow.getAttribute("data-test-result");
            if (iStatus === "passed")  blkPassed++;
            if (iStatus === "pending") blkPending++;
            if (iStatus === "failed")  blkFailed++;
          }
        });
        const blockCounts = dRow.querySelectorAll(".tres-describe-block-status-count");
        if (blockCounts.length === 3) {
          blockCounts[0].textContent = blkPassed;
          blockCounts[1].textContent = blkPending;
          blockCounts[2].textContent = blkFailed;
          updateClassBasedOnCount(blockCounts[0], blkPassed, "passed");
          updateClassBasedOnCount(blockCounts[1], blkPending, "pending");
          updateClassBasedOnCount(blockCounts[2], blkFailed, "failed");
        }
        const totalBlockItems = blkPassed + blkPending + blkFailed;
        dRow.style.display = (totalBlockItems === 0) ? "none" : "";
      });

      // If no items remain, hide entire suite
      if (totalVisibleItems === 0) {
        row.style.display = "none";
        block.style.display = "none";
      } else {
        // show the suite
        row.style.display = "";
        block.style.display = "";
        // update top-level suite counts
        const [passedEl, pendingEl, failedEl] = row.querySelectorAll(".tres-suite-status-count");
        passedEl.textContent  = visiblePassed;
        pendingEl.textContent = visiblePending;
        failedEl.textContent  = visibleFailed;
        updateClassBasedOnCount(passedEl,  visiblePassed,  "passed");
        updateClassBasedOnCount(pendingEl, visiblePending, "pending");
        updateClassBasedOnCount(failedEl,  visibleFailed,  "failed");
      }
    });
  }

  // Show everything again, restoring original counts
  function restoreEverything() {
    testSuiteRows.forEach(row => {
      row.style.display = "";
      const idx = row.getAttribute("data-index");
      const block = suiteIndexToBlock[idx];
      if (!block) return;
      block.style.display = "";
      // Show all items
      const itemRows = block.querySelectorAll(".tres-item-row");
      itemRows.forEach(item => { item.style.display = ""; });
      // Show all describe-block rows
      const describeRows = block.querySelectorAll(".tres-describe-block-row");
      describeRows.forEach(dRow => { dRow.style.display = ""; });
      // Restore suite counts
      const suiteData = testResults[idx];
      const [passedEl, pendingEl, failedEl] = row.querySelectorAll(".tres-suite-status-count");
      passedEl.textContent  = suiteData.passedCount;
      pendingEl.textContent = suiteData.skippedCount;
      failedEl.textContent  = suiteData.failedCount;
      updateClassBasedOnCount(passedEl,  suiteData.passedCount,    "passed");
      updateClassBasedOnCount(pendingEl, suiteData.skippedCount,   "pending");
      updateClassBasedOnCount(failedEl,  suiteData.failedCount,    "failed");
    });
  }
});

/* Utility function */
function updateClassBasedOnCount(element, count, className) {
  if (count >= 1) {
    element.classList.add(className);
  } else {
    element.classList.remove(className);
  }
}
