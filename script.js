(function(){
  "use strict";

  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---- header scroll state ---- */
  var header = document.getElementById('siteHeader');
  var onScroll = function(){
    if(window.scrollY > 40){ header.classList.add('scrolled'); }
    else { header.classList.remove('scrolled'); }
  };
  document.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  /* ---- mobile nav ---- */
  var toggle = document.getElementById('navToggle');
  var navMobile = document.getElementById('navMobile');
  function closeNav(){
    toggle.classList.remove('open');
    navMobile.classList.remove('open');
    toggle.setAttribute('aria-expanded','false');
    document.body.style.overflow = '';
  }
  toggle.addEventListener('click', function(){
    var isOpen = navMobile.classList.toggle('open');
    toggle.classList.toggle('open', isOpen);
    toggle.setAttribute('aria-expanded', isOpen ? 'true':'false');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
  navMobile.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', closeNav);
  });

  /* ---- reveal on scroll ---- */
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealables = document.querySelectorAll('.reveal, .reveal-stagger, [data-flow]');
  if(reduceMotion){
    revealables.forEach(function(el){ el.classList.add('is-visible'); el.classList.add('in-view'); });
  } else if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add(entry.target.hasAttribute('data-flow') ? 'in-view' : 'is-visible');
          io.unobserve(entry.target);
        }
      });
    }, {threshold:0.18, rootMargin:'0px 0px -60px 0px'});
    revealables.forEach(function(el){ io.observe(el); });
  } else {
    revealables.forEach(function(el){ el.classList.add('is-visible'); el.classList.add('in-view'); });
  }

  /* ---- image fallback ---- */
  ['heroImg','aboutImg'].forEach(function(id){
    var img = document.getElementById(id);
    if(img){ img.addEventListener('error', function(){ img.style.display = 'none'; }); }
  });

  /* ---- testimonials slider ---- */
  var slides = Array.prototype.slice.call(document.querySelectorAll('.t-slide'));
  var dotsWrap = document.getElementById('tDots');
  var current = 0;
  var timer;

  slides.forEach(function(_, i){
    var dot = document.createElement('button');
    dot.className = 't-dot' + (i===0 ? ' active' : '');
    dot.setAttribute('aria-label', 'Vai alla testimonianza ' + (i+1));
    dot.addEventListener('click', function(){ goTo(i); resetTimer(); });
    dotsWrap.appendChild(dot);
  });
  var dots = Array.prototype.slice.call(dotsWrap.children);

  function goTo(i){
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = (i + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
  }
  function resetTimer(){
    clearInterval(timer);
    if(!reduceMotion){ timer = setInterval(function(){ goTo(current+1); }, 6500); }
  }
  document.getElementById('tNext').addEventListener('click', function(){ goTo(current+1); resetTimer(); });
  document.getElementById('tPrev').addEventListener('click', function(){ goTo(current-1); resetTimer(); });
  resetTimer();

  /* ---- contact form (front-end only demo) ---- */
  var form = document.getElementById('contactForm');
  var success = document.getElementById('formSuccess');
  form.addEventListener('submit', function(e){
    e.preventDefault();
    if(!form.checkValidity()){ form.reportValidity(); return; }
    success.classList.add('show');
    form.reset();
    success.scrollIntoView({behavior: reduceMotion ? 'auto':'smooth', block:'center'});
    setTimeout(function(){ success.classList.remove('show'); }, 6000);
  });

})();
