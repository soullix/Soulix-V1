// ===== GLOBAL VARIABLES =====
let isLoading = true;
let scrollY = 0;
let ticking = false;

// ===== UTILITY FUNCTIONS =====
function debounce(func, wait, immediate) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}

function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

function lerp(start, end, factor) {
  return start + (end - start) * factor;
}

function mapRange(value, inMin, inMax, outMin, outMax) {
  return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

// ===== LOADING SCREEN =====
function initLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen');
  const loaderText = document.querySelector('.loader-text');
  
  const messages = [
    'Initializing Future...',
    'Loading AI Components...',
    'Preparing 3D Experience...',
    'Almost Ready...'
  ];
  
  let messageIndex = 0;
  const messageInterval = setInterval(() => {
    if (messageIndex < messages.length - 1) {
      messageIndex++;
      loaderText.textContent = messages[messageIndex];
    }
  }, 800);
  
  // Simulate loading time and hide loading screen
  setTimeout(() => {
    clearInterval(messageInterval);
    loadingScreen.classList.add('hidden');
    isLoading = false;
    
    // Initialize animations after loading
    initAnimations();
  }, 3200);
}

// ===== NAVIGATION =====
function initNavigation() {
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.querySelectorAll('.nav-link');
  
  // Navbar scroll effect
  function updateNavbar() {
    if (window.scrollY > 100) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
  
  // Smooth scroll for navigation links
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const targetSection = document.querySelector(targetId);
      
      if (targetSection) {
        const offsetTop = targetSection.offsetTop - 80;
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
        
        // Update active link
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    });
  });
  
  // Update navbar on scroll
  window.addEventListener('scroll', throttle(updateNavbar, 16));
  updateNavbar();
}

// ===== PARTICLE SYSTEM =====
function createParticleSystem() {
  const particlesContainer = document.getElementById('particles');
  if (!particlesContainer) return;
  
  // Create Three.js scene for particles
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    // 3D tilt effect for team, feature, hiw, and why cards
    const tiltSelectors = ['.team-member', '.feature-card', '.hiw-card', '.why-card'];
    tiltSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(card => {
        const handleMove = (clientX, clientY) => {
          const rect = card.getBoundingClientRect();
          const x = clientX - rect.left;
          const y = clientY - rect.top;
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const rotateX = (y - centerY) / centerY * -10;
          const rotateY = (x - centerX) / centerX * 10;
          gsap.to(card, {
            rotationX: rotateX,
            rotationY: rotateY,
            duration: 0.3,
            ease: 'power2.out',
            transformPerspective: 1000,
            transformOrigin: 'center center'
          });
        };
        card.addEventListener('mousemove', (e) => handleMove(e.clientX, e.clientY));
        card.addEventListener('touchmove', (e) => {
          if (e.touches && e.touches[0]) {
            handleMove(e.touches[0].clientX, e.touches[0].clientY);
          }
        }, { passive: true });
        card.addEventListener('mouseleave', () => {
          gsap.to(card, {
            rotationX: 0,
            rotationY: 0,
            duration: 0.5,
            ease: 'power2.out',
            transformPerspective: 1000,
            transformOrigin: 'center center'
          });
        });
      });
    });
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  particlesContainer.appendChild(renderer.domElement);
  
  // Create particles geometry
  const particlesGeometry = new THREE.BufferGeometry();
  // Reduce particle count on mobile to improve FPS
  const isMobile = window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent);
  const particleCount = isMobile ? 70 : 150;
  
  const posArray = new Float32Array(particleCount * 3);
  const colorArray = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount * 3; i += 3) {
    // Position
    posArray[i] = (Math.random() - 0.5) * 10;
    posArray[i + 1] = (Math.random() - 0.5) * 10;
    posArray[i + 2] = (Math.random() - 0.5) * 10;
    
    // Color (blue to pink gradient)
    const t = Math.random();
    colorArray[i] = lerp(0.23, 0.93, t);     // R
    colorArray[i + 1] = lerp(0.51, 0.28, t); // G
    colorArray[i + 2] = lerp(0.96, 0.58, t); // B
  }
  
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
  
  // Create particles material
  const particlesMaterial = new THREE.PointsMaterial({
    size: 0.03,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });
  
  // Create particle system
  const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particleSystem);
  
  camera.position.z = 3;
  
  // Animation loop
  let mouseX = 0;
  let mouseY = 0;
  
  document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
  });
  
  function animateParticles() {
    requestAnimationFrame(animateParticles);
    
    // Rotate particles
    particleSystem.rotation.x += 0.0003;
    particleSystem.rotation.y += 0.0005;
    
    // Mouse interaction
    particleSystem.rotation.x += mouseY * 0.0001;
    particleSystem.rotation.y += mouseX * 0.0001;
    
    // Scroll interaction
    const scrollFactor = window.scrollY * 0.0001;
    particleSystem.rotation.z = scrollFactor;
    
    renderer.render(scene, camera);
  }
  
  animateParticles();
  
  // Handle window resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Lower pixel ratio on mobile to improve performance
  try {
    const pr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.2 : 2);
    renderer.setPixelRatio(pr);
  } catch(_) {}
}

