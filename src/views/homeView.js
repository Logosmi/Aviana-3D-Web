import { BUILDINGS_CONFIG } from '../config/buildings.js';
import { buildCardResource, PLACEHOLDER_IMAGE } from '../lib/modelResolver.js';
import { getTheme, setTheme, toggleTheme } from '../main.js';

const INTRO_SLIDES = [
  {
    title: '像素中航大',
    subtitle: '用科技传承百年文脉，让中航大在虚拟世界中重新绽放',
    bg: '/assets/cards/demo.png'
  },
  {
    title: '关于我们的项目',
    content:
      '欢迎来到"像素中航大"！我们是一支由来自中航大各个学院的本科生组成的团队，用现代科技为百年中航大注入了新的活力。\n\n我们想向那些因地域限制无法来到中航大的人们分享中航大的景色，传递中航大的精神。',
    bg: '/assets/cards/demo.png'
  },
  {
    title: '我们做了什么',
    content:
      '完整复原东丽校区，开发 AI 智能导览系统，构建校史知识库，提供观光路线、明信片等沉浸式体验。',
    bg: '/assets/cards/demo.png'
  }
];

const ABOUT_INFO =
  '像素中航大：基于体素建模的虚拟校园重建。';

const SANDBOX_PRESET_POSITIONS = [
  { x: 18, y: 20 },
  { x: 208, y: 34 },
  { x: 88, y: 166 },
  { x: 256, y: 194 },
  { x: 26, y: 286 },
  { x: 204, y: 308 }
];

const SANDBOX_ITEM_WIDTH = 172;
const SANDBOX_ITEM_HEIGHT = 186;

