// 食序 Shiso website: remembers the language and the light or dark choice, puts the contact address together, and on the
// home page turns the first screen's text and runs the plate palette.
(function () {
  'use strict';

  // The language switch is plain links. A choice is kept in this browser only, so a later visit to an English
  // address opens the Chinese page (the small script in each English page's head does that).
  document.querySelectorAll('.lang a[data-lang]').forEach(function (link) {
    link.addEventListener('click', function () {
      try { localStorage.setItem('mise.lang', link.dataset.lang); } catch (e) { /* private window: skip */ }
    });
  });

  // The light/dark button. A visitor follows the system until they press it, and the choice stays in this browser
  // only (the small script in each page's head applies it before the first paint). Pressing it back to what the
  // system shows drops the choice, so the page follows the system again.
  var root = document.documentElement;
  var themeButton = document.querySelector('.theme');
  var systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  var themeColors = document.querySelectorAll('meta[name="theme-color"]');
  function isDark() { return root.dataset.theme ? root.dataset.theme === 'dark' : systemDark.matches; }
  function showTheme() {
    if (themeButton) themeButton.setAttribute('aria-pressed', String(isDark()));
    themeColors.forEach(function (meta) { meta.content = isDark() ? '#13140E' : '#F4F2E8'; });
  }
  if (themeButton) {
    themeButton.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      var system = systemDark.matches ? 'dark' : 'light';
      if (next === system) delete root.dataset.theme; else root.dataset.theme = next;
      try {
        if (next === system) localStorage.removeItem('mise.theme'); else localStorage.setItem('mise.theme', next);
      } catch (e) { /* private window: the choice lasts for this page */ }
      showTheme();
    });
  }
  systemDark.addEventListener('change', showTheme);
  showTheme();

  document.querySelectorAll('[data-mail]').forEach(createMail);

  var rotating = document.querySelector('[data-rot]');
  if (rotating) createRotator(rotating);

  var stage = document.querySelector('.stage');
  if (stage) createPalette(stage);

  /* The palette: every plate's place is worked out from one number, `pos`, the position along the ring of dishes.
     Moving, swiping and spinning only change that number, so the plates glide along the arc at any speed. A plate
     leaves one end of the arc by fading out past the edge and comes back at the other end the same way, so it
     never crosses the page. */
  function createPalette(stage) {
    var view = stage.ownerDocument.defaultView;
    var arc = stage.querySelector('.arc');
    var hero = stage.parentNode;
    var nameEl = hero.querySelector('.dish-name');
    var metaEl = hero.querySelector('.dish-meta');
    var plates = Array.prototype.slice.call(arc.querySelectorAll('.p'));
    var count = plates.length;
    var last = plates.map(function () { return {}; });

    // A plate's place at each whole distance from the middle, as in the stylesheet's slots: x is a share of the
    // arc's width, y a share of it (or points on a phone), s the plate's scale. Past `gone` the plate is hidden.
    var WIDE = { x: [0, .168, .283, .381, .465, .53], y: [0, -.014, -.044, -.083, -.128, -.17], s: [1, .6, .5, .42, .36, .3], gone: 5, phone: false };
    var PHONE = { x: [0, .29, .49, .62, .75, .88], y: [0, -14, -56, -110, -170, -240], s: [1, .5, .36, .3, .26, .22], gone: 3, phone: true };
    var EASE_MOVE = bezier(.22, .8, .24, 1);
    var EASE_SPIN = bezier(.35, .15, .25, 1);

    var shape = WIDE;
    var width = 0;
    var pos = 0;
    var goal = 0;
    var shown = 0;
    var frame = 0;
    var spinning = false;
    var swiped = false;
    var drag = null;

    function bezier(x1, y1, x2, y2) {
      function at(a, b, u) { return 3 * (1 - u) * (1 - u) * u * a + 3 * (1 - u) * u * u * b + u * u * u; }
      return function (t) {
        if (t <= 0) return 0;
        if (t >= 1) return 1;
        var lo = 0, hi = 1, u = t;
        for (var i = 0; i < 24; i++) {
          u = (lo + hi) / 2;
          if (at(x1, x2, u) < t) lo = u; else hi = u;
        }
        return at(y1, y2, u);
      };
    }

    // A smooth curve through the values, so a plate's speed doesn't jump as it passes a slot. Odd values, such as x,
    // carry on through the middle to the other side; even ones, such as the scale, mirror there.
    function curve(values, a, odd) {
      var k = Math.min(Math.floor(a), values.length - 2);
      var t = a - k;
      var p1 = values[k];
      var p2 = values[k + 1];
      var p0 = k > 0 ? values[k - 1] : (odd ? -values[1] : values[1]);
      var p3 = k + 2 < values.length ? values[k + 2] : 2 * p2 - p1;
      return p1 + .5 * t * (p2 - p0 + t * (2 * p0 - 5 * p1 + 4 * p2 - p3 + t * (3 * (p1 - p2) + p3 - p0)));
    }

    function wrap(i) { return ((i % count) + count) % count; }

    function paint() {
      for (var i = 0; i < count; i++) {
        var o = wrap(i - pos);
        if (o > count / 2) o -= count;
        var a = Math.abs(o);
        var x = (o < 0 ? -1 : 1) * curve(shape.x, a, true) * width;
        var y = curve(shape.y, a) * (shape.phone ? 1 : width);
        var s = curve(shape.s, a);
        // Fully gone a little before the far end of the ring, where the plate wraps to the other side.
        var fade = Math.max(0, Math.min(1, (shape.gone - .3 - a) / .7));
        fade = fade * fade * (3 - 2 * fade);
        var z = 6 - Math.round(a);
        var was = last[i];
        var style = plates[i].style;
        var transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) scale(' + s.toFixed(4) + ')';
        if (was.transform !== transform) style.transform = was.transform = transform;
        if (was.fade !== fade) { style.opacity = fade.toFixed(3); was.fade = fade; }
        if (was.z !== z) style.zIndex = was.z = z;
        var hidden = fade === 0;
        if (was.hidden !== hidden) {
          style.visibility = hidden ? 'hidden' : '';
          style.pointerEvents = hidden ? 'none' : '';
          was.hidden = hidden;
        }
      }
    }

    function setDish(i) {
      i = wrap(i);
      if (i === shown) return;
      shown = i;
      nameEl.textContent = plates[i].dataset.name;
      metaEl.textContent = plates[i].dataset.meta;
    }

    function setTextOpacity(value) {
      nameEl.style.opacity = metaEl.style.opacity = value === 1 ? '' : value.toFixed(2);
    }

    function still() {
      return view.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    // Runs `pos` to `to`. `each` is called on every frame with how far along the time is.
    function run(to, duration, ease, each, done) {
      view.cancelAnimationFrame(frame);
      var from = pos;
      var began = null;
      goal = to;
      function step(now) {
        if (began === null) began = now;
        var t = Math.min(1, (now - began) / duration);
        pos = from + (to - from) * ease(t);
        paint();
        if (each) each(t);
        if (t < 1) {
          frame = view.requestAnimationFrame(step);
        } else {
          pos = goal = wrap(to);
          if (done) done();
        }
      }
      frame = view.requestAnimationFrame(step);
    }

    function moveTo(index) {
      setDish(index);
      if (still()) {
        view.cancelAnimationFrame(frame);
        pos = goal = wrap(index);
        paint();
        return;
      }
      run(index, 380 + Math.min(4, Math.abs(index - pos)) * 90, EASE_MOVE);
    }

    function nearest(i) {
      var base = Math.round(goal);
      var d = wrap(i - base);
      if (d > count / 2) d -= count;
      return base + d;
    }

    // Spin: one long glide that speeds up, slows down and stops on a dish picked by chance. The dish's name stays
    // out of the way while the plates fly past and comes back as they slow down.
    function spin() {
      if (spinning || drag) return;
      var steps = 9 + Math.floor(Math.random() * 8);
      if (steps % count === 0) steps += 1;
      var to = Math.round(goal) + steps;
      if (still()) {
        moveTo(to);
        return;
      }
      spinning = true;
      nameEl.setAttribute('aria-live', 'off');
      var from = pos;
      var duration = 2600 + steps * 30;
      run(to, duration, EASE_SPIN, function (t) {
        var speed = Math.abs(to - from) * (EASE_SPIN(Math.min(1, t + .01)) - EASE_SPIN(t)) / (.01 * duration / 1000);
        setTextOpacity(Math.max(0, Math.min(1, 1 - (speed - 1.5) / 2.5)));
        if (t === 1) nameEl.setAttribute('aria-live', 'polite');
        setDish(Math.round(pos));
      }, function () {
        setTextOpacity(1);
        spinning = false;
      });
    }

    function onPlateClick(event) {
      var i = plates.indexOf(event.currentTarget);
      if (spinning || swiped || i < 0) return;
      var to = nearest(i);
      if (to !== goal) moveTo(to);
    }

    function onArrowClick(event) {
      if (!spinning) moveTo(Math.round(goal) + Number(event.currentTarget.dataset.go));
    }

    // Dragging along the arc moves the plates with the finger. Let go, and they settle on the nearest dish, up to
    // four plates from where the drag began when it was long or fast.
    function onPointerDown(event) {
      if (spinning || event.button) return;
      swiped = false;
      drag = { id: event.pointerId, x: event.clientX, pos: pos, start: Math.round(goal), moved: false, lastX: event.clientX, lastTime: event.timeStamp, speed: 0 };
    }

    function onPointerMove(event) {
      if (!drag || event.pointerId !== drag.id) return;
      var dx = event.clientX - drag.x;
      if (!drag.moved) {
        if (Math.abs(dx) < 6) return;
        drag.moved = true;
        view.cancelAnimationFrame(frame);
        arc.classList.add('dragging');
      }
      var unit = shape.x[1] * width;
      pos = drag.pos - dx / unit;
      var dt = event.timeStamp - drag.lastTime;
      if (dt > 0) drag.speed = (drag.lastX - event.clientX) / unit / dt;
      drag.lastX = event.clientX;
      drag.lastTime = event.timeStamp;
      paint();
      setDish(Math.round(pos));
    }

    function onPointerEnd(event) {
      if (!drag || event.pointerId !== drag.id) return;
      var moved = drag.moved;
      var start = drag.start;
      var speed = event.timeStamp - drag.lastTime > 80 ? 0 : drag.speed;
      drag = null;
      if (!moved) return;
      arc.classList.remove('dragging');
      swiped = true;
      view.setTimeout(function () { swiped = false; }, 0);
      var to = Math.round(pos + speed * 180);
      moveTo(Math.max(start - 4, Math.min(start + 4, to)));
    }

    function measure() {
      var full = arc.clientWidth;
      if (!full) return;
      width = Math.min(full, 1680);
      shape = full <= 640 ? PHONE : WIDE;
      for (var i = 0; i < count; i++) last[i] = {};
      paint();
    }

    var arrows = Array.prototype.slice.call(hero.querySelectorAll('[data-go]'));
    var spinButton = stage.querySelector('[data-spin]');
    plates.forEach(function (plate) { plate.addEventListener('click', onPlateClick); });
    arrows.forEach(function (arrow) { arrow.addEventListener('click', onArrowClick); });
    spinButton.addEventListener('click', spin);
    arc.addEventListener('pointerdown', onPointerDown);
    view.addEventListener('pointermove', onPointerMove);
    view.addEventListener('pointerup', onPointerEnd);
    view.addEventListener('pointercancel', onPointerEnd);
    var observer = new view.ResizeObserver(measure);
    observer.observe(arc);
    measure();

    return function destroy() {
      view.cancelAnimationFrame(frame);
      observer.disconnect();
      plates.forEach(function (plate) { plate.removeEventListener('click', onPlateClick); });
      arrows.forEach(function (arrow) { arrow.removeEventListener('click', onArrowClick); });
      spinButton.removeEventListener('click', spin);
      arc.removeEventListener('pointerdown', onPointerDown);
      view.removeEventListener('pointermove', onPointerMove);
      view.removeEventListener('pointerup', onPointerEnd);
      view.removeEventListener('pointercancel', onPointerEnd);
    };
  }

  /* The contact address. It's never in a page in one piece, so a scraper reading the HTML finds no name@domain address
     and no mailto: link: each [data-mail] block holds it backwards, with "/" in place of "@". It's put together only for
     someone who reaches for it. Email us gets its mailto: link as the pointer or the focus comes to it, and Show
     address puts the address on the page to read or copy. Without scripts the block is hidden, and the page spells
     the address out in words instead. */
  function createMail(box) {
    var view = box.ownerDocument.defaultView;
    var open = box.querySelector('[data-mail-open]');
    var show = box.querySelector('[data-mail-show]');
    var shown = box.querySelector('[data-mail-shown]');
    var text = box.querySelector('[data-mail-text]');
    var copy = box.querySelector('[data-mail-copy]');
    var status = box.querySelector('[data-mail-status]');
    var timer = 0;

    function address() {
      return box.dataset.mail.split('').reverse().join('').replace('/', '@');
    }

    function arm() {
      var href = 'mailto:' + address();
      if (open.getAttribute('href') !== href) open.setAttribute('href', href);
    }
    // The click itself still follows the link: the address is in place before the browser opens it.
    ['pointerenter', 'pointerdown', 'focus', 'click'].forEach(function (type) { open.addEventListener(type, arm); });

    show.addEventListener('click', function () {
      text.textContent = address();
      shown.hidden = false;
      text.focus();
      show.hidden = true;
    });

    copy.addEventListener('click', function () {
      var nav = view.navigator;
      if (nav.clipboard && view.isSecureContext) {
        nav.clipboard.writeText(address()).then(copied, selectAndCopy);
      } else {
        selectAndCopy();
      }
    });

    // Where the clipboard can't be written to, the address is selected so it can be copied by hand.
    function selectAndCopy() {
      var range = box.ownerDocument.createRange();
      range.selectNodeContents(text);
      var selection = view.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      var done = false;
      try { done = box.ownerDocument.execCommand('copy'); } catch (e) { /* the selection stays */ }
      if (done) copied();
    }

    // Says so on the page and to a screen reader, then clears. The line empties first, so copying again says it again.
    function copied() {
      view.clearTimeout(timer);
      status.textContent = '';
      timer = view.setTimeout(function () {
        status.textContent = status.dataset.done;
        timer = view.setTimeout(function () { status.textContent = ''; }, 3000);
      }, 60);
    }
  }

  /* The first screen's text. A turn lasts four seconds. It waits while the mouse is on the text, stops when a visitor
     picks a turn or presses pause, and doesn't start for someone who asked their system for less motion. */
  function createRotator(root) {
    var view = root.ownerDocument.defaultView;
    var items = Array.prototype.slice.call(root.querySelectorAll('[data-turn]'));
    var picks = Array.prototype.slice.call(root.querySelectorAll('[data-pick]'));
    var pauseButton = root.querySelector('.rot-pause');
    var turn = 0;
    var paused = false;
    var held = false;
    var timer = 0;
    function show(next) {
      turn = next;
      items.forEach(function (item) { item.classList.toggle('on', Number(item.dataset.turn) === next); });
      picks.forEach(function (pick, i) {
        pick.classList.toggle('on', i === next);
        if (i === next) pick.setAttribute('aria-current', 'true'); else pick.removeAttribute('aria-current');
      });
    }
    function wait() {
      view.clearTimeout(timer);
      timer = view.setTimeout(function () {
        if (!paused && !held && !root.ownerDocument.hidden) show((turn + 1) % picks.length);
        wait();
      }, 4000);
    }
    function setPaused(value) {
      paused = value;
      root.classList.toggle('paused', paused);
      pauseButton.setAttribute('aria-label', paused ? pauseButton.dataset.play : pauseButton.dataset.pause);
      wait();
    }
    picks.forEach(function (pick, i) {
      pick.addEventListener('click', function () { show(i); setPaused(true); });
    });
    pauseButton.addEventListener('click', function () { setPaused(!paused); });
    root.addEventListener('pointerover', function (event) {
      held = event.pointerType === 'mouse' && !event.target.closest('.rot-ctl');
    });
    root.addEventListener('pointerleave', function () { held = false; wait(); });
    setPaused(view.matchMedia('(prefers-reduced-motion: reduce)').matches);
    return function () { view.clearTimeout(timer); };
  }
})();