// ===== GSAP ANIMATIONS =====
function initAnimations() {
  // Register GSAP plugins
  gsap.registerPlugin(ScrollTrigger);
  
  // Hero section animations
  const heroTl = gsap.timeline({ delay: 0.5 });
  
  heroTl
    .fromTo('.tag-box', 
      { opacity: 0, y: 30, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'back.out(1.7)' }
    )
    .fromTo('.hero-title', 
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' }, 
      '-=0.7'
    )
    .fromTo('.hero-description', 
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, 
      '-=0.8'
    )
    .fromTo('.hero-cta', 
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, 
      '-=0.6'
    );
  
  // 3D Robot animation
  gsap.fromTo('.robot-3d', 
    { opacity: 0, scale: 0.8, rotationY: -15 },
    { 
      opacity: 1, 
      scale: 1, 
      rotationY: 0, 
      duration: 1.5, 
      ease: 'back.out(1.2)',
      delay: 1
    }
  );
  
  // Floating elements animation
  gsap.to('.floating-cube', {
    y: -20,
    rotation: 360,
    duration: 4,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
    stagger: 0.5
  });
  
  gsap.to('.floating-sphere', {
    y: -15,
    x: 10,
    duration: 3,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
    stagger: 0.3
  });
  
  // Scroll-triggered animations
  initScrollAnimations();
}

function initScrollAnimations() {
  // Feature cards animation
  gsap.fromTo('.feature-card', 
    { opacity: 0, y: 80, rotationX: 15 },
    {
      opacity: 1,
      y: 0,
      rotationX: 0,
      duration: 1,
      ease: 'power3.out',
      stagger: 0.2,
      scrollTrigger: {
        trigger: '.features-grid',
        start: 'top 80%',
        end: 'bottom 20%',
        toggleActions: 'play none none reverse'
      }
    }
  );
  
  // Product cards animation
  gsap.fromTo('.product-card', 
    { opacity: 0, y: 60, scale: 0.9 },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.8,
      ease: 'back.out(1.2)',
      stagger: 0.15,
      scrollTrigger: {
        trigger: '.products-grid',
        start: 'top 80%',
        end: 'bottom 20%',
        toggleActions: 'play none none reverse'
      }
    }
  );
  
  // Community stats counter
  gsap.utils.toArray('.stat-number').forEach(stat => {
    const finalValue = parseInt(stat.getAttribute('data-count'));
    
    ScrollTrigger.create({
      trigger: stat,
      start: 'top 80%',
      onEnter: () => {
        gsap.to(stat, {
          innerHTML: finalValue,
          duration: 2,
          ease: 'power2.out',
          snap: { innerHTML: finalValue < 100 ? 0.1 : 1 },
          onUpdate: function() {
            stat.innerHTML = Math.ceil(this.targets()[0].innerHTML) + (finalValue === 99.9 ? '' : '');
          }
        });
      }
    });
  });
  
  // Section headers animation
  gsap.utils.toArray('.section-header').forEach(header => {
    gsap.fromTo(header.children, 
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.2,
        scrollTrigger: {
          trigger: header,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        }
      }
    );
  });
  
  // Parallax effects
  gsap.utils.toArray('.gradient-orb').forEach(orb => {
    gsap.to(orb, {
      yPercent: -50,
      ease: 'none',
      scrollTrigger: {
        trigger: orb,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true
      }
    });
  });
  
  // 3D rotation on scroll for robot
  ScrollTrigger.create({
    trigger: '.hero',
    start: 'top top',
    end: 'bottom top',
    scrub: 1,
    onUpdate: (self) => {
      const rotation = self.progress * 20;
      gsap.to('.robot-3d', {
        rotationY: rotation,
        duration: 0.3,
        ease: 'power2.out'
      });
    }
  });
}

