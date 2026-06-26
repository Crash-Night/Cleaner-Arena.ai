(async () => {
  window.__arenaDeleteStop = false; // Para parar: window.__arenaDeleteStop = true

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const MAX_IDLE = 10;
  const MENU_TIMEOUT = 2500;
  const CONFIRM_TIMEOUT = 3000;

  const ACTION_SEL = 'button, [role="button"], [role="menuitem"], a';

  const MENU_RX = [
    /^more options$/i,
    /more\s*options/i,
    /opciones/i,
    /acciones/i,
    /^\.{3}$/,
    /⋯/,
    /•••/
  ];

  const DELETE_RX = [
    /^delete$/i,
    /delete/i,
    /^eliminar$/i,
    /eliminar/i,
    /^borrar$/i,
    /borrar/i,
    /remove/i
  ];

  const CONFIRM_RX = [
    /^yes,\s*delete$/i,
    /yes.*delete/i,
    /^delete$/i,
    /confirm/i,
    /confirmar/i,
    /^sí$/i,
    /^yes$/i
  ];

  const CANCEL_RX = [
    /cancel/i,
    /cancelar/i,
    /close/i,
    /cerrar/i,
    /^no$/i
  ];

  const norm = s => (s || "").replace(/\s+/g, " ").trim();

  const textOf = el => norm([
    el?.innerText,
    el?.textContent,
    el?.getAttribute?.("aria-label"),
    el?.getAttribute?.("title")
  ].filter(Boolean).join(" "));

  const isVisible = el => {
    if (!el || !document.contains(el)) return false;
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return (
      r.width > 0 &&
      r.height > 0 &&
      s.display !== "none" &&
      s.visibility !== "hidden" &&
      s.opacity !== "0"
    );
  };

  const matches = (el, arr) => arr.some(rx => rx.test(textOf(el)));

  const getActionables = (root = document) =>
    [...root.querySelectorAll(ACTION_SEL)].filter(isVisible);

  const findAllByText = (patterns, root = document) =>
    getActionables(root).filter(el => matches(el, patterns));

  const findFirstByText = (patterns, root = document) =>
    findAllByText(patterns, root)
      .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0] || null;

  const findConfirm = (root = document) =>
    getActionables(root).find(el => matches(el, CONFIRM_RX) && !matches(el, CANCEL_RX)) || null;

  const uniqueMenus = (root = document) => {
    const seen = new Set();
    return findAllByText(MENU_RX, root)
      .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)
      .filter(el => {
        const r = el.getBoundingClientRect();
        const key = `${Math.round(r.top)}|${Math.round(r.left)}|${Math.round(r.width)}|${textOf(el)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  };

  const isScrollable = el => {
    if (!el || !isVisible(el)) return false;
    const s = getComputedStyle(el);
    return /(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 80;
  };

  function getScrollContainer() {
    const candidates = [
      document.scrollingElement,
      ...document.querySelectorAll("main, aside, section, div, ul, ol")
    ];

    let best = document.scrollingElement;
    let bestScore = -1;

    for (const el of candidates) {
      if (!isScrollable(el)) continue;

      let menuCount = 0;
      try {
        menuCount = [...el.querySelectorAll(ACTION_SEL)]
          .filter(isVisible)
          .filter(x => matches(x, MENU_RX)).length;
      } catch {}

      const score = menuCount * 1000 + Math.min(el.clientHeight, 1200);

      if (score > bestScore) {
        best = el;
        bestScore = score;
      }
    }

    return best || document.scrollingElement;
  }

  async function waitFor(fn, timeout = 2000, interval = 100) {
    const end = performance.now() + timeout;

    while (performance.now() < end) {
      if (window.__arenaDeleteStop) throw new Error("Detenido manualmente");
      const val = fn();
      if (val) return val;
      await sleep(interval);
    }

    return null;
  }

  async function smartClick(el) {
    if (!el) return false;

    try {
      el.scrollIntoView({ block: "center", inline: "nearest" });
    } catch {}

    await sleep(120);

    const r = el.getBoundingClientRect();
    const x = Math.max(1, Math.min(window.innerWidth - 1, r.left + r.width / 2));
    const y = Math.max(1, Math.min(window.innerHeight - 1, r.top + r.height / 2));
    const target = document.elementFromPoint(x, y) || el;

    const fireMouse = type => {
      try {
        target.dispatchEvent(new MouseEvent(type, {
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y,
          view: window
        }));
      } catch {}
    };

    const firePointer = type => {
      try {
        target.dispatchEvent(new PointerEvent(type, {
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y,
          view: window
        }));
      } catch {}
    };

    if (window.PointerEvent) {
      firePointer("pointerdown");
      firePointer("pointerup");
    }

    fireMouse("mousedown");
    fireMouse("mouseup");
    fireMouse("click");

    try { el.click(); } catch {}

    await sleep(500);
    return true;
  }

  async function closeOverlays() {
    try {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      document.dispatchEvent(new KeyboardEvent("keyup", { key: "Escape", bubbles: true }));
    } catch {}

    try { document.body.click(); } catch {}

    await sleep(200);
  }

  async function scrollNext(box, idle) {
    const isWindow = box === document.scrollingElement;
    const view = isWindow ? window.innerHeight : box.clientHeight;
    const step = Math.max(220, Math.floor(view * 0.85));
    const before = isWindow ? window.scrollY : box.scrollTop;

    if (isWindow) {
      window.scrollTo(0, before + step);
    } else {
      box.scrollTop = before + step;
    }

    await sleep(700);

    const after = isWindow ? window.scrollY : box.scrollTop;

    // Si no se mueve o la virtualización se queda "dormida", hacemos un pequeño vaivén.
    if (after === before || idle % 6 === 0) {
      const up = Math.max(0, before - Math.floor(step / 2));

      if (isWindow) {
        window.scrollTo(0, up);
        await sleep(250);
        window.scrollTo(0, before + step);
      } else {
        box.scrollTop = up;
        await sleep(250);
        box.scrollTop = before + step;
      }

      await sleep(700);
    }
  }

  const ok = prompt(
    'Esto borrará TODAS las conversaciones archivadas.\n' +
    'Escribe "BORRAR" para continuar.\n\n' +
    'Para detenerlo después: window.__arenaDeleteStop = true'
  );

  if (ok !== "BORRAR") {
    console.log("Cancelado.");
    return;
  }

  console.log("🔴 Modo borrado activo. Iniciando...");
  console.log("ℹ️ Para detener: window.__arenaDeleteStop = true");

  let deleted = 0;
  let idle = 0;

  while (idle < MAX_IDLE) {
    if (window.__arenaDeleteStop) {
      console.log("⏹️ Detenido manualmente.");
      break;
    }

    let scrollBox = getScrollContainer();
    let menus = uniqueMenus(scrollBox);

    if (!menus.length) {
      menus = uniqueMenus(document);
    }

    if (!menus.length) {
      idle++;
      console.log(`Sin menús visibles. Intento ${idle}/${MAX_IDLE}. Haciendo scroll...`);
      await closeOverlays();
      await scrollNext(scrollBox, idle);
      continue;
    }

    let progressedThisRound = false;

    for (const menuBtn of menus) {
      if (!isVisible(menuBtn)) continue;
      if (window.__arenaDeleteStop) break;

      await closeOverlays();

      console.log(`📋 Abriendo menú: "${textOf(menuBtn).slice(0, 60)}"`);
      await smartClick(menuBtn);

      let deleteBtn = await waitFor(() => findFirstByText(DELETE_RX), MENU_TIMEOUT, 100);

      // Reintento corto por si el menú no abrió bien
      if (!deleteBtn) {
        await sleep(250);
        await smartClick(menuBtn);
        deleteBtn = await waitFor(() => findFirstByText(DELETE_RX), MENU_TIMEOUT, 100);
      }

      if (!deleteBtn) {
        console.warn('⚠️ No encontré "Delete" en el menú. Probando la siguiente conversación...');
        await closeOverlays();
        continue;
      }

      console.log(`🗑️ Pulsando Delete: "${textOf(deleteBtn).slice(0, 60)}"`);
      await smartClick(deleteBtn);

      let confirmBtn = await waitFor(() => findConfirm(document), CONFIRM_TIMEOUT, 100);

      // Reintento corto por si el diálogo tarda en aparecer
      if (!confirmBtn) {
        await sleep(300);
        confirmBtn = await waitFor(() => findConfirm(document), 1500, 100);
      }

      if (!confirmBtn) {
        console.warn('⚠️ No encontré "Yes, delete". Probando la siguiente conversación...');
        await closeOverlays();
        continue;
      }

      console.log(`✅ Confirmando: "${textOf(confirmBtn).slice(0, 60)}"`);
      await smartClick(confirmBtn);

      try {
        await waitFor(() => !document.contains(confirmBtn) || !isVisible(confirmBtn), 2500, 100);
      } catch {}

      await sleep(900);

      deleted++;
      progressedThisRound = true;
      idle = 0;
      console.log(`🟢 Conversación #${deleted} borrada.`);
      break;
    }

    if (!progressedThisRound) {
      idle++;
      console.log(`Sin progreso en esta vuelta (${idle}/${MAX_IDLE}). Scroll adicional...`);
      scrollBox = getScrollContainer();
      await scrollNext(scrollBox, idle);
    }
  }

  console.log("═══════════════════════════════");
  console.log(`✅ Finalizado. Total borradas: ${deleted}`);
  console.log("═══════════════════════════════");
})();
