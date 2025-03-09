document.addEventListener("DOMContentLoaded", function () {
    const floatingSaveBtn = document.querySelector(".floating-save-btn");
    const saveBasicBtn = document.querySelector(".save-basic");
    const saveComprehensiveBtn = document.querySelector(".save-comprehensive");
    const saveOptions = document.querySelectorAll(".save-option");

    let isHovering = false;

    // Function to show save options (fly up and curve left)
    function showSaveOptions() {
        saveBasicBtn.style.transform = "translateX(-30px) translateY(-40px) rotate(-10deg)"; // Curve left and up
        saveComprehensiveBtn.style.transform = "translateX(-60px) translateY(-125px) rotate(-15deg)"; // Curve left more and up higher
        saveOptions.forEach((btn) => {
            btn.style.opacity = "1"; // Make them visible
        });
        isHovering = true;
    }

    // Function to hide save options (fly back down in an arc)
    function hideSaveOptions() {
        if (!isHovering) {
            saveBasicBtn.style.transform = "translateX(0) translateY(0) rotate(0)"; // Fly back down
            saveComprehensiveBtn.style.transform = "translateX(0) translateY(0) rotate(0)"; // Fly back down
            saveOptions.forEach((btn) => {
                btn.style.opacity = "0"; // Hide after animation
            });
        }
    }

    // Mouse enters the floating button OR any of the small buttons
    floatingSaveBtn.addEventListener("mouseenter", () => {
        showSaveOptions();
    });

    saveOptions.forEach((btn) => {
        btn.addEventListener("mouseenter", () => {
            isHovering = true;
        });

        btn.addEventListener("mouseleave", () => {
            isHovering = false;
            setTimeout(hideSaveOptions, 200);
        });
    });

    floatingSaveBtn.addEventListener("mouseleave", () => {
        isHovering = false;
        setTimeout(hideSaveOptions, 200);
    });

    // Function to temporarily hide floating button
    function hideFloatingButton() {
        floatingSaveBtn.style.display = "none";
    }

    // Function to restore floating button
    function showFloatingButton() {
        setTimeout(() => {
            floatingSaveBtn.style.display = "flex"; // Restore after saving
        }, 500);
    }

    // Function to save as PDF
    function saveAsPdf() {
        hideFloatingButton(); // Hide floating button
        collapseAllSections();
        setTimeout(() => {
            window.print();
            showFloatingButton(); // Restore after print
        }, 300);
    }

    // Function to collapse all expanded test results
    function collapseAllSections() {
        document.querySelectorAll(".tres-describe-block").forEach((block) => {
            block.style.display = "none"; // Hide all expanded sections
        });
    }

    // Function to expand all test results before saving PDF
    function expandAndSaveAsPdf() {
        document.querySelectorAll(".tres-describe-block").forEach((block) => {
            block.style.display = "block";
        });

        hideFloatingButton(); // Hide floating button
        setTimeout(() => {
            window.print();
            showFloatingButton(); // Restore after print
        }, 500);
    }

    // Attach event listeners
    saveBasicBtn.addEventListener("click", saveAsPdf);
    saveComprehensiveBtn.addEventListener("click", expandAndSaveAsPdf);
});
