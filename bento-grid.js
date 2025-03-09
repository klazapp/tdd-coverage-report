document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".bento-item").forEach(function (card) {
    const content = card.querySelector(".bento-content");
    if (content) {
      const title = card.getAttribute("data-title");
      const description = card.getAttribute("data-description");
      const percentage = parseFloat(card.getAttribute("data-percentage"));
      const status = card.getAttribute("data-status");
      const target = card.getAttribute("data-target");
      const number = card.getAttribute("data-number");
      const descriptionContainer = content.querySelector(
        ".bento-description-container",
      );

      let innerHTML = "";

      if (number) {
        innerHTML += `<div class="bento-number">${number}</div>`;

        if (description && descriptionContainer) {
          descriptionContainer.innerHTML += `<p class="bento-description">${description}</p>`;
        }
      } else {
        if (title) {
          innerHTML += `<h2 class="bento-title">${title}</h2>`;
        }

        if (description) {
          innerHTML += `<p class="bento-description">${description}</p>`;
        }

        if (!isNaN(percentage)) {
          const dashArray = 160;
          const percentageDashOffset =
            dashArray - (percentage / 100) * dashArray;

          const radius = 50;
          const targetValue = !isNaN(target) ? target : 100; // Default to 100 if target is undefined
          const angle = (targetValue / 100) * Math.PI; // Convert target percentage to radians
          const targetX = 60 + radius * Math.cos(Math.PI - angle); // x position based on arc
          const targetY = 60 - radius * Math.sin(Math.PI - angle); // y position based on arc

          innerHTML += `
            <div class="bento-svg-container">
              <svg class="bento-progress-circle" viewBox="0 0 120 70">
                <path class="bento-track" d="M 10,60 A 50,50 0 0 1 110,60" />
                <path class="bento-progress" d="M 10,60 A 50,50 0 0 1 110,60" style="stroke-dashoffset: ${percentageDashOffset}" />
                <text x="50%" y="50%" class="bento-current">${percentage}%</text>
             
                <!-- <line x1="${targetX}" y1="${targetY}" x2="${targetX - 10}" y2="${targetY}" class="bento-target-line" /> -->
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
                  c141.491,0,256-114.496,256-256C512,114.511,397.504,0,256,0z M256,476.279
                  c-121.462,0-220.279-98.816-220.279-220.279S134.538,35.721,256,35.721
                  S476.279,134.537,476.279,256S377.462,476.279,256,476.279z"></path>
                </g>
                <g>
                  <path d="M256.006,213.397c-15.164,0-25.947,6.404-25.947,15.839v128.386
                  c0,8.088,10.783,16.174,25.947,16.174c14.49,0,26.283-8.086,26.283-16.174
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
    }
  });
});
