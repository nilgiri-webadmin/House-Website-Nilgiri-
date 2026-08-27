/* ============================================================================
   Nilgiri House — field-journal sketchbook (the "about the forest" section).

   Adapted from the ThreeUI "Sketchbook" reference (DOM + CSS 3D):
   the leaf that turns is a real curved surface — a chain of 18 nested strips
   whose tangent sweeps through an arc, so the page bends the way paper bends.
   Direct dragging with velocity commit, pointer tilt, toolbar zoom, and a
   brass loupe that magnifies through a cloned zoom layer.

   Recoloured to the site's black / forest-green system; plates are Nilgiri
   forest spreads composed in public/sketchbook/.

   Photography (Wikimedia Commons, CC BY / CC BY-SA / CC0):
     Tea fields & Marlimund mist — Timothy A. Gonsalves (CC BY-SA 4.0)
     Mountain railway            — Stephan Niewolik (CC BY 3.0)
     Shola forest                — Davidvraju (CC BY-SA 4.0)
     Nilgiri tahr                — Charles J. Sharp (CC BY-SA 4.0)
     Avalanche lake              — AnjaliYadav77 (CC BY-SA 4.0)
     Catherine falls             — Shanmugamp7 (CC BY-SA 4.0)
     Doddabetta                  — Baswameenakshi (CC0)
     Neelakurinji                — Aruna Radhakrishnan (CC BY 2.0)
   ========================================================================== */
import React, { useEffect, useRef } from 'react';
import './Sketchbook.css';

const BASE = `${import.meta.env.BASE_URL}sketchbook/`;
const PAGES = [
  { file: 'spread-01-tea-fields.jpg', title: 'Emerald Slopes', place: 'Tea Gardens' },
  { file: 'spread-02-misty-marlimund.jpg', title: 'Mist over Marlimund', place: 'Hazy Valley' },
  { file: 'spread-03-mountain-railway.jpg', title: 'The Mountain Railway', place: 'Mettuppalaiyam Line' },
  { file: 'spread-04-shola-forest.jpg', title: 'Shola & Grassland', place: 'Upper Plateau' },
  { file: 'spread-05-nilgiri-tahr.jpg', title: 'The Nilgiri Tahr', place: 'Rajamalai Cliffs' },
  { file: 'spread-06-avalanche-lake.jpg', title: 'Avalanche Lake', place: 'Western Catchment' },
  { file: 'spread-07-catherine-falls.jpg', title: 'Catherine Falls', place: 'Kotagiri' },
  { file: 'spread-08-doddabetta.jpg', title: 'Doddabetta', place: '2,637 m' },
  { file: 'spread-09-neelakurinji.jpg', title: 'Neelakurinji', place: 'The Twelve-Year Bloom' },
].map((p) => ({ ...p, url: BASE + p.file }));
const M = PAGES.length;

