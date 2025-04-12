document.addEventListener("DOMContentLoaded", function () {
  document.addEventListener("testExpandableFilterChanged", function (e) {
    const newStatuses = e.detail.statusArray || [];

    // Clear out existing statuses, then add the incoming ones.
    activeStatuses.clear();
    newStatuses.forEach(st => activeStatuses.add(st));

    // Re-highlight cards based on the new statuses
    updateCardHighlights();
  });

  // 1) Map each bento-item class to statuses toggled
  const cardStatusMap = {
    f: ["passed", "pending", "failed"],
    g: ["passed", "pending", "failed"],
    h: ["passed"],
    i: ["passed"],
    j: ["pending"],
    k: ["pending"],
    l: ["failed"],
    m: ["failed"],
  };

  // 2) Keep track of selected statuses
  let activeStatuses = new Set();

  /**
   * Load saved statuses from localStorage
   */
  function loadFilterState() {
    try {
      const stored = localStorage.getItem("myFilterStatus");
      if (!stored) return [];
      return JSON.parse(stored);
    } catch (e) {
      return [];
    }
  }

  /**
   * Toggle all three statuses (passed, pending, failed).
   * If all are currently active, remove them. Otherwise, add them.
   */
  function toggleAll() {
    const needed = ["passed", "pending", "failed"];
    const allPresent = needed.every((st) => activeStatuses.has(st));
    if (allPresent) {
      needed.forEach((st) => activeStatuses.delete(st));
    } else {
      needed.forEach((st) => activeStatuses.add(st));
    }
  }

  /**
   * Toggle an array of statuses. If a status is in activeStatuses, remove it.
   * Otherwise, add it.
   */
  function toggleStatuses(statuses) {
    statuses.forEach((st) => {
      if (activeStatuses.has(st)) {
        activeStatuses.delete(st);
      } else {
        activeStatuses.add(st);
      }
    });
  }

  /**
   * Update card highlighting (.bento-active):
   * f/g highlight if passed, pending, failed are all active
   * h/i highlight if passed is active
   * j/k highlight if pending is active
   * l/m highlight if failed is active
   */
  function updateCardHighlights() {
    document.querySelectorAll(".bento-item").forEach((c) => {
      let neededStatuses = [];
      for (let cls in cardStatusMap) {
        if (c.classList.contains(cls)) {
          neededStatuses = neededStatuses.concat(cardStatusMap[cls]);
        }
      }
      const allOn = neededStatuses.every((st) => activeStatuses.has(st));
      if (allOn && neededStatuses.length > 0) {
        c.classList.add("bento-active");
      } else {
        c.classList.remove("bento-active");
      }
    });
  }

  /**
   * Dispatch the current set of statuses to "test-expandable-rows.js",
   * which listens for 'setFilterStatus'.
   */
  function dispatchFilterEvent() {
    const statusArray = Array.from(activeStatuses);
    document.dispatchEvent(
        new CustomEvent("setFilterStatus", {
          detail: { statusArray },
        })
    );
  }

  // 3) Before building cards, load any saved statuses into activeStatuses
  const saved = loadFilterState(); // e.g. ["passed","failed"]
  saved.forEach((st) => activeStatuses.add(st));

  // 4) Build the bento cards
  document.querySelectorAll(".bento-item").forEach(function (card) {
    const content = card.querySelector(".bento-content");
    if (!content) return;

    // Gather data attributes
    const title = card.getAttribute("data-title");
    const description = card.getAttribute("data-description");
    const percentage = parseFloat(card.getAttribute("data-percentage"));
    const status = card.getAttribute("data-status");
    const target = card.getAttribute("data-target");
    const number = card.getAttribute("data-number");
    const descriptionContainer = content.querySelector(".bento-description-container");

    let innerHTML = "";

    // If data-number exists, treat as plain numeric card
    if (number) {
      innerHTML += `<div class="bento-number">${number}</div>`;
      if (description && descriptionContainer) {
        descriptionContainer.innerHTML += `<p class="bento-description">${description}</p>`;
      }
    } else {
      // Otherwise, build a coverage-style card
      if (title) {
        innerHTML += `<h2 class="bento-title">${title}</h2>`;
      }
      if (description) {
        innerHTML += `<p class="bento-description">${description}</p>`;
      }
      if (!isNaN(percentage)) {
        const dashArray = 160;
        const percentageDashOffset = dashArray - (percentage / 100) * dashArray;
        const radius = 50;
        const targetValue = !isNaN(target) ? target : 100;
        const angle = (targetValue / 100) * Math.PI;
        const targetX = 60 + radius * Math.cos(Math.PI - angle);
        const targetY = 60 - radius * Math.sin(Math.PI - angle);

        innerHTML += `
          <div class="bento-svg-container">
            <svg class="bento-progress-circle" viewBox="0 0 120 70">
              <path class="bento-track" d="M 10,60 A 50,50 0 0 1 110,60" />
              <path class="bento-progress" d="M 10,60 A 50,50 0 0 1 110,60"
                    style="stroke-dashoffset: ${percentageDashOffset}" />
              <text x="50%" y="50%" class="bento-current">${percentage}%</text>
            </svg>
            <div class="bento-target-container">
              <svg
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 512 512"
                class="bento-target-icon"
              >
                <g>
                  <path d="M256,0C114.509,0,0,114.496,0,256c0,141.489,114.496,256,256,256
                    c141.491,0,256-114.496,256-256C512,114.511,397.504,0,256,0z
                    M256,476.279 c-121.462,0-220.279-98.816-220.279-220.279
                    S134.538,35.721,256,35.721 S476.279,134.537,476.279,256
                    S377.462,476.279,256,476.279z"></path>
                </g>
                <g>
                  <path d="M256.006,213.397c-15.164,0-25.947,6.404-25.947,15.839v128.386
                    c0,8.088,10.783,16.174,25.947,16.174
                    c14.49,0,26.283-8.086,26.283-16.174
                    V229.234C282.289,219.8,270.496,213.397,256.006,213.397z"></path>
                </g>
                <g>
                  <path d="M256.006,134.208c-15.501,0-27.631,11.12-27.631,23.925c0,12.806
                    ,12.131,24.263,27.631,24.263c15.164,0,27.296-11.457,27.296-24.263
                    C283.302,145.328,271.169,134.208,256.006,134.208z"></path>
                </g>
              </svg>
              <p class="bento-target">${target}</p>
            </div>
          </div>
        `;
      }
      if (percentage) {
        innerHTML += `</div>`;
      }
      if (status) {
        innerHTML += `<div class="bento-status">${status}</div>`;
      }
    }

    content.insertAdjacentHTML("afterbegin", innerHTML);

    // Tilt effect
    card.addEventListener("mousemove", (e) => {
      const { width, height, left, top } = card.getBoundingClientRect();
      const x = e.clientX - left;
      const y = e.clientY - top;
      const rotateX = -(y / height - 0.5) * 10;
      const rotateY = -(x / width - 0.5) * -10;
      card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });

    // Click Handler
    let toggledStatuses = [];
    for (let cls in cardStatusMap) {
      if (card.classList.contains(cls)) {
        toggledStatuses = toggledStatuses.concat(cardStatusMap[cls]);
      }
    }
    if (!toggledStatuses.length) return;

    card.addEventListener("click", () => {
      if (card.classList.contains("f") || card.classList.contains("g")) {
        toggleAll();
      } else {
        toggleStatuses(toggledStatuses);
      }
      updateCardHighlights();
      dispatchFilterEvent();
    });
  });

  // 5) After building cards, highlight them according to loaded statuses
  updateCardHighlights();
  // Also dispatch so test-expandable-rows sees the same statuses at startup
  dispatchFilterEvent();
});
