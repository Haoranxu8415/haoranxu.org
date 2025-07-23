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
  const menuToggle = document.querySelector('.menu-toggle');
  const navWrapper = document.querySelector('.nav-wrapper');

  if (menuToggle && navWrapper) {
    menuToggle.addEventListener('click', () => {
      navWrapper.classList.toggle('open');
      menuToggle.classList.toggle('active');
    });
  }
  if (navLinks.length) {
    navLinks.forEach(link => {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        if (navWrapper.classList.contains('open')) {
          navWrapper.classList.remove('open');
          menuToggle.classList.remove('active');
        }
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

      if (document.body.classList.contains('other-page')) {
        if (scrollTop > lastScrollTop + 5) {
          navbar.classList.remove('fadeInUp');
          navbar.classList.add('fadeInDown');
          navbar.style.transform = 'translateY(-200%)';
        } else if (scrollTop < lastScrollTop - 5) {
          navbar.classList.remove('fadeInDown');
          navbar.classList.add('fadeInUp');
          navbar.style.transform = 'translateY(0)';
        }
      }
      lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // prevent negative values
    });
  }
});


    fetch('posts/post1.md')
      .then(response => response.text())
      .then(text => {
        document.getElementById('markdown-content').innerHTML = marked.parse(text);
        document.getElementById('timeline-entry-1').innerText = extractDate(text);
      });

    fetch('posts/post2.md')
      .then(response => response.text())
      .then(text => {
        document.getElementById('markdown-content-2').innerHTML = marked.parse(text);
        document.getElementById('timeline-entry-2').innerText = extractDate(text);
      });

    fetch('posts/post3.md')
      .then(response => response.text())
      .then(text => {
        document.getElementById('markdown-content-3').innerHTML = marked.parse(text);
        document.getElementById('timeline-entry-3').innerText = extractDate(text);
      });