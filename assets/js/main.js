/* ==========================================================================
   谌基涛 · 个人求职主页  交互脚本
   无第三方依赖，完全离线可用。
   包含：主题切换 / 导航 / 滚动高亮 / 入场动画 / 打字机 / 技能筛选 /
         项目弹窗 / 一键复制 / 邮件表单 / 回到顶部 / 打印
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     可配置项：想换文案改这里就够了
     ------------------------------------------------------------------ */
  var CONFIG = {
    // 首屏轮播的求职方向
    roles: [
      'Java 后端开发',
      'Web 全栈开发',
      '嵌入式 / 物联网开发'
    ],
    // 打字机速度（毫秒）
    typeSpeed: 95,
    deleteSpeed: 45,
    holdTime: 1600,
    // 接收联系表单的邮箱
    mailTo: '1499938212@qq.com'
  };

  /* ------------------------------------------------------------------
     小工具
     ------------------------------------------------------------------ */
  var $  = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 提示条 */
  var toastEl = $('#toast');
  var toastTimer = null;
  function toast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.hidden = false;
    requestAnimationFrame(function () { toastEl.classList.add('is-visible'); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('is-visible');
      setTimeout(function () { toastEl.hidden = true; }, 260);
    }, 2000);
  }

  /* ------------------------------------------------------------------
     1. 主题切换（记忆到 localStorage）
     ------------------------------------------------------------------ */
  var root = document.documentElement;
  var themeToggle = $('#themeToggle');
  var themeColorMeta = document.querySelector('meta[name="theme-color"]');

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', theme === 'dark' ? '#070d18' : '#14314f');
    }
    if (themeToggle) {
      var isDark = theme === 'dark';
      themeToggle.setAttribute('aria-label', isDark ? '切换浅色模式' : '切换深色模式');
      themeToggle.setAttribute('title', isDark ? '切换到浅色模式' : '切换到深色模式');
    }
  }

  applyTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem('theme', next); } catch (e) { /* 忽略 */ }
    });
  }

  /* ------------------------------------------------------------------
     2. 导航：滚动状态 / 移动端菜单 / 滚动高亮
     ------------------------------------------------------------------ */
  var header = $('#siteHeader');
  var navToggle = $('#navToggle');
  var navMenu = $('#navMenu');
  var progressFill = $('#progressBar > span');
  var toTop = $('#toTop');
  var navLinks = $$('.nav-list a');

  function closeMenu() {
    if (!navMenu || !navToggle) return;
    navMenu.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', '打开导航菜单');
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function () {
      var open = navMenu.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单');
    });

    navLinks.concat($$('.nav-actions a', navMenu)).forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('click', function (e) {
      if (!navMenu.classList.contains('is-open')) return;
      if (navMenu.contains(e.target) || navToggle.contains(e.target)) return;
      closeMenu();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) closeMenu();
    });
  }

  /* 滚动相关（用 rAF 合并，避免滚动时频繁重排） */
  var sections = $$('main section[id]');
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;

    if (header) header.classList.toggle('is-scrolled', y > 8);
    if (toTop) toTop.classList.toggle('is-visible', y > 520);

    if (progressFill) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? Math.min(100, Math.max(0, (y / max) * 100)) : 0;
      progressFill.style.width = pct.toFixed(2) + '%';
    }

    // 导航高亮：取当前视口内最靠上的区块
    var currentId = '';
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= 140) currentId = sections[i].id;
    }
    navLinks.forEach(function (link) {
      link.classList.toggle('is-active', link.getAttribute('href') === '#' + currentId);
    });

    ticking = false;
  }

  function requestScrollTick() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(onScroll);
  }

  window.addEventListener('scroll', requestScrollTick, { passive: true });
  window.addEventListener('resize', requestScrollTick);
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ------------------------------------------------------------------
     3. 滚动入场动画
     ------------------------------------------------------------------ */
  var revealItems = $$('.reveal');

  function isInViewport(el, margin) {
    var rect = el.getBoundingClientRect();
    var h = window.innerHeight || document.documentElement.clientHeight;
    return rect.top < h + (margin || 0) && rect.bottom > -(margin || 0);
  }

  function revealAll() {
    revealItems.forEach(function (el) { el.classList.add('is-visible'); });
  }

  if (!reduceMotion && 'IntersectionObserver' in window) {
    // 首屏元素立即显示，避免进入页面时先白一下
    revealItems.forEach(function (el, index) {
      // 同一屏内的元素错开一点，动效更自然
      el.style.transitionDelay = Math.min(index % 4, 3) * 70 + 'ms';
      if (isInViewport(el, -40)) el.classList.add('is-visible');
    });

    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -60px 0px' });

    revealItems.forEach(function (el) {
      if (!el.classList.contains('is-visible')) revealObserver.observe(el);
    });

    // 兜底 1：打印前把内容全部显示出来
    window.addEventListener('beforeprint', revealAll);

    // 兜底 2：个别渲染环境（无头浏览器、老版本内核）不触发 IntersectionObserver
    setTimeout(function () {
      revealItems.forEach(function (el) {
        if (!el.classList.contains('is-visible') && isInViewport(el, 220)) {
          el.classList.add('is-visible');
        }
      });
    }, 1200);
  } else {
    revealAll();
  }

  /* ------------------------------------------------------------------
     4. 首屏打字机
     ------------------------------------------------------------------ */
  var roleEl = $('#roleRotate');
  if (roleEl) {
    if (reduceMotion) {
      roleEl.textContent = CONFIG.roles[0];
    } else {
      var roleIndex = 0, charIndex = 0, deleting = false;
      (function tick() {
        var word = CONFIG.roles[roleIndex];
        charIndex += deleting ? -1 : 1;
        roleEl.textContent = word.slice(0, charIndex);

        var delay = deleting ? CONFIG.deleteSpeed : CONFIG.typeSpeed;
        if (!deleting && charIndex === word.length) {
          deleting = true;
          delay = CONFIG.holdTime;
        } else if (deleting && charIndex === 0) {
          deleting = false;
          roleIndex = (roleIndex + 1) % CONFIG.roles.length;
          delay = 320;
        }
        setTimeout(tick, delay);
      })();
    }
  }

  /* ------------------------------------------------------------------
     5. 技能分类筛选
     ------------------------------------------------------------------ */
  var skillFilter = $('#skillFilter');
  if (skillFilter) {
    var skillCards = $$('.skill-card', $('#skillGrid'));
    var skillEmpty = $('#skillEmpty');

    skillFilter.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter-btn');
      if (!btn) return;

      var filter = btn.dataset.filter;
      $$('.filter-btn', skillFilter).forEach(function (b) {
        var active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', String(active));
      });

      var visible = 0;
      skillCards.forEach(function (card) {
        var show = filter === 'all' || card.dataset.cat === filter;
        card.classList.toggle('is-hidden', !show);
        if (show) {
          visible++;
          // 重新播放入场动画，切换更有反馈感
          card.classList.remove('is-visible');
          requestAnimationFrame(function () { card.classList.add('is-visible'); });
        }
      });

      if (skillEmpty) skillEmpty.hidden = visible > 0;
    });
  }

  /* ------------------------------------------------------------------
     6. 项目详情弹窗
     ------------------------------------------------------------------ */
  var modal = $('#modal');
  var modalBody = $('#modalBody');
  var modalTitle = $('#modalTitle');
  var lastFocused = null;

  function openModal(sourceId, title) {
    if (!modal || !modalBody) return;
    var source = document.getElementById(sourceId);
    if (!source) return;

    lastFocused = document.activeElement;
    modalBody.innerHTML = source.innerHTML;
    if (modalTitle) modalTitle.textContent = title || '项目详情';

    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () { modal.classList.add('is-open'); });

    var closeBtn = $('.modal-close', modal);
    if (closeBtn) closeBtn.focus();
  }

  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(function () {
      modal.hidden = true;
      if (modalBody) modalBody.innerHTML = '';
    }, 240);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  $$('[data-modal]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var card = btn.closest('.project-card');
      var title = card ? ($('.project-title', card) || {}).textContent : '';
      openModal(btn.dataset.modal, title);
    });
  });

  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) closeModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (!modal.hidden) closeModal();
        closeMenu();
      }
      // 弹窗内 Tab 焦点循环
      if (e.key === 'Tab' && !modal.hidden) {
        var focusables = $$('button, a[href], input, textarea, [tabindex]:not([tabindex="-1"])', modal)
          .filter(function (el) { return el.offsetParent !== null; });
        if (!focusables.length) return;
        var first = focusables[0], last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ------------------------------------------------------------------
     7. 一键复制联系方式
     ------------------------------------------------------------------ */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    // 兼容非安全上下文（例如某些本地预览方式）
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy') ? resolve() : reject(new Error('copy failed'));
      } catch (err) {
        reject(err);
      } finally {
        document.body.removeChild(ta);
      }
    });
  }

  $$('[data-copy]').forEach(function (el) {
    el.addEventListener('click', function () {
      var value = el.dataset.copy;
      var label = el.dataset.copyLabel || '内容';
      copyText(value).then(function () {
        toast(label + '已复制：' + value);
      }).catch(function () {
        toast('复制失败，请手动选择：' + value);
      });
    });
  });

  /* ------------------------------------------------------------------
     8. 联系表单 → 调用本机邮件客户端
     ------------------------------------------------------------------ */
  var form = $('#contactForm');
  if (form) {
    var formError = $('#formError');

    function showError(message) {
      if (!formError) return;
      formError.textContent = message;
      formError.hidden = false;
    }
    function clearError() {
      if (formError) formError.hidden = true;
      $$('.field', form).forEach(function (f) { f.classList.remove('has-error'); });
    }

    form.addEventListener('input', function (e) {
      var field = e.target.closest('.field');
      if (field) field.classList.remove('has-error');
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearError();

      var name = $('#cf-name').value.trim();
      var from = $('#cf-from').value.trim();
      var subject = $('#cf-subject').value.trim();
      var message = $('#cf-message').value.trim();
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(from);

      if (!name)   { $('#cf-name').closest('.field').classList.add('has-error');   return showError('请填写你的称呼。'); }
      if (!emailOk) { $('#cf-from').closest('.field').classList.add('has-error');  return showError('请填写有效的邮箱地址。'); }
      if (!message) { $('#cf-message').closest('.field').classList.add('has-error'); return showError('请填写要发送的内容。'); }

      var finalSubject = subject || ('来自个人主页的留言 · ' + name);
      var body = message + '\n\n——\n' + name + '\n' + from;

      window.location.href = 'mailto:' + CONFIG.mailTo +
        '?subject=' + encodeURIComponent(finalSubject) +
        '&body=' + encodeURIComponent(body);

      toast('已打开邮件客户端，请确认后发送');
      form.reset();
    });

    form.addEventListener('reset', function () {
      clearError();
    });
  }

  /* ------------------------------------------------------------------
     9. 打印本页
     ------------------------------------------------------------------ */
  var printBtn = $('#printPage');
  if (printBtn) {
    printBtn.addEventListener('click', function () {
      toast('已调起打印，可选择「另存为 PDF」');
      setTimeout(function () { window.print(); }, 180);
    });
  }

  /* ------------------------------------------------------------------
     10. 页脚年份与最后更新时间
     ------------------------------------------------------------------ */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  var updatedEl = $('#lastUpdated');
  if (updatedEl) {
    var d = new Date(document.lastModified);
    updatedEl.textContent = isNaN(d.getTime())
      ? '—'
      : d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  /* ------------------------------------------------------------------
     11. 地址栏带 #锚点进入时，直接定位
     ------------------------------------------------------------------ */
  if (window.location.hash) {
    var target = document.getElementById(window.location.hash.slice(1));
    if (target) {
      setTimeout(function () {
        target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      }, 120);
    }
  }
})();