// ===== INTERACTIVE ELEMENTS =====
function initInteractiveElements() {
  // Magnetic buttons effect
  const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');
  
  buttons.forEach(button => {
    button.addEventListener('mousemove', (e) => {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      gsap.to(button, {
        x: x * 0.1,
        y: y * 0.1,
        duration: 0.3,
        ease: 'power2.out'
      });
    });
    
    button.addEventListener('mouseleave', () => {
      gsap.to(button, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.3)'
      });
    });
  });
  
  // Feature cards hover effect
  const featureCards = document.querySelectorAll('.feature-card');
  
  featureCards.forEach(card => {
    const icon = card.querySelector('.icon-3d');
    
    card.addEventListener('mouseenter', () => {
      gsap.to(card, {
        scale: 1.02,
        duration: 0.3,
        ease: 'power2.out'
      });
      
      gsap.to(icon, {
        rotationY: 180,
        scale: 1.1,
        duration: 0.5,
        ease: 'back.out(1.2)'
      });
    });
    
    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.out'
      });
      
      gsap.to(icon, {
        rotationY: 0,
        scale: 1,
        duration: 0.5,
        ease: 'back.out(1.2)'
      });
    });
  });
  
  // Product cards tilt effect
  const productCards = document.querySelectorAll('.product-card');
  
  productCards.forEach(card => {
    const handleMove = (clientX, clientY) => {
      const rect = card.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = (y - centerY) / centerY * -10;
      const rotateY = (x - centerX) / centerX * 10;
      
      gsap.to(card, {
        rotationX: rotateX,
        rotationY: rotateY,
        duration: 0.3,
        ease: 'power2.out',
        transformPerspective: 1000,
        transformOrigin: 'center center'
      });
    };

    card.addEventListener('mousemove', (e) => handleMove(e.clientX, e.clientY));
    card.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });
    
    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        rotationX: 0,
        rotationY: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.3)'
      });
    });
    card.addEventListener('touchend', () => {
      gsap.to(card, {
        rotationX: 0,
        rotationY: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.3)'
      });
    });
  });
}

// ===== COMMUNITY PARTICLES =====
function createCommunityParticles() {
  const container = document.getElementById('community-particles');
  if (!container) return;
  
  // Create animated particles for community section
  for (let i = 0; i < 20; i++) {
    const particle = document.createElement('div');
    particle.style.position = 'absolute';
    particle.style.width = Math.random() * 4 + 2 + 'px';
    particle.style.height = particle.style.width;
    particle.style.background = `hsl(${220 + Math.random() * 60}, 70%, 60%)`;
    particle.style.borderRadius = '50%';
    particle.style.opacity = Math.random() * 0.6 + 0.2;
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    
    container.appendChild(particle);
    
    // Animate particles
    gsap.to(particle, {
      x: (Math.random() - 0.5) * 200,
      y: (Math.random() - 0.5) * 200,
      duration: Math.random() * 10 + 10,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      delay: Math.random() * 2
    });
  }
}

// ===== FOOTER PARTICLES =====
function createFooterParticles() {
  const container = document.getElementById('footer-particles');
  if (!container) return;
  
  // Create subtle particles for footer
  for (let i = 0; i < 15; i++) {
    const particle = document.createElement('div');
    particle.style.position = 'absolute';
    particle.style.width = Math.random() * 2 + 1 + 'px';
    particle.style.height = particle.style.width;
    particle.style.background = 'rgba(59, 130, 246, 0.3)';
    particle.style.borderRadius = '50%';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    
    container.appendChild(particle);
    
    gsap.to(particle, {
      y: -50,
      duration: Math.random() * 8 + 5,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      delay: Math.random() * 3
    });
  }
}

