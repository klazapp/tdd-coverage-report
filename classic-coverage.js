document.addEventListener("DOMContentLoaded", function () {
    const classicCoverageLink = document.querySelector(".navbar-classic");
    if (classicCoverageLink) {
        classicCoverageLink.addEventListener("click", function (event) {
            event.preventDefault();
            window.open("coverage/lcov-report/index.html", "_blank");
        });
    }
});
