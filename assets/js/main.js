document.addEventListener("DOMContentLoaded", function () {
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

  // Scroll event: fade navbar in/out
  let lastScrollTop = 0;
  const navbar = document.querySelector('.navbar');

  if (navbar) {
    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      if (scrollTop > lastScrollTop) {
        // Scrolling down
        navbar.style.opacity = '0';
        navbar.style.transition = 'opacity 0.3s ease';
      } else {
        // Scrolling up
        navbar.style.opacity = '1';
        navbar.style.transition = 'opacity 0.3s ease';
      }
      lastScrollTop = Math.max(scrollTop, 0);
    }, false);
  }
});