// ===== EVENT HANDLERS =====
function initEventHandlers() {
  // Join early access buttons
  const joinButtons = document.querySelectorAll('#join-early-access, #join-waitlist, #final-join');
  
  joinButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      // Allow navigation for the community anchor (#final-join)
      if (button.id !== 'final-join') {
        e.preventDefault();
      }
      
      // Create ripple effect
      const rect = button.getBoundingClientRect();
      const ripple = document.createElement('div');
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
      `;
      
      button.style.position = 'relative';
      button.style.overflow = 'hidden';
      button.appendChild(ripple);
      
      setTimeout(() => ripple.remove(), 600);
      
      // Show success message (you can replace this with actual form)
      if (button.id !== 'final-join') {
        showNotification('🚀 Thanks for your interest! We\'ll be in touch soon.');
      }
    });
  });
  
  // Scroll to top functionality
  const scrollIndicator = document.querySelector('.scroll-indicator');
  if (scrollIndicator) {
    scrollIndicator.addEventListener('click', () => {
      gsap.to(window, {
        scrollTo: { y: window.innerHeight },
        duration: 1,
        ease: 'power2.inOut'
      });
    });
  }
}

// ===== NOTIFICATIONS =====
function showNotification(message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    z-index: 10001;
    font-weight: 500;
    transform: translateX(100%);
    transition: transform 0.3s ease;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => notification.style.transform = 'translateX(0)', 100);
  
  // Animate out and remove
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

// ===== CSS ANIMATIONS =====
function addCustomStyles() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
    
    .cursor-trail {
      position: fixed;
      width: 6px;
      height: 6px;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.8) 0%, transparent 70%);
      border-radius: 50%;
      pointer-events: none;
      z-index: 9999;
      mix-blend-mode: screen;
    }
  `;
  document.head.appendChild(style);
}

// ===== CURSOR TRAIL EFFECT =====
function initCursorTrail() {
  const trails = [];
  const trailCount = 8;
  
  // Create trail elements
  for (let i = 0; i < trailCount; i++) {
    const trail = document.createElement('div');
    trail.className = 'cursor-trail';
    trail.style.opacity = (trailCount - i) / trailCount * 0.5;
    trail.style.transform = 'scale(' + (trailCount - i) / trailCount + ')';
    document.body.appendChild(trail);
    trails.push({ element: trail, x: 0, y: 0 });
  }
  
  let mouseX = 0, mouseY = 0;
  
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
  
  function animateTrails() {
    let x = mouseX, y = mouseY;
    
    trails.forEach((trail, index) => {
      const nextTrail = trails[index + 1] || trails[0];
      
      trail.x += (x - trail.x) * 0.3;
      trail.y += (y - trail.y) * 0.3;
      
      trail.element.style.left = trail.x - 3 + 'px';
      trail.element.style.top = trail.y - 3 + 'px';
      
      x = trail.x;
      y = trail.y;
    });
    
    requestAnimationFrame(animateTrails);
  }
  
  animateTrails();
}

// ===== PERFORMANCE OPTIMIZATION =====
function initPerformanceOptimizations() {
  // Reduce animations on mobile
  if (window.innerWidth < 768) {
    document.body.classList.add('reduced-motion');
  }
  
  // Pause animations when tab is not visible
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      gsap.globalTimeline.pause();
    } else {
      gsap.globalTimeline.resume();
    }
  });
  
  // Optimize scroll performance
  let rafId = null;
  function updateScrollPosition() {
    scrollY = window.scrollY;
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    rafId = requestAnimationFrame(() => {
      // Your scroll-dependent updates here
      rafId = null;
    });
  }
  
  window.addEventListener('scroll', updateScrollPosition, { passive: true });
}

// Mobile Navigation Toggle
function initMobileNavigation() {
  // Support both legacy and current selectors
  const menuToggle = document.getElementById('nav-toggle') || document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav-menu') || document.querySelector('.mobile-nav');
  const mobileOverlay = document.getElementById('mobile-overlay') || document.querySelector('.mobile-overlay');
  const closeMenu = document.getElementById('mobile-close') || document.querySelector('.close-menu');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-links a, .mobile-nav-link');

    // Open mobile menu
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            if (mobileNav) {
                mobileNav.classList.add('active');
            }
            if (mobileOverlay) {
                mobileOverlay.classList.add('active');
            }
            document.body.style.overflow = 'hidden';
        });
    }

    // Close mobile menu function
    function closeMobileMenu() {
        if (mobileNav) {
            mobileNav.classList.remove('active');
        }
        if (mobileOverlay) {
            mobileOverlay.classList.remove('active');
        }
        document.body.style.overflow = '';
    }

    // Close menu button
    if (closeMenu) {
        closeMenu.addEventListener('click', closeMobileMenu);
    }

    // Close menu when clicking overlay
    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', closeMobileMenu);
    }

    // Close menu when clicking navigation links
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    // Close menu on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && mobileNav && mobileNav.classList.contains('active')) {
            closeMobileMenu();
        }
    });
}

