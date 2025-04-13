document.addEventListener("DOMContentLoaded", function () {
    // 1. Grab the global tooltip DOM element
    const globalTooltip = document.getElementById("global-tooltip");

    // 2. Grab all the file name elements
    //    (the ones that have data-tooltip with the full name)
    const fileNameElements = document.querySelectorAll(".sscov-file-name");

    console.log("globalto = " + globalTooltip);
    console.log("filename = " + fileNameElements);
    // Helper function to position & show the tooltip
    function showTooltip(event) {
        const text = event.target.getAttribute("data-tooltip");
        console.log("no text? = " + text)
        if (!text) return;

        // Update tooltip text
        globalTooltip.textContent = text;

        // Compute position: to the bottom or top, your preference
        const rect = event.target.getBoundingClientRect();
        const scrollY = window.scrollY || window.pageYOffset;
        const scrollX = window.scrollX || window.pageXOffset;

        // Example: position tooltip slightly below the hovered element
        globalTooltip.style.left = rect.left + scrollX + "px";
        globalTooltip.style.top = rect.bottom + scrollY + 5 + "px"; // +5 for a little spacing

        // Show the tooltip
        globalTooltip.style.opacity = 1;
        globalTooltip.style.visibility = "visible";
    }

    // Helper function to hide
    function hideTooltip() {
        globalTooltip.style.opacity = 0;
        globalTooltip.style.visibility = "hidden";
    }

    // 3. Attach event listeners to each fileName element
    fileNameElements.forEach((elem) => {
        elem.addEventListener("mouseenter", showTooltip);
        elem.addEventListener("mouseleave", hideTooltip);
    });
});
