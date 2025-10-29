// ===== Mobile Menu Toggle =====
console.log('🚀 Main.js loading...');

// 菜单初始化函数
function initializeMenu() {
  console.log('📱 Initializing menu...');
  
  // 使用 querySelector 而不是 getElementById
  const menuToggle = document.querySelector('.menu-toggle');
  const navWrapper = document.querySelector('.nav-wrapper');
  const navLinks = document.querySelectorAll('.nav-links a');
  
  console.log('Elements found:', {
    menuToggle: !!menuToggle,
    navWrapper: !!navWrapper,
    navLinks: navLinks.length
  });
  
  // 检查元素是否存在
  if (!menuToggle || !navWrapper) {
    console.error('❌ Menu elements not found');
    return;
  }
  
  console.log('✅ All elements found!');
  
  // 菜单切换函数
  function toggleMenu() {
    const isActive = menuToggle.classList.toggle('active');
    navWrapper.classList.toggle('active');
    
    console.log('Menu:', isActive ? 'OPEN ✅' : 'CLOSED ❌');
    
    // 防止背景滚动
    document.body.style.overflow = isActive ? 'hidden' : '';
  }
  
  function closeMenu() {
    menuToggle.classList.remove('active');
    navWrapper.classList.remove('active');
    document.body.style.overflow = '';
    console.log('Menu closed');
  }
  
  // 汉堡菜单点击事件
  menuToggle.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('🍔 Menu clicked!');
    toggleMenu();
  });
  
  // 点击导航链接后关闭菜单
  navLinks.forEach(link => {
    link.addEventListener('click', function() {
      if (window.innerWidth <= 768 && navWrapper.classList.contains('active')) {
        console.log('🔗 Link clicked, closing menu');
        closeMenu();
      }
    });
  });
  
  // 点击页面其他地方关闭菜单
  document.addEventListener('click', function(e) {
    if (window.innerWidth <= 768) {
      if (!navWrapper.contains(e.target) && !menuToggle.contains(e.target)) {
        if (navWrapper.classList.contains('active')) {
          console.log('👆 Outside click, closing menu');
          closeMenu();
        }
      }
    }
  });
  
  // ESC键关闭菜单
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && navWrapper.classList.contains('active')) {
      console.log('⌨️ ESC pressed, closing menu');
      closeMenu();
    }
  });
  
  // 窗口大小改变时重置
  let resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      if (window.innerWidth > 768 && navWrapper.classList.contains('active')) {
        console.log('📏 Resized > 768px, closing menu');
        closeMenu();
      }
    }, 250);
  });
  
  console.log('✅ Menu initialization complete!');
}

// 等待DOM加载完成后初始化菜单
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeMenu);
  console.log('⏳ Waiting for DOM...');
} else {
  // DOM already loaded
  initializeMenu();
  console.log('✅ DOM already loaded, initializing immediately');
}

// ===== Active Nav Link =====
document.addEventListener('DOMContentLoaded', function() {
  const currentPage = window.location.pathname.split('/').pop() || 'home.html';
  const navLinks = document.querySelectorAll('.nav-links a');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage) {
      link.classList.add('active');
      console.log('✅ Active link set:', href);
    }
  });
});

// ===== Smooth Scroll for Anchor Links =====
document.addEventListener('DOMContentLoaded', function() {
  const anchorLinks = document.querySelectorAll('a[href^="#"]');
  
  anchorLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 0;
        const targetPosition = targetElement.offsetTop - navbarHeight;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
});

// ===== Navbar Hide on Scroll (Optional) =====
let lastScroll = 0;

window.addEventListener('scroll', function() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  
  const currentScroll = window.pageYOffset;
  
  // 只在非首页且向下滚动超过导航栏高度时隐藏
  if (!document.body.classList.contains('index-page')) {
    if (currentScroll > lastScroll && currentScroll > 100) {
      navbar.classList.add('hidden');
    } else {
      navbar.classList.remove('hidden');
    }
  }
  
  lastScroll = currentScroll;
});

// ===== Page Transition Effect =====
document.addEventListener('DOMContentLoaded', function() {
  // 添加进入动画
  document.body.classList.add('fade-in');
  
  // 为所有内部链接添加退出动画
  const internalLinks = document.querySelectorAll('a:not([href^="http"]):not([href^="#"]):not([target="_blank"])');
  
  internalLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href && href !== '#' && !href.startsWith('mailto:')) {
        e.preventDefault();
        
        document.body.classList.remove('fade-in');
        document.body.classList.add('fade-out');
        
        setTimeout(() => {
          window.location.href = href;
        }, 400);
      }
    });
  });
});

// ===== Card Stagger Animation on Scroll =====
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.addEventListener('DOMContentLoaded', function() {
  const cards = document.querySelectorAll('.card, .frosted-block, .contact-block');
  cards.forEach(card => {
    observer.observe(card);
  });
});

// ===== Performance Optimization =====
// Debounce function for resize events
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function for scroll events
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

console.log('✅ Main.js loaded successfully');