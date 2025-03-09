document.addEventListener("DOMContentLoaded", function () {
  const testItemRows = document.querySelectorAll(".tres-item-row");
  const popup = document.getElementById("tres-popup");
  const codeElement = document.getElementById("tres-code");
  const resultElement = document.getElementById("tres-result");
  const errorMessageElement = document.getElementById("tres-error-message");
  const testSuiteElement = document.getElementById("tres-suite-name");
  const describeBlockElement = document.getElementById(
    "tres-describe-block-name",
  );
  const closePopupBtn = document.querySelector(".tres-close-popup");

  testItemRows.forEach((row) => {
    row.addEventListener("click", function (event) {
      event.stopPropagation();

      const testCode = this.getAttribute("data-test-code");
      const testResult = this.getAttribute("data-test-result");
      let testError = this.getAttribute("data-test-error");
      const testSuiteName = this.getAttribute("data-test-suite");
      const describeBlockName = this.getAttribute("data-describe-block");

      testError = interpretAnsiCodes(testError);

      testSuiteElement.textContent = `Test Suite: ${testSuiteName}`;
      describeBlockElement.textContent = `Describe Block: ${describeBlockName}`;

      resultElement.classList.remove(
        "test-passed",
        "test-pending",
        "test-failed",
      );

      codeElement.textContent = testCode;

      if (testResult === "failed") {
        resultElement.classList.add("test-failed");
        resultElement.textContent = "Failed";
        errorMessageElement.style.display = "block";
        errorMessageElement.innerHTML = interpretAnsiCodes(testError);
      } else if (testResult === "pending") {
        resultElement.classList.add("test-pending");
        resultElement.textContent = "Pending";
        errorMessageElement.textContent = "";
        errorMessageElement.style.display = "none";
      } else if (testResult === "passed") {
        resultElement.classList.add("test-passed");
        resultElement.textContent = "Passed";
        errorMessageElement.textContent = "";
        errorMessageElement.style.display = "none";
      }
      popup.style.display = "flex";
    });
  });

  /* eslint-disable no-control-regex */
  function interpretAnsiCodes(text) {
    const ansiToHtmlMap = {
      //received
      "\u001b[31m": "<span style='color: red;'>",
      //expected
      "\u001b[32m": "<span style='color: green;'>",
      //warnings
      "\u001b[33m": "<span style='color: yellow;'>",
      //additional info
      "\u001b[34m": "<span style='color: blue;'>",
      //Reset color
      "\u001b[39m": "</span>",
      //Bold
      "\u001b[1m": "<strong>",
      //Reset bold
      "\u001b[22m": "</strong>",
      //Reset all styles
      "\u001b[0m": "</span>",
    };

    //Replace ANSI codes with corresponding HTML
    let htmlFormattedText = text.replace(
      /\u001b\[[0-9;]*m/g,
      (ansiCode) => ansiToHtmlMap[ansiCode] || "",
    );

    //Fix mismatched or extra closing tags
    htmlFormattedText = htmlFormattedText.replace(
      /<\/strong><\/strong>/g,
      "</strong>",
    );
    //Fix double closing <strong>
    htmlFormattedText = htmlFormattedText.replace(
      /<\/span><\/span>/g,
      "</span>",
    );
    //Fix double closing <span>

    //Ensure no unclosed tags remain (by adding necessary closings at end)
    if (htmlFormattedText.match(/<span[^>]*>[^<]*$/)) {
      htmlFormattedText += "</span>";
    }
    if (htmlFormattedText.match(/<strong>[^<]*$/)) {
      htmlFormattedText += "</strong>";
    }

    return htmlFormattedText;
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