// Enhanced smooth scrolling for navigation links
function initSmoothScrolling() {
    const navLinks = document.querySelectorAll('nav a[href^="#"], .mobile-nav-links a[href^="#"], .mobile-nav-link[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.offsetTop;
                const offsetPosition = elementPosition - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Mobile device detection
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           ('ontouchstart' in window) || 
           (window.innerWidth <= 768);
}

// Enable mobile touch interactions for Spline viewer
function enableMobileInteractions(splineViewer) {
    if (!splineViewer) return;
    
    // Ensure touch events are properly handled
    splineViewer.style.touchAction = 'manipulation';
    splineViewer.style.userSelect = 'none';
    splineViewer.style.webkitTouchCallout = 'none';
    splineViewer.style.webkitTapHighlightColor = 'transparent';
    
    // Add explicit touch event listeners
    let isInteracting = false;
    
    splineViewer.addEventListener('touchstart', (e) => {
        isInteracting = true;
        e.stopPropagation(); // Prevent event bubbling
    }, { passive: false });
    
    splineViewer.addEventListener('touchmove', (e) => {
        if (isInteracting) {
            e.stopPropagation(); // Prevent page scrolling during interaction
        }
    }, { passive: false });
    
    splineViewer.addEventListener('touchend', (e) => {
        setTimeout(() => { isInteracting = false; }, 100);
        e.stopPropagation();
    }, { passive: false });
}

// Handle 3D Model Loading
function init3DModelHandling() {
    const splineViewer = document.querySelector('spline-viewer');
    const fallback = document.querySelector('.model-fallback');
    
    if (splineViewer && fallback) {
        // Initially show fallback
        fallback.style.display = 'flex';
        
        // Listen for model load events
        splineViewer.addEventListener('load', () => {
            setTimeout(() => {
                fallback.style.opacity = '0';
                setTimeout(() => {
                    fallback.style.display = 'none';
                }, 500);
            }, 1000); // Show fallback for at least 1 second
            
            // Enable mobile touch interactions after load
            if (isMobileDevice()) {
                enableMobileInteractions(splineViewer);
            }
        });
        
        // Handle load errors - keep fallback visible
        splineViewer.addEventListener('error', () => {
            console.log('3D model failed to load, showing fallback animation');
            fallback.style.display = 'flex';
        });
        
    // Block navigation/redirects from inside the viewer but keep interactions
    const blockNav = (e) => {
      // Prevent any anchor default behavior
      if (e.target && (e.target.tagName === 'A' || e.target.closest('a'))) {
        e.preventDefault();
      }
      e.stopImmediatePropagation();
    };
    const blockKeyNav = (e) => {
      // Prevent Enter/Space triggering links inside viewer
      if ((e.key === 'Enter' || e.key === ' ') && (e.target && (e.target.tagName === 'A' || e.target.closest('a')))) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };
    splineViewer.addEventListener('click', blockNav, true);
    splineViewer.addEventListener('auxclick', blockNav, true);
    splineViewer.addEventListener('contextmenu', blockNav, true);
    splineViewer.addEventListener('keydown', blockKeyNav, true);

    // Soft-guard window navigation attempts during interactions
    const originalOpen = window.open;
    const originalAssign = window.location.assign.bind(window.location);
    const originalHrefSetter = Object.getOwnPropertyDescriptor(Location.prototype, 'href').set;
    let guardActive = false;

    const enableGuard = () => {
      if (guardActive) return;
      guardActive = true;
      window.open = function() { console.warn('Blocked window.open from viewer'); return null; };
      window.location.assign = function() { console.warn('Blocked location.assign from viewer'); };
      try {
        Object.defineProperty(window.location, 'href', { set: () => console.warn('Blocked location.href from viewer') });
      } catch (_) { /* some browsers disallow redefining */ }
    };
    const disableGuard = () => {
      if (!guardActive) return;
      guardActive = false;
      window.open = originalOpen;
      window.location.assign = originalAssign;
      try {
        Object.defineProperty(window.location, 'href', { set: originalHrefSetter });
      } catch (_) { /* ignore */ }
    };

    // Activate guard while pointer is interacting with viewer
    splineViewer.addEventListener('pointerdown', enableGuard, true);
    splineViewer.addEventListener('pointerup', disableGuard, true);
    splineViewer.addEventListener('pointercancel', disableGuard, true);
    splineViewer.addEventListener('mouseleave', disableGuard, true);

    // Timeout fallback - if model doesn't load in 10 seconds, keep fallback
        setTimeout(() => {
            if (fallback.style.display !== 'none') {
                console.log('3D model loading timeout, keeping fallback');
                // Fallback stays visible
            }
        }, 10000);
    }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  // Initialize all components
  // Prefer a truly transparent logo if the asset exists
  trySwapTransparentLogo();
  // Validate that any transparent logo is actually transparent, else fallback
  validateTransparentLogo();
  // Auto-blend non-transparent header logos so they integrate with dark header
  autoBlendHeaderLogos();
  // Attempt a cleanup pass to strip baked backgrounds from header logos
  cleanupHeaderLogos();

  initLoadingScreen();
  initNavigation();
  initMobileNavigation();
  initSmoothScrolling();
  init3DModelHandling();
  createParticleSystem();
  createCommunityParticles();
  createFooterParticles();
  initInteractiveElements();
  initEventHandlers();
  addCustomStyles();
  initCursorTrail();
  initPerformanceOptimizations();
  
  // Initialize AOS (Animate On Scroll)
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 1200,
      easing: 'ease-out-cubic',
      once: true,
      offset: 120,
      delay: 100
    });
  }

  // Convert any placeholder links with href="#" into a smooth scroll to top (mobile-friendly)
  document.querySelectorAll('a[href="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, { passive: false });
  });
});

  // Global safety net: block anchor navigations initiated from inside spline-viewer
  document.addEventListener('click', (e) => {
    const viewer = e.target && (e.target.closest && e.target.closest('spline-viewer'));
    const anchor = e.target && (e.target.tagName === 'A' ? e.target : (e.target.closest && e.target.closest('a')));
    if (viewer && anchor) {
      e.preventDefault();
      e.stopImmediatePropagation();
      console.warn('Blocked link navigation from inside spline-viewer.');
    }
  }, true);

