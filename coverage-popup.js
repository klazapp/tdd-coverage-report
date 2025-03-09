document.addEventListener("DOMContentLoaded", function () {
  const sscovFileRows = document.querySelectorAll(".sscov-item-row");
  const popup = document.getElementById("sscov-popup");
  const codeElement = document.getElementById("sscov-code");
  const suiteElement = document.getElementById("sscov-suite-name");
  const closePopupBtn = document.querySelector(".sscov-close-popup");
  sscovFileRows.forEach((row) => {
    row.addEventListener("click", function (event) {
      event.stopPropagation();

      const suiteName = this.getAttribute("data-sscov-file-name");
      let testCode = this.getAttribute("data-sscov-file-content");

      testCode = sanitizeHTMLString(testCode);

      suiteElement.textContent = `${suiteName}`;
      codeElement.innerHTML = testCode;
      popup.style.display = "flex";
    });
  });

  /* eslint-disable no-control-regex */
  function sanitizeHTMLString(html) {
    // Remove <script> tags and their content
    html = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");

    // Remove <link> tags (like CSS files)
    html = html.replace(/<link[\s\S]*?>/gi, "");

    // Extract content inside the <body> tag
    const bodyContentMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyContent = bodyContentMatch ? bodyContentMatch[1] : "";

    // Create a temporary DOM element to manipulate the HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = bodyContent;

    // Find and fill summary values for statements, branches, functions, and lines
    const summaryElements = tempDiv.querySelectorAll(".clearfix .fl");
    const summaryData = []; // To hold summary data for multiple elements

    summaryElements.forEach((element) => {
      const percentage = element.querySelector(".strong").textContent.trim();
      const label = element.querySelector(".quiet").textContent.trim();
      const fraction = element.querySelector(".fraction").textContent.trim();

      // Push summary data into an array for later use
      summaryData.push({ label, percentage, fraction });
    });

    summaryData.forEach((item) => {
      const label = item.label.toLowerCase(); // Convert label to lowercase for easier matching

      // Find the correct group based on the label
      const group = document.querySelector(`.sscov-summary-group.${label}`);

      if (group) {
        group.querySelector(".sscov-summary-label").textContent =
          `${item.label}: `;
        group.querySelector(".sscov-summary-percentage").textContent =
          item.percentage;
        group.querySelector(".sscov-summary-fraction").textContent =
          `(${item.fraction})`;
      }
    });

    // Find the table and process its content
    const table = tempDiv.querySelector("table");
    let newTableContent = "";

    if (table) {
      const rows = table.querySelectorAll("tr");
      const firstColumnItems = [];
      const secondColumnItems = [];
      const thirdColumnItems = [];

      // Extract the items from the first, second, and third columns
      rows.forEach((row) => {
        const tds = row.querySelectorAll("td");

        if (tds.length === 3) {
          const firstColumnLinks = tds[0].querySelectorAll("a[href]");
          const secondColumnSpans = tds[1].querySelectorAll("span");

          // Add all links (for first column)
          firstColumnLinks.forEach((link) => {
            firstColumnItems.push(link.textContent.trim());
          });

          // Add all spans (for second column)
          secondColumnSpans.forEach((span) => {
            secondColumnItems.push(span.outerHTML);
          });

          const thirdColumnPre = tds[2].querySelector("pre"); // Third column <pre> element

          if (thirdColumnPre) {
            // Extract the content inside the <pre> tag and split by newline
            const lines = thirdColumnPre.innerHTML.split("\n");
            // Add each line as an item in the thirdColumnItems array without trimming
            lines.forEach((line) => {
              thirdColumnItems.push(line);
            });
          }
        }
      });

      // Find the maximum number of rows we need based on the first column
      const maxRows = firstColumnItems.length;

      // Construct the new table with exactly `maxRows` rows and 3 columns
      newTableContent = "<table>";

      for (let i = 0; i < maxRows; i++) {
        newTableContent += "<tr>";

        // First column: Use the numbers 1 to maxRows
        const firstColumnPrimaryClass = "line-number";
        newTableContent += `<td class ="${firstColumnPrimaryClass}">${i + 1}</td>`;

        // Second column: Check if the content contains &nbsp;
        const secondColumnContent = secondColumnItems[i] || "&nbsp;";
        const secondColumnPrimaryClass = "line-coverage-count";
        const secondColumnSecondaryClass = secondColumnContent.includes(
          "&nbsp;",
        )
          ? "empty-cell"
          : "filled-cell";

        newTableContent += `<td class="${secondColumnSecondaryClass} ${secondColumnPrimaryClass}" >${secondColumnContent}</td>`;

        // Third column: Fill with corresponding pre content
        const thirdColumnPrimaryClass = "script-code";

        let updatedItem = replaceSpanClassWithTitle(thirdColumnItems[i]);

        updatedItem = splitCodeAndComment(updatedItem);
        newTableContent += `<td class="${thirdColumnPrimaryClass}">${updatedItem || "&nbsp;"}</td>`;
        newTableContent += "</tr>";
      }

      newTableContent += "</table>";
    }
    return newTableContent;
  }

  function replaceSpanClassWithTitle(item) {
    // This regex will match span tags with a title attribute
    return item.replace(
      /<span class="([^"]*)" title="([^"]*)">/g,
      function (match, oldClass, title) {
        // Use the title attribute as the new class value
        let newClass = title.toLowerCase().replace(/\s+/g, "-"); // Convert title to a class-friendly format
        return `<span class="${newClass}">`; // Replace the class with the title
      },
    );
  }

  function splitCodeAndComment(item) {
    // Check if the item contains "//"
    if (item.includes("//")) {
      // Split the item into two parts: before and after the comment
      const [codeBefore, commentAfter] = item.split("//", 2);

      // Wrap each part in its own span, including the "//" in the second span
      return `<span>${codeBefore.trim()}</span><span class="commented-code">//${commentAfter.trim()}</span>`;
    }

    // If there's no comment, return the item unchanged
    return item;
  }
  /* eslint-enable no-control-regex */

  closePopupBtn.addEventListener("click", function () {
    popup.style.display = "none";
  });

  window.addEventListener("click", function (event) {
    if (event.target === popup) {
      popup.style.display = "none";
    }
  });
});