export default function Sketchbook() {
  const rootRef = useRef(null);
  const wrapRef = useRef(null);
  const stageRef = useRef(null);
  const box3dRef = useRef(null);
  const bookRef = useRef(null);
  const capRef = useRef(null);
  const hintRef = useRef(null);
  const zoomWrapRef = useRef(null);
  const zoomInnerRef = useRef(null);
  const loupeRef = useRef(null);
  const lensRef = useRef(null);
  const zReadRef = useRef(null);
  const zInRef = useRef(null);
  const zOutRef = useRef(null);
  const loupeBtnRef = useRef(null);
  useEffect(() => {
    const root = rootRef.current;
    const wrap = wrapRef.current;
    const stage = stageRef.current;
    const sb3d = box3dRef.current;
    const book = bookRef.current;
    const capBox = capRef.current;
    const hint = hintRef.current;
    const zoomWrap = zoomWrapRef.current;
    const zoomInner = zoomInnerRef.current;
    const loupe = loupeRef.current;
    const zRead = zReadRef.current;
    const zInBtn = zInRef.current;
    const zOutBtn = zOutRef.current;
    const loupeBtn = loupeBtnRef.current;

    const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ------------------------------------------------ the turning leaf */
    const N = 18; /* strips — enough for a smooth curve        */
    const SPAN = 0.5; /* gutter → outer page edge, as a fraction */
    const BETA = 0.6; /* peak curl of the arc, radians           */

    const st = {
      idx: 0,
      turn: null, /* {dir, from, to, t}      */
      strips: [],
      capOut: null,
      capIn: null,
      spring: null,
      raf: null,
      last: 0,
      drag: null,
      introOn: false,
      riffle: null,
      riffleAt: 0,
      canIntro: false,
      allDecoded: false,
      pendingIntro: false,
      inView: false,
      disposed: false,
    };

    const TILT_X = 4.5;
    const TILT_Y = 7;
    const ZOOM_MIN = 0.9;
    const ZOOM_MAX = 1.5;
    const view = { rx: 0, ry: 0, z: 1, trx: 0, try_: 0, tz: 1 };
    let viewActive = false;
    let lastZ = 1;
    let lastRx = 0;
    let lastRy = 0;

    const MAG = 2.3;
    let loupeOn = true;
    let lx = null;
    let ly = null;
    let lgrab = null;
    let lTarget = null;

    const el = (t, c) => {
      const e = document.createElement(t);
      if (c) e.className = c;
      return e;
    };
    const qs = (sel) => root.querySelector(sel);

    function imgEl(i, side) {
      const im = new Image();
      im.className = `nlg-skb__half-img ${side}`;
      im.draggable = false;
      im.alt = '';
      im.src = PAGES[i].url;
      return im;
    }

    function halfEl(pos, i) {
      const d = el('div', `nlg-skb__half ${pos}`);
      d.appendChild(imgEl(i, pos));
      d.appendChild(el('div', 'gutter-shade ' + pos));
      return d;
    }

    /* build the strip chain once per turn; background offsets are pure
       geometry, so they never need touching again while it animates */
    function buildCurl(dir, from, to) {
      st.strips = [];
      const c = el('div', 'curl ' + dir);
      c.style.setProperty('--n', N);
      c.style.setProperty('--span', SPAN);
      let host = c;
      for (let i = 0; i < N; i++) {
        const s = el('div', 'strip');
        const gut = 'calc(var(--bw) * 0.5)';
        const sw = `calc(var(--bw) * ${SPAN} / ${N})`;
        const A = `calc(-1 * (${gut} + ${i} * ${sw}))`; /* faces the from-page */
        const B = `calc(${i + 1} * ${sw} - ${gut})`; /* faces the to-page   */
        const f = el('div', 'face front');
        const b = el('div', 'face back');
        const dress = (e, url, px) => {
          e.style.backgroundImage = `url("${url}")`;
          e.style.backgroundPositionX = px;
        };
        dress(f, PAGES[from].url, dir === 'next' ? A : B);
        dress(b, PAGES[to].url, dir === 'next' ? B : A);
        f.appendChild(el('div', 'sh'));
        f.appendChild(el('div', 'gl'));
        b.appendChild(el('div', 'sh'));
        b.appendChild(el('div', 'gl'));
        s.appendChild(f);
        s.appendChild(b);
        if (i === N - 1) s.classList.add('edge');
        host.appendChild(s);
        host = s;
        st.strips.push(s);
      }
      return c;
    }

    function applyTurn(t) {
      const th = Math.PI * t; /* how far the leaf has swung */
      const beta = BETA * Math.sin(Math.PI * t); /* it is flat at both ends */
      const D = 180 / Math.PI;
      const tt = th + beta;
      const td = (2 * beta) / N;
      sb3d.style.setProperty('--tt', `${(tt * D).toFixed(2)}deg`);
      sb3d.style.setProperty('--td', `${(td * D).toFixed(3)}deg`);
      sb3d.style.setProperty('--shade', Math.sin(Math.PI * t).toFixed(3));
      fadeCaption(t);
      for (let i = 0; i < st.strips.length; i++) {
        const l1 = Math.abs(Math.cos(tt - i * td)); /* facing at this strip's near edge */
        const l2 = Math.abs(Math.cos(tt - (i + 1) * td)); /* ...and at its far edge        */
        const s = st.strips[i].style;
        s.setProperty('--lit', l1.toFixed(3));
        s.setProperty('--a1', ((1 - l1) * 0.62).toFixed(3));
        s.setProperty('--a2', ((1 - l2) * 0.62).toFixed(3));
      }
      syncZoomLayer();
    }

    function paint() {
      book.textContent = '';
      if (!st.turn) {
        const f = el('div', 'nlg-skb__full');
        const im = new Image();
        im.src = PAGES[st.idx].url;
        im.alt = `${PAGES[st.idx].title} — ${PAGES[st.idx].place}`;
        im.draggable = false;
        f.appendChild(im);
        book.appendChild(f);
        sb3d.style.setProperty('--shade', '0');
      } else {
        const next = st.turn.dir === 'next';
        book.appendChild(halfEl('left', next ? st.turn.from : st.turn.to));
        book.appendChild(halfEl('right', next ? st.turn.to : st.turn.from));
        book.appendChild(buildCurl(st.turn.dir, st.turn.from, st.turn.to));
        applyTurn(st.turn.t);
      }
      const a = el('button', 'sb-zone sb-prev');
      const b = el('button', 'sb-zone sb-next');
      a.setAttribute('aria-label', 'previous page');
      b.setAttribute('aria-label', 'next page');
      book.appendChild(a);
      book.appendChild(b);
      layout();
      caption();
      aria();
      syncZoomLayer();
      placeLoupe();
    }

    function caption() {
      capBox.textContent = '';
      st.capOut = null;
      st.capIn = null;
      if (st.turn) {
        st.capOut = el('p', 'nlg-skb__caption live');
        st.capOut.textContent = PAGES[st.turn.from].title;
        capBox.appendChild(st.capOut);
        st.capIn = el('p', 'nlg-skb__caption live');
        st.capIn.textContent = PAGES[st.turn.to].title;
        capBox.appendChild(st.capIn);
        fadeCaption(st.turn.t);
      } else {
        const p = el('p', 'nlg-skb__caption');
        p.textContent = PAGES[st.idx].title;
        capBox.appendChild(p);
      }
    }

    function fadeCaption(t) {
      if (!st.capOut || !st.capIn) return;
      /* the old title is gone before the new one arrives, so they never
         sit on top of each other mid-drag */
      const out = 1 - Math.max(0, Math.min(1, (t - 0.1) / 0.28));
      const inn = Math.max(0, Math.min(1, (t - 0.56) / 0.3));
      st.capOut.style.opacity = out.toFixed(3);
      st.capIn.style.opacity = inn.toFixed(3);
    }

    function aria() {
      const cur = st.turn ? st.turn.to : st.idx;
      book.setAttribute(
        'aria-label',
        `Sketchbook, page ${cur + 1} of ${M}: ${PAGES[cur].title}`
      );
    }

    function layout() {
      sb3d.style.setProperty('--bw', book.clientWidth + 'px');
    }

    /* ------------------------------------------------------ spring loop */
    function animateTo(target, onDone, stiff, damp) {
      st.spring = { kind: 'spring', v: 0, target, done: onDone, k: stiff || 150, c: damp || 22 };
      kick();
    }
    /* the riffle wants a fixed tempo, not a spring settling time */
    function tweenTo(target, dur, onDone) {
      st.spring = { kind: 'tween', from: st.turn ? st.turn.t : 0, target, dur, e: 0, done: onDone };
      kick();
    }
    function tick(now) {
      st.raf = null;
      const dt = Math.min(0.032, (now - st.last) / 1000 || 0.016);
      st.last = now;
      if (st.spring && st.turn) {
        const s = st.spring;
        if (s.kind === 'tween') {
          s.e += dt;
          const k = Math.min(1, s.e / s.dur);
          st.turn.t = s.from + (s.target - s.from) * k;
          applyTurn(st.turn.t);
          if (k >= 1) {
            st.spring = null;
            s.done && s.done();
          }
        } else {
          const x = st.turn.t - s.target;
          s.v += (-s.k * x - s.c * s.v) * dt;
          st.turn.t += s.v * dt;
          if (Math.abs(st.turn.t - s.target) < 0.002 && Math.abs(s.v) < 0.02) {
            st.turn.t = s.target;
            st.spring = null;
            applyTurn(st.turn.t);
            s.done && s.done();
          } else applyTurn(st.turn.t);
        }
      }
      viewSpring();
      const lmoved = loupeEase();
      if ((st.spring || viewActive || lmoved) && st.raf === null) st.raf = requestAnimationFrame(tick);
    }
    function kick() {
      if (st.raf === null) {
        st.last = performance.now();
        st.raf = requestAnimationFrame(tick);
      }
    }

    /* ------------------------------------------- tilt + zoom of the book */
    function applyView() {
      sb3d.style.setProperty('--rx', view.rx.toFixed(2) + 'deg');
      sb3d.style.setProperty('--ry', view.ry.toFixed(2) + 'deg');
      sb3d.style.setProperty('--zoom', view.z.toFixed(3));
      /* the glass stays put, but the page under it moves with the lean as
         well as the zoom — so the lens re-aims on either */
      if (view.z !== lastZ || view.rx !== lastRx || view.ry !== lastRy) {
        lastZ = view.z;
        lastRx = view.rx;
        lastRy = view.ry;
        placeLoupe();
      }
    }
    function viewSpring() {
      const e = 0.14;
      let moved = false;
      for (const [k, t] of [
        ['rx', 'trx'],
        ['ry', 'try_'],
        ['z', 'tz'],
      ]) {
        const d = view[t] - view[k];
        if (Math.abs(d) > 0.0006) {
          view[k] += d * e;
          moved = true;
        } else view[k] = view[t];
      }
      if (moved) applyView();
      viewActive = moved;
      return moved;
    }
    function setView(rx, ry, z) {
      view.trx = Math.max(-TILT_X, Math.min(TILT_X, rx));
      view.try_ = Math.max(-TILT_Y, Math.min(TILT_Y, ry));
      view.tz = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z));
      viewActive = true;
      kick();
      syncZoom();
    }
    /* the book leans toward the cursor — no dragging, and never far */
    function tiltTo(cx, cy) {
      if (st.drag || lgrab || !st.inView) return; /* hold still while a page is being turned or the glass is held */
      const r = book.getBoundingClientRect();
      if (!r.width) return;
      const nx = Math.max(-1, Math.min(1, (cx - (r.left + r.width / 2)) / (r.width * 0.62)));
      const ny = Math.max(-1, Math.min(1, (cy - (r.top + r.height / 2)) / (r.height * 0.9)));
      setView(-ny * TILT_X, nx * TILT_Y, view.tz);
    }
    const onPointerMove = (e) => {
      if (e.pointerType === 'touch') return;
      tiltTo(e.clientX, e.clientY);
    };
    const onPointerOut = (e) => {
      if (!e.relatedTarget) setView(0, 0, view.tz);
    };
    const onBlur = () => setView(0, 0, view.tz);
    /* the wheel belongs to the page — zoom is on the toolbar, or a double
       click to come back to 100% */
    const onDblClick = () => setView(view.trx, view.try_, 1);

    /* ------------------------------------------------------- pointer work */
    function bookRect() {
      return book.getBoundingClientRect();
    }
    function hideHint() {
      hint.classList.add('gone');
    }

    const onStageDown = (e) => {
      if (e.button !== 0) return;
      e.preventDefault(); /* no text selection, no image drag */
      const onBook = e.target.closest && e.target.closest('.sb-zone');
      stage.setPointerCapture(e.pointerId);
      hideHint();
      if (!onBook || st.introOn) return;
      const r = bookRect();
      const dir = (e.clientX - r.left) / r.width > 0.5 ? 'next' : 'prev';
      startTurn(dir, 0);
      st.drag = { dir, x0: e.clientX, w: r.width, moved: 0, vel: 0, tPrev: performance.now() };
    };
    const onStageMove = (e) => {
      if (!st.drag) return;
      const dx = e.clientX - st.drag.x0;
      st.drag.moved = Math.max(st.drag.moved, Math.abs(dx));
      const raw = (st.drag.dir === 'next' ? -dx : dx) / (st.drag.w * 0.62);
      const t = Math.max(0, Math.min(1, raw));
      const now = performance.now();
      st.drag.vel = (t - (st.turn ? st.turn.t : 0)) / Math.max(0.001, (now - st.drag.tPrev) / 1000);
      st.drag.tPrev = now;
      if (st.turn) {
        st.turn.t = t;
        applyTurn(t);
      }
    };
    function endDrag() {
      if (!st.drag) return;
      const d = st.drag;
      st.drag = null;
      if (!st.turn) return;
      if (d.moved < 6) {
        /* a tap, not a drag */
        commit();
        return;
      }
      const go = st.turn.t > 0.42 || d.vel > 1.1;
      if (go) commit();
      else cancel();
    }
    const onDragStart = (e) => e.preventDefault();
    const onSelectStart = (e) => e.preventDefault();

    /* ------------------------------------------------------ turn control */
    function startTurn(dir, t) {
      st.spring = null;
      if (st.turn) {
        /* settle anything still in flight */
        st.idx = st.turn.to;
        st.turn = null;
      }
      shoveLoupe(dir);
      const from = st.idx;
      st.turn = {
        dir,
        from,
        to: dir === 'next' ? (from + 1) % M : (from - 1 + M) % M,
        t: t || 0,
      };
      paint();
    }
    function commit() {
      if (!st.turn) return;
      if (REDUCED) {
        st.idx = st.turn.to;
        st.turn = null;
        paint();
        return;
      }
      animateTo(
        1,
        () => {
          st.idx = st.turn.to;
          st.turn = null;
          paint();
        },
        170,
        26
      );
      kick();
    }
    function cancel() {
      if (!st.turn) return;
      animateTo(
        0,
        () => {
          st.turn = null;
          paint();
        },
        150,
        24
      );
      kick();
    }
    function step(dir) {
      if (st.introOn) endIntro();
      if (st.turn) {
        /* finish whatever is in flight first */
        st.idx = st.turn.to;
        st.turn = null;
      }
      startTurn(dir, 0);
      commit();
    }
    const onKey = (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (!st.inView) return; /* arrows belong to the page unless the book is in view */
      e.preventDefault();
      hideHint();
      step(e.key === 'ArrowRight' ? 'next' : 'prev');
    };

    /* --------------------------------------------------- loupe + controls */
    function loupeSize() {
      return Math.round(Math.max(165, Math.min(262, book.clientWidth * 0.235)));
    }
    function bookBox() {
      return { x: 0, y: 0, w: book.clientWidth, h: book.clientHeight };
    }
    /* park it on the desk at the lower right, half off the book */
    function restLoupe() {
      const b = bookBox();
      lx = b.x + b.w * 0.88;
      ly = b.y + b.h * 0.855;
      placeLoupe();
    }
    /* mirror whatever the book is currently showing into the magnified copy */
    function syncZoomLayer() {
      zoomInner.textContent = '';
      for (const c of book.children) {
        if (c.classList.contains('sb-zone')) continue; /* hit targets need no copy */
        zoomInner.appendChild(c.cloneNode(true));
      }
    }
    function placeLoupe() {
      if (lx === null) return;
      const B = bookBox();
      const bw = B.w;
      if (!bw) return;
      const stageBox = sb3d.getBoundingClientRect();
      const renderedBook = book.getBoundingClientRect();
      const renderedX = renderedBook.left - stageBox.left;
      const renderedY = renderedBook.top - stageBox.top;
      const renderedW = renderedBook.width;
      const renderedH = renderedBook.height;
      const R = loupeSize() / 2;
      const bez = R * 2 * 0.058;
      loupe.style.setProperty('--lr', R * 2 + 'px');
      loupe.style.transform = `translate3d(${(lx - R).toFixed(1)}px, ${(ly - R).toFixed(1)}px, 0)`;
      if (loupeOn) loupe.classList.add('on');

      /* where the paper's edges actually land once the book is scaled
         (the spreads are full bleed) */
      const z = view.z;
      const x0 = renderedX + renderedW * 0.006;
      const x1 = renderedX + renderedW * 0.994;
      const y0 = renderedY + renderedH * 0.006;
      const y1 = renderedY + renderedH * 0.994;
      /* how far the glass's centre sits inside the paper — the magnified copy
         fades out as it wanders off the sheet */
      const nx = Math.max(x0, Math.min(lx, x1));
      const ny = Math.max(y0, Math.min(ly, y1));
      const inside =
        lx > x0 && lx < x1 && ly > y0 && ly < y1
          ? Math.min(lx - x0, x1 - lx, ly - y0, y1 - ly)
          : -Math.hypot(lx - nx, ly - ny);
      const k = Math.max(0, Math.min(1, (inside + R * 0.3) / (R * 0.55)));

      zoomWrap.style.opacity = (loupeOn ? k : 0).toFixed(3);
      if (k <= 0.002) return;
      const maskX = bw / 2 + (lx - bw / 2) / z;
      const maskY = B.h / 2 + (ly - B.h / 2) / z;
      const r = ((R - bez) / z).toFixed(1);
      const mask = `radial-gradient(circle ${r}px at ${maskX.toFixed(1)}px ${maskY.toFixed(1)}px, #000 calc(100% - 1px), transparent 100%)`;
      zoomWrap.style.webkitMaskImage = mask;
      zoomWrap.style.maskImage = mask;
      /* The page point beneath the glass.  The lean is drawn with real
         perspective, so once the book tips the flat `/z` mapping drifts —
         undo the whole rotate·scale·perspective chain instead. */
      const D = Math.PI / 180;
      const st_ = Math.sin(view.ry * D);
      const ct = Math.cos(view.ry * D);
      const sp = Math.sin(view.rx * D);
      const cp = Math.cos(view.rx * D);
      const dxg = lx - renderedX - renderedW / 2;
      const dyg = ly - renderedY - renderedH / 2;
      let u = dxg;
      let v = dyg;
      for (let i = 0; i < 4; i++) {
        const w1 = u * cp * st_ - v * sp; /* depth of the page point, pre-scale */
        const K = 1750 / (1750 - w1 * z); /* matches the stage perspective */
        u = dxg / K / (z * ct);
        v = (dyg / K / z - u * sp * st_) / cp;
      }
      const px = bw / 2 + u;
      const py = B.h / 2 + v;
      zoomInner.style.transform =
        `translate(${(maskX - px * MAG).toFixed(1)}px, ${(maskY - py * MAG).toFixed(1)}px) scale(${MAG})`;
    }
    /* the leaf shoves the glass aside as it sweeps past */
    function shoveLoupe(dir) {
      if (!loupeOn || lx === null || lgrab) return;
      const b = bookBox();
      const nx = (b.w / 2 + (lx - b.x - b.w / 2) / view.z) / b.w;
      const ny = (b.h / 2 + (ly - b.y - b.h / 2) / view.z) / b.h;
      if (nx < 0.02 || nx > 0.98 || ny < 0.06 || ny > 0.94) return; /* already clear */
      lTarget = { x: b.x + b.w * (dir === 'next' ? 0.12 : 0.88), y: b.y + b.h * 0.855 };
      kick();
    }
    function loupeEase() {
      if (!lTarget) return false;
      if (lgrab) {
        lTarget = null;
        return false;
      }
      const dx = lTarget.x - lx;
      const dy = lTarget.y - ly;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
        lx = lTarget.x;
        ly = lTarget.y;
        lTarget = null;
        placeLoupe();
        return false;
      }
      lx += dx * 0.17;
      ly += dy * 0.17;
      placeLoupe();
      return true;
    }
    const onLoupeDown = (e) => {
      if (!loupeOn || e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation(); /* never starts a page turn */
      lTarget = null;
      lgrab = { cx: e.clientX, cy: e.clientY, lx0: lx, ly0: ly };
      setView(0, 0, view.tz); /* press the page flat under the glass */
      loupe.classList.add('held');
      loupe.setPointerCapture(e.pointerId);
      hideHint();
    };
    const onLoupeMove = (e) => {
      if (!lgrab) return;
      const b = bookBox();
      const R = loupeSize() / 2;
      /* the glass carries none of the book's transform, so the cursor maps 1:1 */
      lx = Math.max(b.x - R * 0.7, Math.min(b.x + b.w + R * 0.7, lgrab.lx0 + (e.clientX - lgrab.cx)));
      ly = Math.max(b.y - R * 0.7, Math.min(b.y + b.h + R * 1.0, lgrab.ly0 + (e.clientY - lgrab.cy)));
      placeLoupe();
    };
    function dropLoupe() {
      lgrab = null;
      loupe.classList.remove('held');
    }
    const onLoupeToggle = () => {
      loupeOn = !loupeOn;
      loupeBtn.setAttribute('aria-pressed', String(loupeOn));
      loupe.classList.toggle('on', loupeOn);
      if (loupeOn && lx === null) restLoupe();
    };
    const onResize = () => {
      lx = null;
      restLoupe();
    };

    function syncZoom() {
      zRead.textContent = Math.round(view.tz * 100) + '%';
      zOutBtn.disabled = view.tz <= ZOOM_MIN + 0.001;
      zInBtn.disabled = view.tz >= ZOOM_MAX - 0.001;
    }
    /* zoom moves in fixed 10% steps so the readout is always a round number
       (0.9 + 0.1 must land exactly on 1.0, not on floating-point dust) */
    const snapZoom = (z) =>
      Math.round(Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z)) * 10) / 10;
    const onZoomIn = () => {
      setView(view.trx, view.try_, snapZoom(view.tz + 0.1));
      hideHint();
    };
    const onZoomOut = () => {
      setView(view.trx, view.try_, snapZoom(view.tz - 0.1));
      hideHint();
    };

    /* ---------------------------------------------------------- the riffle */
    function endIntro() {
      st.introOn = false;
      wrap.classList.remove('intro', 'b2');
    }
    function riffleStep() {
      const s = st.riffle[st.riffleAt];
      wrap.classList.toggle('b2', s.bell > 0.55);
      startTurn('next', 0);
      tweenTo(
        1,
        s.dur,
        () => {
          st.idx = st.turn.to;
          st.turn = null;
          st.riffleAt++;
          if (st.introOn && st.riffleAt < st.riffle.length) {
            paint();
            riffleStep();
          } else {
            endIntro();
            paint();
          }
        }
      );
    }
    function startIntro() {
      const coarse = matchMedia('(max-width: 640px), (pointer: coarse)').matches;
      if (coarse || REDUCED || !st.allDecoded) return; /* never riffle half-loaded pages */
      const steps = M; /* flip through the whole journal, land on the cover plate */
      st.riffle = [];
      for (let r = 0; r < steps; r++) {
        const bell = Math.sin(Math.PI * (r / (steps - 1)));
        st.riffle.push({ bell, dur: 0.26 - 0.19 * bell });
      }
      st.riffleAt = 0;
      st.introOn = true;
      wrap.classList.add('intro');
      riffleStep();
    }

    /* ------------------------------------------------------------ wiring */
    stage.addEventListener('pointerdown', onStageDown);
    stage.addEventListener('pointermove', onStageMove);
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);
    stage.addEventListener('dragstart', onDragStart);
    stage.addEventListener('selectstart', onSelectStart);
    stage.addEventListener('dblclick', onDblClick);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerout', onPointerOut);
    window.addEventListener('blur', onBlur);
    window.addEventListener('keydown', onKey);
    loupe.addEventListener('pointerdown', onLoupeDown);
    loupe.addEventListener('pointermove', onLoupeMove);
    loupe.addEventListener('pointerup', dropLoupe);
    loupe.addEventListener('pointercancel', dropLoupe);
    loupeBtn.addEventListener('click', onLoupeToggle);
    zInBtn.addEventListener('click', onZoomIn);
    zOutBtn.addEventListener('click', onZoomOut);
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(() => {
      layout();
    });
    ro.observe(book);

    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          st.inView = en.isIntersecting && en.intersectionRatio > 0.3;
          if (st.inView && st.pendingIntro && st.canIntro) {
            st.pendingIntro = false;
            setTimeout(() => {
              if (!st.disposed && st.inView) startIntro();
            }, 220);
          }
        }
      },
      { threshold: [0, 0.3, 0.6] }
    );
    io.observe(root);

    /* -------------------------------------------------------------- boot */
    paint();
    applyView();
    syncZoom();
    restLoupe();

    const maybeStart = () => {
      if (st.disposed || !st.canIntro) return;
      if (st.inView) {
        setTimeout(() => {
          if (!st.disposed && st.inView) startIntro();
        }, 220);
      } else {
        st.pendingIntro = true;
      }
    };

    /* reveal the book as soon as the open spread is usable — never later
       than 3.5s, so a stalled decode can't leave a blank section */
    const first = book.querySelector('img');
    const firstReady =
      first.complete || !first.decode
        ? Promise.resolve()
        : new Promise((r) => {
            first.addEventListener('load', r, { once: true });
            first.addEventListener('error', r, { once: true });
          });
    const timer = (ms) => new Promise((r) => setTimeout(r, ms));
    Promise.race([firstReady, timer(3500)]).then(() => {
      if (!st.disposed) wrap.classList.add('ready');
    });

    /* the riffle, though, waits for every plate — capped at 7s */
    const decodeAll = Promise.all(
      PAGES.map((p) => {
        const im = new Image();
        im.src = p.url;
        return im.decode ? im.decode().catch(() => {}) : new Promise((r) => (im.onload = im.onerror = r));
      })
    ).then(() => (document.fonts && document.fonts.ready ? document.fonts.ready.catch(() => {}) : null));

    decodeAll.then(() => {
      if (st.disposed) return;
      st.allDecoded = true;
      st.canIntro = true;
      maybeStart();
    });
    timer(7000).then(() => {
      if (st.disposed || st.canIntro) return;
      st.canIntro = true; /* skip the riffle, but always show the book */
      maybeStart();
    });

    return () => {
      st.disposed = true;
      if (st.raf !== null) cancelAnimationFrame(st.raf);
      ro.disconnect();
      io.disconnect();
      stage.removeEventListener('pointerdown', onStageDown);
      stage.removeEventListener('pointermove', onStageMove);
      stage.removeEventListener('pointerup', endDrag);
      stage.removeEventListener('pointercancel', endDrag);
      stage.removeEventListener('dragstart', onDragStart);
      stage.removeEventListener('selectstart', onSelectStart);
      stage.removeEventListener('dblclick', onDblClick);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerout', onPointerOut);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      loupe.removeEventListener('pointerdown', onLoupeDown);
      loupe.removeEventListener('pointermove', onLoupeMove);
      loupe.removeEventListener('pointerup', dropLoupe);
      loupe.removeEventListener('pointercancel', dropLoupe);
      loupeBtn.removeEventListener('click', onLoupeToggle);
      zInBtn.removeEventListener('click', onZoomIn);
      zOutBtn.removeEventListener('click', onZoomOut);
    };
  }, []);

  return (
    <section className="nlg-skb" ref={rootRef} aria-label="Nilgiri House field journal">
      <div className="nlg-skb__halo" aria-hidden="true" />

      <header className="nlg-skb__head">
        <p className="nlg-skb__tag">Nilgiri House · IIT Madras</p>
        <h2 className="nlg-skb__title">Know More About the Nilgiri Forest</h2>
      </header>

      <div className={`nlg-skb__hero`}>
        <div className="nlg-skb__wrap" ref={wrapRef}>
          <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
            <filter id="nlg-sb-blur-1">
              <feGaussianBlur stdDeviation="5 0" />
            </filter>
            <filter id="nlg-sb-blur-2">
              <feGaussianBlur stdDeviation="14 0" />
            </filter>
          </svg>

          <div className="nlg-skb__stage" ref={stageRef}>
            <div className="nlg-skb__3d" ref={box3dRef}>
              <div className="nlg-skb__tilt">
                <div className="nlg-skb__cast ambient" aria-hidden="true" />
                <div className="nlg-skb__cast contact" aria-hidden="true" />
                <div className="nlg-skb__cast hair" aria-hidden="true" />
                <div className="nlg-skb__book" ref={bookRef} role="group" />
                <div className="nlg-skb__zoomwrap" ref={zoomWrapRef} aria-hidden="true">
                  <div className="nlg-skb__zoominner" ref={zoomInnerRef} />
                </div>
              </div>
              <div className="nlg-skb__loupe" ref={loupeRef}>
                <span className="grip" />
                <span className="ring">
                  <span className="nlg-skb__lens" ref={lensRef}>
                    <span className="mag" />
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="nlg-skb__captions" ref={capRef} aria-live="polite" />
          <div className="nlg-skb__tools" role="group" aria-label="view controls">
            <button className="tool" ref={zOutRef} aria-label="zoom out">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <circle cx="8.6" cy="8.6" r="5.6" />
                <path d="M12.8 12.8 17.4 17.4M6.2 8.6h4.8" />
              </svg>
            </button>
            <span className="nlg-skb__zoomread" ref={zReadRef}>
              100%
            </span>
            <button className="tool" ref={zInRef} aria-label="zoom in">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <circle cx="8.6" cy="8.6" r="5.6" />
                <path d="M12.8 12.8 17.4 17.4M6.2 8.6h4.8M8.6 6.2v4.8" />
              </svg>
            </button>
            <span className="tool-sep" aria-hidden="true" />
            <button className="tool" ref={loupeBtnRef} aria-label="magnifier" aria-pressed="true">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <circle cx="8.8" cy="8.8" r="5.8" />
                <path d="M13 13l4.4 4.4" />
                <path d="M6.4 7.2a3.2 3.2 0 0 1 2.4-1.4" opacity=".55" />
              </svg>
            </button>
          </div>
          <p className="nlg-skb__hint" ref={hintRef}>
            Tap on the pages or turn them using your cursor · Drag the glass across it
          </p>
          <p className="nlg-skb__credits">
            Photographs ·{' '}
            <a href="https://commons.wikimedia.org/wiki/Category:Nilgiri_Hills" target="_blank" rel="noreferrer">
              Wikimedia Commons
            </a>{' '}
            · CC BY / CC BY-SA
          </p>
        </div>
      </div>
    </section>
  );
}