// ===== WINDOW RESIZE HANDLER =====
window.addEventListener('resize', debounce(() => {
  // Refresh ScrollTrigger on resize
  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.refresh();
  }
  
  // Update AOS
  if (typeof AOS !== 'undefined') {
    AOS.refresh();
  }
}, 250));

// ===== ERROR HANDLING =====
window.addEventListener('error', (e) => {
  console.error('Website error:', e.error);
});

// ===== EXPORT FOR DEBUGGING =====
window.SoulixWebsite = {
  showNotification,
  initAnimations,
  initScrollAnimations
};

// ===== BRANDING: Transparent Logo Swap =====
// Attempts to use a true transparent PNG if present in assets.
function trySwapTransparentLogo() {
  // Only operate on explicitly opted-in images, not the fixed header/footer logos
  const scopedImages = document.querySelectorAll('img[data-allow-transparent="true"]');
  if (!scopedImages.length) return;

  const candidates = [
    './assets/soulix t1.png',
    './assets/soulixlogo-transparent.png',
    './assets/soulix_logo_transparent.png'
    // Intentionally skipping './assets/soulix logo trans.png' due to checkerboard artifact in previous asset
  ];

  const testImage = new Image();
  let index = 0;

  const tryNext = () => {
    if (index >= candidates.length) return; // no transparent asset found; keep solid png
    const src = candidates[index++];
    testImage.onload = () => {
      if (testImage.naturalWidth > 0 && testImage.naturalHeight > 0) {
        // Swap only images that opted-in via data attribute
        scopedImages.forEach(img => {
          img.src = src;
          img.classList.add('transparent-logo');
          img.decoding = 'sync';
          img.fetchPriority = 'high';
        });
      }
    };
    testImage.onerror = () => {
      tryNext();
    };
    testImage.src = src + '?v=' + Date.now(); // bypass potential cache
  };

  tryNext();
}

