document.addEventListener("DOMContentLoaded", function () {
  function showCoverageBanner(event) {
    const banner = document.getElementById("coverage-banner");
    const spanElement = event.target;

    const className = spanElement.className;
    banner.textContent = formatClassName(className);

    const rect = spanElement.getBoundingClientRect();
    banner.style.position = "absolute";
    banner.style.left = `${rect.left + window.scrollX + rect.width / 2}px`;
    banner.style.top = `${rect.top + window.scrollY - banner.offsetHeight + 20}px`;

    banner.classList.add("show");
  }

  function hideCoverageBanner() {
    const banner = document.getElementById("coverage-banner");
    banner.classList.remove("show");
  }

  function formatClassName(className) {
    return className
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  const spanClasses = [
    "statement-not-covered",
    "line-not-covered",
    "function-not-covered",
    "branch-not-covered",
    "if-path-not-taken",
    "else-path-not-taken",
    "path-not-taken",
  ];
  spanClasses.forEach((spanClass) => {
    const spans = document.querySelectorAll(`.${spanClass}`);

    spans.forEach((span) => {
      span.addEventListener("mouseenter", showCoverageBanner);
      span.addEventListener("mouseleave", hideCoverageBanner);
    });
  });
});
