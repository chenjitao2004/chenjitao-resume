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
    mailTo: '1499938212@qq.com',

    /* ---- 在线表单投递 --------------------------------------------------
       当前使用 FormSubmit（免注册，邮件直接发到 mailTo 那个地址）。

       ⚠️ 首次使用必须先激活：FormSubmit 会给你发一封标题含 "Activate Form"
          的邮件，点里面的链接即可，之后永久生效。

       想换服务也可以：
       · Formspree：formEndpoint 填 'https://formspree.io/f/你的表单ID'，key 留空
       · Web3Forms：formEndpoint 填 'https://api.web3forms.com/submit'，填上 key
                    （实测 Web3Forms 对 CORS 预检一律 403，浏览器端用不了，仅作备用）

       代码用 FormData 提交，不触发 CORS 预检 —— 不要改成 application/json。
       两个值都留空时，自动退回「打开访客的邮件客户端」模式。
       ------------------------------------------------------------------ */
    formAccessKey: '',
    formEndpoint: 'https://formsubmit.co/ajax/1499938212@qq.com'
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
      themeColorMeta.setAttribute('content', theme === 'dark' ? '#0a0611' : '#3b0764');
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
    // 首屏元素立即显示，避免进入页面时先白一下；顺序错开，动效更有节奏
    revealItems.forEach(function (el, index) {
      el.style.transitionDelay = Math.min(index % 5, 4) * 80 + 'ms';
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
     3.5 动效增强：逐字标题 / 入场变体 / 数字滚动 / 光标暖光 / 卡片倾斜
     全部只用 transform 与 opacity，保持合成层友好，不给滚动添负担
     ------------------------------------------------------------------ */

  /* 3.5.1 姓名逐字上浮（动画由 CSS 触发，这里只负责拆分字符） */
  var heroName = $('#heroName');
  if (heroName) {
    var nameText = heroName.textContent.trim();
    if (!reduceMotion) {
      heroName.textContent = '';
      nameText.split('').forEach(function (ch, i) {
        var span = document.createElement('span');
        span.className = 'ch';
        span.style.setProperty('--i', i);
        span.textContent = ch;
        heroName.appendChild(span);
      });
    }
    // 屏幕阅读器读到的是完整姓名，而不是逐字
    heroName.setAttribute('aria-label', nameText);
  }

  /* 3.5.2 给栅格内的元素自动分配入场方向 */
  ['.about-grid', '.skill-grid', '.project-grid', '.cert-grid', '.eval-grid'].forEach(function (sel) {
    var grid = $(sel);
    if (!grid) return;
    $$('.reveal', grid).forEach(function (el, i) {
      if (el.hasAttribute('data-anim')) return;
      el.setAttribute('data-anim', i % 3 === 0 ? 'left' : (i % 3 === 1 ? 'scale' : 'right'));
    });
  });

  /* 3.5.3 首屏数字滚动 */
  var counters = $$('[data-count]');
  if (counters.length && !reduceMotion && 'IntersectionObserver' in window) {
    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        countObserver.unobserve(el);
        var target = parseInt(el.dataset.count, 10);
        if (isNaN(target)) return;
        var start = null, dur = 1100;
        (function step(ts) {
          if (start === null) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          // easeOutExpo，收尾更利落
          var eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
          el.textContent = String(Math.round(target * eased));
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = String(target);
        })(performance.now());
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { countObserver.observe(el); });
  }

  /* 3.5.4 跑马灯：内容复制一份，实现无缝循环 */
  var marqueeTrack = $('#marqueeTrack');
  if (marqueeTrack) {
    marqueeTrack.innerHTML += marqueeTrack.innerHTML;
  }

  /* 3.5.5 跟随鼠标的暖光（仅精确指针设备） */
  var glow = $('#cursorGlow');
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (glow && finePointer && !reduceMotion) {
    var gx = 0, gy = 0, cx = 0, cy = 0, glowOn = false, glowRaf = 0;

    function glowLoop() {
      // 缓动跟随，比硬跟随更有质感
      cx += (gx - cx) * 0.12;
      cy += (gy - cy) * 0.12;
      glow.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
      if (Math.abs(gx - cx) > 0.5 || Math.abs(gy - cy) > 0.5) {
        glowRaf = requestAnimationFrame(glowLoop);
      } else {
        glowRaf = 0;
      }
    }

    document.addEventListener('mousemove', function (e) {
      gx = e.clientX; gy = e.clientY;
      if (!glowOn) { cx = gx; cy = gy; glowOn = true; glow.classList.add('is-on'); }
      if (!glowRaf) glowRaf = requestAnimationFrame(glowLoop);
    }, { passive: true });

    document.addEventListener('mouseleave', function () {
      glow.classList.remove('is-on');
      glowOn = false;
    });
  }

  /* 3.5.6 项目卡轻微 3D 倾斜 */
  if (finePointer && !reduceMotion) {
    $$('.project-card').forEach(function (card) {
      var raf = 0, rx = 0, ry = 0;

      function apply() {
        card.style.transform =
          'perspective(1000px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) +
          'deg) translateY(-4px)';
        raf = 0;
      }

      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        ry = px * 6;
        rx = -py * 6;
        card.classList.add('is-tilting');
        if (!raf) raf = requestAnimationFrame(apply);
      }, { passive: true });

      card.addEventListener('mouseleave', function () {
        card.classList.remove('is-tilting');
        card.style.transform = '';
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
      });
    });
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
     8. 联系表单 → 在线投递，失败则退回邮件客户端
     ------------------------------------------------------------------ */
  var form = $('#contactForm');
  if (form) {
    var formError = $('#formError');
    var formOk = $('#formOk');
    var submitBtn = $('#formSubmit');

    function showError(message) {
      if (formOk) formOk.hidden = true;
      if (!formError) return;
      formError.textContent = message;
      formError.hidden = false;
    }
    function showOk(message) {
      if (formError) formError.hidden = true;
      if (!formOk) return;
      formOk.textContent = message;
      formOk.hidden = false;
    }
    function clearStatus() {
      if (formError) formError.hidden = true;
      if (formOk) formOk.hidden = true;
      $$('.field', form).forEach(function (f) { f.classList.remove('has-error'); });
    }
    function setLoading(on) {
      if (!submitBtn) return;
      submitBtn.disabled = on;
      submitBtn.style.opacity = on ? '.65' : '';
      submitBtn.textContent = on ? '发送中…' : '';
      if (!on) {
        submitBtn.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-send"></use></svg> 发送消息';
      }
    }

    /* 兜底通道：唤起访客本机邮件客户端 */
    function openMailClient(data) {
      window.location.href = 'mailto:' + CONFIG.mailTo +
        '?subject=' + encodeURIComponent(data.subject) +
        '&body=' + encodeURIComponent(data.body);
    }

    form.addEventListener('input', function (e) {
      var field = e.target.closest('.field');
      if (field) field.classList.remove('has-error');
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearStatus();

      var name = $('#cf-name').value.trim();
      var email = $('#cf-email').value.trim();
      var subject = $('#cf-subject').value.trim();
      var message = $('#cf-message').value.trim();
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

      if (!name)    { $('#cf-name').closest('.field').classList.add('has-error');    return showError('请填写你的称呼。'); }
      if (!emailOk) { $('#cf-email').closest('.field').classList.add('has-error');   return showError('请填写有效的邮箱地址。'); }
      if (!message) { $('#cf-message').closest('.field').classList.add('has-error'); return showError('请填写要发送的内容。'); }

      var finalSubject = subject || ('来自个人主页的留言 · ' + name);
      var mail = {
        subject: finalSubject,
        body: message + '\n\n——\n' + name + '\n' + email
      };

      /* 判断依据是「有没有配投递地址」，不是「有没有 key」。
         FormSubmit / Formspree 都不需要 key，用 key 判断会永远走不到在线投递。 */
      if (!CONFIG.formEndpoint) {
        openMailClient(mail);
        form.reset();
        showOk('已打开你的邮件客户端，确认后发送即可。');   // 必须放在 reset 之后
        return;
      }

      setLoading(true);

      /* 用 FormData 提交，不手动设 Content-Type。
         multipart/form-data 属于 CORS 的「安全内容类型」，浏览器不会先发
         OPTIONS 预检请求 —— Web3Forms 会直接 403 掉预检，用 application/json
         就必然失败。多带的字段对其它服务无副作用，所以这里一次兼容三家。 */
      var payload = new FormData();
      if (CONFIG.formAccessKey) payload.append('access_key', CONFIG.formAccessKey); // Web3Forms
      payload.append('name', name);
      payload.append('email', email);
      payload.append('message', message);
      payload.append('from_name', name);
      payload.append('subject', finalSubject);    // Web3Forms 用
      payload.append('_subject', finalSubject);   // FormSubmit 用
      payload.append('_template', 'table');       // FormSubmit 邮件排版
      payload.append('_captcha', 'false');        // FormSubmit：关掉验证码，否则 AJAX 会被挡
      payload.append('botcheck', '');

      fetch(CONFIG.formEndpoint, { method: 'POST', body: payload })
        .then(function (res) {
          return res.text().then(function (text) {
            var data = {};
            try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }
            return { ok: res.ok, status: res.status, data: data };
          });
        })
        .then(function (res) {
          /* 三家成功时的返回各不相同：
             FormSubmit → {"success":"true"}（字符串）
             Web3Forms  → {"success":true}（布尔）
             Formspree  → {"ok":true} */
          var s = res.data ? res.data.success : null;
          var good = res.ok &&
            (s === true || s === 'true' || (res.data && res.data.ok === true));
          if (good) {
            setLoading(false);
            form.reset();
            showOk('已经发送到我的邮箱了，我会尽快回复你。');   // 必须放在 reset 之后
            toast('发送成功');
          } else {
            throw new Error('submit failed: HTTP ' + res.status);
          }
        })
        .catch(function () {
          // 网络或服务异常时不让留言丢失：自动改走邮件客户端
          setLoading(false);
          openMailClient(mail);
          showOk('在线投递没成功，已改为打开你的邮件客户端，确认后发送即可。');
          toast('已切换为邮件客户端发送');
        });
    });

    form.addEventListener('reset', function () {
      clearStatus();
    });
  }

  /* ------------------------------------------------------------------
     8.5 微信二维码：卡片默认显示，只在图片确实加载失败时才收起来
     注意别反过来写（默认隐藏 + 懒加载）——display:none 的元素没有布局盒，
     懒加载永远不会触发，于是 load 事件不来，卡片就永远不显示了。
     ------------------------------------------------------------------ */
  var wechatCard = $('#wechatCard');
  var wechatQr = $('#wechatQr');
  if (wechatCard && wechatQr) {
    var hideWechat = function () { wechatCard.hidden = true; };
    if (wechatQr.complete && wechatQr.naturalWidth === 0) hideWechat();
    wechatQr.addEventListener('error', hideWechat);
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