// ===== BRANDING: Validate Transparent Logo (detect baked checkerboard) =====
function validateTransparentLogo() {
  const logos = Array.from(document.querySelectorAll('nav .brand-logo img, header .brand-logo img'));
  if (logos.length === 0) return;

  const analyze = (imgEl) => {
    if (!imgEl || !imgEl.src) return;
    if (!imgEl.complete) { imgEl.addEventListener('load', () => analyze(imgEl)); return; }

    try {
      const testImg = new Image();
      testImg.crossOrigin = 'anonymous';
      testImg.onload = () => {
        const maxDim = 128;
        const scale = Math.min(maxDim / testImg.naturalWidth, maxDim / testImg.naturalHeight, 1);
        const w = Math.max(1, Math.floor(testImg.naturalWidth * scale));
        const h = Math.max(1, Math.floor(testImg.naturalHeight * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(testImg, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;

        // Sample a 10x10 grid across the image to estimate transparency coverage
        const grid = 10;
        let samples = 0; let transparentSamples = 0;
        for (let gy = 1; gy <= grid; gy++) {
          for (let gx = 1; gx <= grid; gx++) {
            const x = Math.floor((gx / (grid + 1)) * w);
            const y = Math.floor((gy / (grid + 1)) * h);
            const idx = (y * w + x) * 4;
            const a = data[idx + 3];
            if (a < 16) transparentSamples++;
            samples++;
          }
        }
        const transparencyRatio = transparentSamples / (samples || 1);

        // Heuristics:
        // - If transparencyRatio is high, keep it crisp (no blend)
        // - If transparencyRatio is very low, it's likely a baked background: fallback to solid + blend
        // - Otherwise, ensure blend for integration
        if (transparencyRatio >= 0.35) {
          imgEl.classList.add('transparent-logo');
          imgEl.classList.add('logo-blend'); // allow header blend rules to apply consistently
        } else if (transparencyRatio <= 0.1) {
          // Likely opaque background: try to clean to transparent; if cleaning fails, fall back to blend
          tryCleanLogoToTransparent(imgEl).catch(() => {
            imgEl.classList.remove('transparent-logo');
            imgEl.classList.add('logo-blend');
          });
        } else {
          // Ambiguous: keep blend for safety
          tryCleanLogoToTransparent(imgEl).catch(() => {
            imgEl.classList.remove('transparent-logo');
            imgEl.classList.add('logo-blend');
          });
        }
      };
      testImg.onerror = () => { /* ignore */ };
      testImg.src = imgEl.currentSrc || imgEl.src;
    } catch (_) { /* ignore */ }
  };

  logos.forEach(analyze);
}

// ===== BRANDING: Auto-blend fallback for header logos =====
function autoBlendHeaderLogos() {
  const headerLogos = document.querySelectorAll('nav .brand-logo img, header .brand-logo img');
  headerLogos.forEach(imgEl => {
    if (imgEl.classList.contains('transparent-logo')) return; // already good

    // Quick heuristic: if filename suggests solid or unknown, add blend
    const src = (imgEl.currentSrc || imgEl.src || '').toLowerCase();
    const looksTransparent = src.includes('transparent') || src.includes('trans') || src.includes('t1');
    if (!looksTransparent) {
      imgEl.classList.add('logo-blend');
      return;
    }

    // If it looks transparent by name, do a quick alpha sampling to confirm
    try {
      const testImg = new Image();
      testImg.crossOrigin = 'anonymous';
      testImg.onload = () => {
        const w = Math.max(1, Math.min(64, testImg.naturalWidth));
        const h = Math.max(1, Math.min(64, testImg.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0,0,w,h);
        ctx.drawImage(testImg, 0, 0, w, h);
        const data = ctx.getImageData(0,0,w,h).data;
        const p = [ [2,2], [w-3,2], [2,h-3], [w-3,h-3] ];
        let transparentCorners = 0;
        p.forEach(([x,y]) => {
          const i = (y*w + x)*4; const a = data[i+3];
          if (a < 10) transparentCorners++;
        });
        if (transparentCorners <= 1) {
          imgEl.classList.add('logo-blend');
        }
      };
      testImg.src = src;
    } catch (_) {
      // If we can't inspect, default to blend
      imgEl.classList.add('logo-blend');
    }
  });
}

// ===== BRANDING: Cleanup pass to strip baked backgrounds =====
function cleanupHeaderLogos() {
  const imgs = document.querySelectorAll('nav .brand-logo img, header .brand-logo img');
  imgs.forEach(img => {
    if (img.dataset.cleaned === 'true') return;
    // Best-effort clean; ignore errors silently
    tryCleanLogoToTransparent(img).catch(() => {/* ignore */});
  });
}

// Attempts to convert an opaque logo with checkerboard/light background into a real transparent PNG.
// Strategy: keep near-white strokes (the logo) and make everything else transparent, with feathered edges.
function tryCleanLogoToTransparent(imgEl) {
  return new Promise((resolve, reject) => {
    if (!imgEl || !imgEl.src) return reject('no image');
    if (imgEl.dataset.cleaned === 'true') return resolve('already cleaned');

    const src = imgEl.currentSrc || imgEl.src;
    const img = new Image();
    img.onload = () => {
      try {
        const maxDim = 512; // higher res for better edge quality
        const scale = Math.min(maxDim / img.naturalWidth, maxDim / img.naturalHeight, 1);
        const w = Math.max(1, Math.floor(img.naturalWidth * scale));
        const h = Math.max(1, Math.floor(img.naturalHeight * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;

        // Phase 1: derive alpha from luminance closeness to white
        // Pixels very close to white -> keep; others -> transparent or feathered
        const keepStart = 230; // start keeping above this luminance
        const fullKeep = 250; // fully keep above this
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i+1], b = data[i+2];
          const lum = 0.2126*r + 0.7152*g + 0.0722*b;
          let a;
          if (lum >= fullKeep) {
            a = 255;
          } else if (lum <= keepStart) {
            a = 0;
          } else {
            // Feather alpha between thresholds
            a = Math.round((lum - keepStart) / (fullKeep - keepStart) * 255);
          }
          data[i] = 255; data[i+1] = 255; data[i+2] = 255; // normalize logo color to white
          data[i+3] = a;
        }

        // Phase 2: simple edge dilate to avoid jagged edges after thresholding
        const dilatePasses = 1;
        for (let pass = 0; pass < dilatePasses; pass++) {
          const copy = new Uint8ClampedArray(data);
          for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
              const idx = (y * w + x) * 4 + 3; // alpha index
              if (copy[idx] > 200) continue; // already solid
              // If any neighbor is strong, gently increase
              let strongNeighbor = false;
              for (let dy = -1; dy <= 1 && !strongNeighbor; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                  const nIdx = ((y+dy) * w + (x+dx)) * 4 + 3;
                  if (copy[nIdx] > 220) { strongNeighbor = true; break; }
                }
              }
              if (strongNeighbor) {
                data[idx] = Math.min(255, copy[idx] + 40);
              }
            }
          }
        }

        ctx.putImageData(imageData, 0, 0);
        const cleanedUrl = canvas.toDataURL('image/png');
        // Swap the image source to cleaned data
        imgEl.src = cleanedUrl;
        imgEl.dataset.cleaned = 'true';
        imgEl.classList.add('transparent-logo');
        imgEl.classList.add('logo-blend'); // allow header to integrate visually
        resolve('cleaned');
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject('load error');
    img.src = src;
  });
}

// Fix mobile white line during loading/scrolling
function fixMobileBackground() {
    if (isMobileDevice()) {
        // Ensure body background is always visible
        document.body.style.setProperty('background', 'linear-gradient(135deg, #181c2f 0%, #232946 100%)', 'important');
        document.documentElement.style.setProperty('background', 'linear-gradient(135deg, #181c2f 0%, #232946 100%)', 'important');
        
        // Add viewport height fix for address bar changes
        const setVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        
        setVH();
        window.addEventListener('resize', setVH);
        window.addEventListener('orientationchange', () => {
            setTimeout(setVH, 100);
        });
    }
}

// Initialize mobile fixes immediately
fixMobileBackground();