function encodeHtml(raw) {
  return String(raw || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function makeCardHtml(card) {
  return `
    <article class="card" data-id="${card.id}">
      <div class="card-media-wrap">
        <img src="${card.imageUrl}" alt="${card.title}" class="card-media" loading="lazy" />
        <div class="card-gradient"></div>
        <h3 class="card-title">${card.title}</h3>
      </div>
      <p class="card-author">改造者：${card.author || '未知'}</p>
    </article>
  `;
}

function makeSlideHtml(slide, idx, active) {
  return `
    <section class="intro-slide ${active ? 'active' : ''}" data-index="${idx}">
      <img class="intro-bg" src="${slide.bg || PLACEHOLDER_IMAGE}" alt="intro" />
      <div class="intro-shade"></div>
      <div class="intro-content">
        <h2>${slide.title}</h2>
        ${slide.subtitle ? `<p class="intro-subtitle">${slide.subtitle}</p>` : ''}
        ${slide.content ? `<p class="intro-text">${slide.content}</p>` : ''}
      </div>
    </section>
  `;
}

function makeSandboxLibraryHtml(card, isPlaced) {
  return `
    <button
      type="button"
      class="sandbox-library-card ${isPlaced ? 'is-active' : ''}"
      data-act="add-sandbox-item"
      data-model-id="${encodeHtml(card.id)}"
      ${isPlaced ? 'disabled' : ''}
    >
      <div class="sandbox-library-media">
        <img src="${encodeHtml(card.imageUrl)}" alt="${encodeHtml(card.title)}" class="sandbox-library-image" loading="lazy" />
      </div>
      <div class="sandbox-library-copy">
        <strong>${encodeHtml(card.title)}</strong>
        <span>${encodeHtml(card.author || '未知工作室')}</span>
      </div>
      <span class="sandbox-library-action">${isPlaced ? '已在沙盒' : '添加到沙盒'}</span>
    </button>
  `;
}

function makeSandboxItemHtml(item, card, index) {
  return `
    <article
      class="sandbox-item"
      data-instance-id="${encodeHtml(item.instanceId)}"
      style="transform: translate3d(${item.x}px, ${item.y}px, 0); z-index: ${20 + index};"
    >
      <button
        type="button"
        class="sandbox-item-remove"
        data-act="remove-sandbox-item"
        data-instance-id="${encodeHtml(item.instanceId)}"
        aria-label="移除 ${encodeHtml(card.title)}"
        title="移除"
      >×</button>
      <div class="sandbox-item-badge">Sandbox</div>
      <div class="sandbox-item-media">
        <img src="${encodeHtml(card.imageUrl)}" alt="${encodeHtml(card.title)}" class="sandbox-item-image" loading="lazy" />
      </div>
      <div class="sandbox-item-copy">
        <h3>${encodeHtml(card.title)}</h3>
        <p>${encodeHtml(card.author || '未知工作室')}</p>
      </div>
    </article>
  `;
}

function makeThemeToggleHtml() {
  const isDark = getTheme() === 'dark';
  return `
    <button class="theme-toggle" data-act="toggle-theme" aria-label="切换主题" title="切换主题">
      <span class="icon-sun">☀</span>
      <span class="icon-moon">☽</span>
    </button>
  `;
}

export function renderHomeView(container, { onOpenModel, initialView = 'intro' }) {
  const cards = BUILDINGS_CONFIG.map(buildCardResource);
  const sandboxCatalog = cards.filter((card) => card.sandboxEnabled);
  const sandboxCardMap = new Map(sandboxCatalog.map((card) => [card.id, card]));
  let activeTab = 'campus';
  let slideIndex = 0;
  let sandboxSequence = 0;
  let sandboxDragState = null;
  let sandboxItems = sandboxCatalog.slice(0, Math.min(2, sandboxCatalog.length)).map((card, index) => {
    const preset = SANDBOX_PRESET_POSITIONS[index % SANDBOX_PRESET_POSITIONS.length];
    sandboxSequence += 1;
    return {
      instanceId: `sandbox-${sandboxSequence}`,
      modelId: card.id,
      x: preset.x,
      y: preset.y
    };
  });

  container.innerHTML = `
    <main class="home-root">
      <div class="atmosphere"></div>

      <div class="home-content">
        <header class="top-bar">
          <div class="logo-block">
            <p class="logo-kicker"><span class="cursor-prompt">></span> voxelcauc --launch</p>
            <h1>虚拟校园档案馆</h1>
          </div>
          ${makeThemeToggleHtml()}
        </header>

        <section class="intro" data-el="intro-hero">
          <div class="intro-slides">
            ${INTRO_SLIDES.map((slide, idx) => makeSlideHtml(slide, idx, idx === slideIndex)).join('')}
          </div>
          <button class="intro-edge-nav left" data-intro-nav="prev" aria-label="上一页" title="上一页">&lt;</button>
          <button class="intro-edge-nav right" data-intro-nav="next" aria-label="下一页" title="下一页">&gt;</button>
          <div class="intro-controls">
            <div class="intro-dots">
              ${INTRO_SLIDES.map(
                (_, idx) =>
                  `<button class="dot ${idx === slideIndex ? 'active' : ''}" data-slide-to="${idx}" aria-label="跳转到第${idx + 1}页"></button>`
              ).join('')}
            </div>
          </div>
          <div class="scroll-hint">
            <span>Scroll</span>
            <div class="scroll-hint-arrow"></div>
          </div>
        </section>

        <nav class="switcher">
          <button class="switch" data-tab="campus">[ 东丽校区 ]</button>
          <button class="switch" data-tab="about">[ 关于项目 ]</button>
          <div class="switch-track"></div>
        </nav>

        <section class="panel" id="campus-panel">
          <div class="grid">
            ${cards.map(makeCardHtml).join('')}
          </div>
        </section>

        <section class="panel about hidden" id="about-panel">
          <div class="about-layout">
            <div class="about-card">
              <h2>项目简介</h2>
              <p>${ABOUT_INFO}</p>
              <h3>版本信息</h3>
              <p>v0.0.1</p>
              <h3>交流群</h3>
              <img src="/assets/qrcode_group.jpg" alt="交流群二维码" height="200" />
              <p>CAUCraft 神人竞技场：496981669</p>
              <p class="icp">暂无</p>
            </div>

            <section class="about-sandbox">
              <div class="about-sandbox-head">
                <div>
                  <p class="about-sandbox-kicker">Sandbox</p>
                  <h2>模型沙盒分区</h2>
                </div>
                <button type="button" class="sandbox-clear-btn" data-act="clear-sandbox">$ clear</button>
              </div>
              <p class="about-sandbox-copy">
                这里会收纳已启用的模型卡片。点击下方仓库可添加，拖拽卡片可自由摆放，用于快速浏览和编排展示组合。
              </p>
              <div class="sandbox-meta">
                <span data-el="sandbox-count">0 / 0 已摆放</span>
                <span>拖拽卡片微调位置</span>
              </div>
              <div class="sandbox-board" data-el="sandbox-board"></div>
              <div class="sandbox-library">
                <div class="sandbox-library-head">
                  <h3>已启用模型仓库</h3>
                  <p>${sandboxCatalog.length} 个模型可加入沙盒</p>
                </div>
                <div class="sandbox-library-grid" data-el="sandbox-library"></div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  `;

  const rootEl = container.querySelector('.home-root');
  const switchTrack = container.querySelector('.switch-track');
  const campusPanel = container.querySelector('#campus-panel');
  const aboutPanel = container.querySelector('#about-panel');
  const sandboxBoard = container.querySelector('[data-el="sandbox-board"]');
  const sandboxLibrary = container.querySelector('[data-el="sandbox-library"]');
  const sandboxCount = container.querySelector('[data-el="sandbox-count"]');
  const introHero = container.querySelector('[data-el="intro-hero"]');

  function createSandboxItem(modelId) {
    const preset = SANDBOX_PRESET_POSITIONS[sandboxSequence % SANDBOX_PRESET_POSITIONS.length];
    sandboxSequence += 1;
    return {
      instanceId: `sandbox-${sandboxSequence}`,
      modelId,
      x: preset.x,
      y: preset.y
    };
  }

  function syncSandboxBounds() {
    if (!sandboxBoard || sandboxBoard.clientWidth <= 0 || sandboxBoard.clientHeight <= 0) return;

    const maxX = Math.max(sandboxBoard.clientWidth - SANDBOX_ITEM_WIDTH, 0);
    const maxY = Math.max(sandboxBoard.clientHeight - SANDBOX_ITEM_HEIGHT, 0);
    let changed = false;

    sandboxItems = sandboxItems.map((item) => {
      const nextX = clamp(item.x, 0, maxX);
      const nextY = clamp(item.y, 0, maxY);
      if (nextX !== item.x || nextY !== item.y) {
        changed = true;
        return { ...item, x: nextX, y: nextY };
      }
      return item;
    });

    if (changed) {
      sandboxBoard.querySelectorAll('.sandbox-item').forEach((itemEl) => {
        const target = sandboxItems.find((entry) => entry.instanceId === itemEl.getAttribute('data-instance-id'));
        if (!target) return;
        itemEl.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`;
      });
    }
  }

  function syncSandboxUi() {
    if (!sandboxBoard || !sandboxLibrary || !sandboxCount) return;

    sandboxCount.textContent = `${sandboxItems.length} / ${sandboxCatalog.length} 已摆放`;

    if (!sandboxItems.length) {
      sandboxBoard.innerHTML = `
        <div class="sandbox-board-empty">
          <strong>沙盒还空着</strong>
          <span>从下方模型仓库里挑几张卡片，拖进这块区域开始编排。</span>
        </div>
      `;
    } else {
      sandboxBoard.innerHTML = sandboxItems
        .map((item, index) => {
          const card = sandboxCardMap.get(item.modelId);
          return card ? makeSandboxItemHtml(item, card, index) : '';
        })
        .join('');
    }

    sandboxLibrary.innerHTML = sandboxCatalog.length
      ? sandboxCatalog
          .map((card) => makeSandboxLibraryHtml(card, sandboxItems.some((item) => item.modelId === card.id)))
          .join('')
      : '<p class="sandbox-empty-copy">当前还没有启用沙盒的模型。</p>';

    if (activeTab === 'about') {
      requestAnimationFrame(syncSandboxBounds);
    }
  }

  function syncTabUi() {
    const campusActive = activeTab === 'campus';
    campusPanel?.classList.toggle('hidden', !campusActive);
    aboutPanel?.classList.toggle('hidden', campusActive);

    const switches = container.querySelectorAll('.switch');
    switches.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === activeTab);
    });

    switchTrack?.classList.toggle('left', campusActive);
    switchTrack?.classList.toggle('right', !campusActive);

    if (!campusActive) {
      syncSandboxUi();
    }
  }

  function syncSlideUi() {
    const slides = container.querySelectorAll('.intro-slide');
    const dots = container.querySelectorAll('.dot');
    slides.forEach((slide, idx) => {
      slide.classList.toggle('active', idx === slideIndex);
    });
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === slideIndex);
      dot.setAttribute('aria-current', idx === slideIndex ? 'true' : 'false');
    });
  }

  function turnSlide(direction) {
    if (direction === 'next') {
      slideIndex = (slideIndex + 1) % INTRO_SLIDES.length;
    } else {
      slideIndex = (slideIndex - 1 + INTRO_SLIDES.length) % INTRO_SLIDES.length;
    }
    syncSlideUi();
  }

  // ── Theme toggle ───────────────────────────────────────
  container.querySelector('[data-act="toggle-theme"]')?.addEventListener('click', () => {
    toggleTheme();
    // CSS handles the icon visibility
  });

  // ── Tab switching ──────────────────────────────────────
  container.querySelectorAll('.switch').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab || 'campus';
      syncTabUi();
    });
  });

  // ── Card clicks ────────────────────────────────────────
  container.querySelectorAll('.card').forEach((cardEl) => {
    cardEl.addEventListener('click', () => {
      const target = cards.find((item) => item.id === cardEl.dataset.id);
      if (!target) return;
      onOpenModel(target.id, 'showcase');
    });
  });

  // ── Sandbox interactions ───────────────────────────────
  aboutPanel?.addEventListener('click', (evt) => {
    const clearButton = evt.target.closest('[data-act="clear-sandbox"]');
    if (clearButton) {
      sandboxItems = [];
      syncSandboxUi();
      return;
    }

    const addButton = evt.target.closest('[data-act="add-sandbox-item"]');
    if (addButton) {
      const modelId = addButton.getAttribute('data-model-id') || '';
      if (!modelId || sandboxItems.some((item) => item.modelId === modelId)) return;
      sandboxItems = [...sandboxItems, createSandboxItem(modelId)];
      syncSandboxUi();
      return;
    }

    const removeButton = evt.target.closest('[data-act="remove-sandbox-item"]');
    if (removeButton) {
      const instanceId = removeButton.getAttribute('data-instance-id') || '';
      sandboxItems = sandboxItems.filter((item) => item.instanceId !== instanceId);
      syncSandboxUi();
    }
  });

  // ── Slide navigation ───────────────────────────────────
  container.querySelectorAll('[data-slide-to]').forEach((dotButton) => {
    dotButton.addEventListener('click', () => {
      const targetIndex = Number(dotButton.getAttribute('data-slide-to'));
      if (!Number.isInteger(targetIndex)) return;
      slideIndex = Math.max(0, Math.min(INTRO_SLIDES.length - 1, targetIndex));
      syncSlideUi();
    });
  });

  container.querySelectorAll('[data-intro-nav]').forEach((navButton) => {
    navButton.addEventListener('click', () => {
      turnSlide(navButton.getAttribute('data-intro-nav') === 'next' ? 'next' : 'prev');
    });
  });

  // ── Swipe / Gesture (slide navigation only) ────────────
  let startX = 0;
  let startY = 0;
  let startTime = 0;
  let tracking = false;
  let activePointerId = null;
  let activeTouchId = null;
  let wheelLockUntil = 0;

  const SWIPE_MIN_DISTANCE = 42;
  const SWIPE_MAX_DURATION = 700;

  function handleSwipe(dx, dy, elapsed) {
    if (elapsed > SWIPE_MAX_DURATION) return;

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (absX < SWIPE_MIN_DISTANCE && absY < SWIPE_MIN_DISTANCE) return;

    if (absX > absY) {
      turnSlide(dx < 0 ? 'next' : 'prev');
    }
  }

  function onPointerDown(evt) {
    if (evt.pointerType === 'mouse' && evt.button !== 0) return;
    tracking = true;
    activePointerId = evt.pointerId;
    startX = evt.clientX;
    startY = evt.clientY;
    startTime = Date.now();
    if (evt.pointerType !== 'mouse') {
      rootEl?.setPointerCapture?.(evt.pointerId);
    }
  }

  function onPointerMove(evt) {
    if (!tracking) return;
    let clientX = evt.clientX;
    let clientY = evt.clientY;
    if (evt.type && evt.type.startsWith('touch')) {
      const t = (evt.touches && evt.touches[0]) || (evt.changedTouches && evt.changedTouches[0]);
      if (!t) return;
      if (activeTouchId !== null && t.identifier !== activeTouchId) return;
      clientX = t.clientX;
      clientY = t.clientY;
    } else {
      if (activePointerId !== null && evt.pointerId !== activePointerId) return;
    }
  }

  function onPointerEnd(evt) {
    if (!tracking) return;
    if (activePointerId !== null && evt.pointerId !== activePointerId) return;
    tracking = false;
    activePointerId = null;

    handleSwipe(evt.clientX - startX, evt.clientY - startY, Date.now() - startTime);
  }

  function onPointerCancel() {
    tracking = false;
    activePointerId = null;
  }

  function onTouchStart(evt) {
    if (!evt.touches || evt.touches.length === 0) return;
    const touch = evt.touches[0];
    tracking = true;
    activeTouchId = touch.identifier;
    startX = touch.clientX;
    startY = touch.clientY;
    startTime = Date.now();
  }

  function onTouchEnd(evt) {
    if (!tracking) return;
    tracking = false;

    const touch = Array.from(evt.changedTouches || []).find((item) => item.identifier === activeTouchId);
    activeTouchId = null;
    if (!touch) return;

    handleSwipe(touch.clientX - startX, touch.clientY - startY, Date.now() - startTime);
  }

  function onTouchCancel() {
    tracking = false;
    activeTouchId = null;
  }

  function onWheel(evt) {
    const now = Date.now();
    if (now < wheelLockUntil) return;

    const absX = Math.abs(evt.deltaX);
    const absY = Math.abs(evt.deltaY);

    if (absX > absY && absX > 40) {
      turnSlide(evt.deltaX > 0 ? 'next' : 'prev');
      wheelLockUntil = now + 420;
    }
  }

  function onKeyDown(evt) {
    const targetTag = evt.target?.tagName;
    if (targetTag === 'INPUT' || targetTag === 'TEXTAREA') return;

    if (evt.key === 'ArrowLeft') {
      evt.preventDefault();
      turnSlide('prev');
      return;
    }

    if (evt.key === 'ArrowRight') {
      evt.preventDefault();
      turnSlide('next');
    }
  }

  // ── Sandbox drag ───────────────────────────────────────
  function onSandboxPointerDown(evt) {
    if (activeTab !== 'about') return;
    if (evt.button !== 0) return;

    const itemEl = evt.target.closest('.sandbox-item');
    if (!itemEl || !sandboxBoard?.contains(itemEl)) return;
    if (evt.target.closest('button')) return;

    const instanceId = itemEl.getAttribute('data-instance-id') || '';
    const item = sandboxItems.find((entry) => entry.instanceId === instanceId);
    if (!item) return;

    const boardRect = sandboxBoard.getBoundingClientRect();
    const itemRect = itemEl.getBoundingClientRect();
    sandboxDragState = {
      pointerId: evt.pointerId,
      instanceId,
      startX: evt.clientX,
      startY: evt.clientY,
      originX: item.x,
      originY: item.y,
      maxX: Math.max(boardRect.width - itemRect.width, 0),
      maxY: Math.max(boardRect.height - itemRect.height, 0),
      itemEl
    };

    itemEl.classList.add('is-dragging');
    evt.preventDefault();
  }

  function onSandboxPointerMove(evt) {
    if (!sandboxDragState || evt.pointerId !== sandboxDragState.pointerId) return;

    const dx = evt.clientX - sandboxDragState.startX;
    const dy = evt.clientY - sandboxDragState.startY;
    const nextX = clamp(sandboxDragState.originX + dx, 0, sandboxDragState.maxX);
    const nextY = clamp(sandboxDragState.originY + dy, 0, sandboxDragState.maxY);

    sandboxItems = sandboxItems.map((item) =>
      item.instanceId === sandboxDragState.instanceId ? { ...item, x: nextX, y: nextY } : item
    );

    sandboxDragState.itemEl.style.transform = `translate3d(${nextX}px, ${nextY}px, 0)`;
  }

  function onSandboxPointerUp(evt) {
    if (!sandboxDragState || evt.pointerId !== sandboxDragState.pointerId) return;
    sandboxDragState.itemEl.classList.remove('is-dragging');
    sandboxDragState = null;
  }

  function onSandboxResize() {
    if (activeTab === 'about') {
      syncSandboxBounds();
    }
  }

  // ── Event binding ──────────────────────────────────────
  const gestureTarget = document;
  gestureTarget.addEventListener('pointerdown', onPointerDown, true);
  gestureTarget.addEventListener('pointermove', onPointerMove, true);
  gestureTarget.addEventListener('pointerup', onPointerEnd, true);
  gestureTarget.addEventListener('pointercancel', onPointerCancel, true);
  gestureTarget.addEventListener('touchstart', onTouchStart, { passive: false, capture: true });
  gestureTarget.addEventListener('touchmove', onPointerMove, { passive: false, capture: true });
  gestureTarget.addEventListener('touchend', onTouchEnd, { passive: false, capture: true });
  gestureTarget.addEventListener('touchcancel', onTouchCancel, { passive: false, capture: true });
  gestureTarget.addEventListener('wheel', onWheel, { passive: true, capture: true });
  window.addEventListener('keydown', onKeyDown);
  aboutPanel?.addEventListener('pointerdown', onSandboxPointerDown);
  window.addEventListener('pointermove', onSandboxPointerMove);
  window.addEventListener('pointerup', onSandboxPointerUp);
  window.addEventListener('pointercancel', onSandboxPointerUp);
  window.addEventListener('resize', onSandboxResize);

  syncTabUi();
  syncSlideUi();
  syncSandboxUi();

  // ── Scroll to content for showcase mode ────────────────
  if (initialView === 'showcase' && introHero) {
    requestAnimationFrame(() => {
      const heroBottom = introHero.getBoundingClientRect().bottom + window.scrollY;
      window.scrollTo({ top: heroBottom, behavior: 'instant' });
    });
  }

  return () => {
    gestureTarget.removeEventListener('pointerdown', onPointerDown, true);
    gestureTarget.removeEventListener('pointermove', onPointerMove, true);
    gestureTarget.removeEventListener('pointerup', onPointerEnd, true);
    gestureTarget.removeEventListener('pointercancel', onPointerCancel, true);
    gestureTarget.removeEventListener('touchstart', onTouchStart, { capture: true });
    gestureTarget.removeEventListener('touchmove', onPointerMove, { capture: true });
    gestureTarget.removeEventListener('touchend', onTouchEnd, { capture: true });
    gestureTarget.removeEventListener('touchcancel', onTouchCancel, { capture: true });
    gestureTarget.removeEventListener('wheel', onWheel, { capture: true });
    window.removeEventListener('keydown', onKeyDown);
    aboutPanel?.removeEventListener('pointerdown', onSandboxPointerDown);
    window.removeEventListener('pointermove', onSandboxPointerMove);
    window.removeEventListener('pointerup', onSandboxPointerUp);
    window.removeEventListener('pointercancel', onSandboxPointerUp);
    window.removeEventListener('resize', onSandboxResize);
    container.innerHTML = '';
  };
}
