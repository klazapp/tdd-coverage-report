let isScrolling = false;

function updateActiveLinkOnScroll() {
  if (isScrolling) return;

  const sections = document.querySelectorAll("section");
  const links = document.querySelectorAll(".navbar-right a");

  let scrollPosition = window.scrollY;

  sections.forEach((section, index) => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;

    if (
      scrollPosition >= sectionTop - 300 &&
      scrollPosition < sectionTop + Math.max(sectionHeight, 150)
    ) {
      links.forEach((link) => link.classList.remove("active"));
      links[index].classList.add("active");
    }
  });
}

window.addEventListener("scroll", updateActiveLinkOnScroll);

document.querySelectorAll(".navbar-right a").forEach((link) => {
  link.addEventListener("click", function (event) {
    // Skip preventDefault if external link
    const href = this.getAttribute("href");
    if (href.startsWith("http")) {
      return;
    }
    event.preventDefault();
    const targetId = this.getAttribute("href").substring(1);
    const targetSection = document.getElementById(targetId);

    const offset = 100;

    if (targetSection) {
      const sectionTop =
        targetSection.getBoundingClientRect().top + window.pageYOffset - offset;

      isScrolling = true;

      window.scrollTo({
        top: sectionTop,
        behavior: "smooth",
      });
    }

    document.querySelectorAll(".navbar-right a").forEach((link) => {
      link.classList.remove("active");
    });
    this.classList.add("active");

    setTimeout(() => {
      isScrolling = false;
    }, 800);
  });
});

window.addEventListener("DOMContentLoaded", () => {
  const firstLink = document.querySelector(".navbar-right a");
  if (firstLink) {
    firstLink.classList.add("active");
  }
});
