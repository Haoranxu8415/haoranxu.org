// Main JavaScript for handling page transitions, navbar behavior, and interactive navigation
document.addEventListener("DOMContentLoaded", function () {
  // Handle transition animation when "visit" button is clicked
  const visitButton = document.querySelector(".visit-button");

  if (visitButton) {
    visitButton.addEventListener("click", function (e) {
      e.preventDefault();

      // Add fade-out animation to body
      document.body.style.transition = "opacity 0.5s ease";
      document.body.style.opacity = 0;

      // After transition, navigate to home.html
      setTimeout(() => {
        window.location.href = "home.html";
      }, 500);
    });
  }

  // Intercept navigation links and store transition direction for animation
  const navLinks = document.querySelectorAll(".nav-links a");
  if (navLinks.length) {
    navLinks.forEach(link => {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        const currentPage = window.location.pathname.split("/").pop();
        const targetPage = this.getAttribute("href");

        const pageOrder = ["home.html", "projects.html", "blog.html", "contact.html"];
        const currentIndex = pageOrder.indexOf(currentPage);
        const targetIndex = pageOrder.indexOf(targetPage);

        // Record direction information to sessionStorage
        if (targetIndex > currentIndex) {
          sessionStorage.setItem("pageTransition", "slide-left");
        } else if (targetIndex < currentIndex) {
          sessionStorage.setItem("pageTransition", "slide-right");
        } else {
          sessionStorage.removeItem("pageTransition");
        }

        // Add fade out effect and redirect
        document.body.classList.add("fade-out");
        setTimeout(() => {
          window.location.href = targetPage;
        }, 300);
      });
    });
  }

  // Apply transition animation class on page load and remove it from sessionStorage
  const transitionClass = sessionStorage.getItem("pageTransition");
  if (transitionClass) {
    document.body.classList.add(transitionClass);
    sessionStorage.removeItem("pageTransition");
  }

  // Scroll navbar behavior
  let lastScrollTop = 0;
  const navbar = document.querySelector('nav.navbar');

  const scrollContainer = document.querySelector('.scrollable-content');

  if (navbar && scrollContainer) {
    scrollContainer.addEventListener('scroll', () => {
      const scrollTop = scrollContainer.scrollTop;

      if (scrollTop > lastScrollTop + 5) {
        // scroll down -> navbar disappear
        navbar.style.transform = 'translateY(-200%)';
      } else if (scrollTop < lastScrollTop - 5) {
        // scroll up -> navbar appear
        navbar.style.transform = 'translateY(0)';
      }

      lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // prevent negative values
    });
  }
});