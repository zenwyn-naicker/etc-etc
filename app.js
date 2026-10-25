(function () {
  "use strict";

  var team = window.TEAM;
  var draft = team.draft === true;

  var ICONS = {
    email: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="m3.5 6 8.5 7 8.5-7"/></svg>',
    linkedin: '<svg class="icon icon--fill" viewBox="0 0 24 24" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4V21H3zM9.5 9.75h3.8v1.6h.06c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.77 2.65 4.77 6.1V21h-4v-4.98c0-1.19-.02-2.72-1.66-2.72-1.66 0-1.92 1.3-1.92 2.63V21h-4z"/></svg>'
  };

  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function initials(name) {
    var parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
  }

  function linkHtml(kind, href, label) {
    if (!href) {
      if (!draft) return "";
      return '<a class="icon-btn is-placeholder" href="#" aria-disabled="true" data-placeholder title="' +
        esc(label) + ' (not added yet)" aria-label="' + esc(label) + ' (not added yet)">' + ICONS[kind] + "</a>";
    }
    var external = /^https?:/.test(href);
    return '<a class="icon-btn" href="' + esc(href) + '"' +
      (external ? ' target="_blank" rel="noopener"' : "") +
      ' title="' + esc(label) + '" aria-label="' + esc(label) + '">' + ICONS[kind] + "</a>";
  }

  function memberHtml(m) {
    var parts = m.name.trim().split(/\s+/);
    var first = parts[0];
    // First name and surname in separate spans so wide screens can stack them
    var name = "<span>" + esc(first) + "</span> <span>" + esc(parts.slice(1).join(" ")) + "</span>";
    var avatar = m.photo
      ? '<img src="' + esc(m.photo) + '" alt="" width="112" height="112" loading="lazy">'
      : esc(initials(m.name));
    return (
      '<article class="member">' +
        '<span class="bracket bracket--tl" aria-hidden="true"></span>' +
        '<span class="bracket bracket--br" aria-hidden="true"></span>' +
        '<div class="avatar">' + avatar + "</div>" +
        '<div class="member__info">' +
          '<h3 class="member__name">' + name + "</h3>" +
          '<div class="member__links">' +
            linkHtml("email", m.email && "mailto:" + m.email, "Email " + first) +
            linkHtml("linkedin", m.linkedin, first + " on LinkedIn") +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  document.querySelector("[data-members]").innerHTML = team.members.map(memberHtml).join("");
  if (draft) document.querySelector("[data-draft-pill]").hidden = false;

  // Intro: binary digits materialise inside the letter shapes, then resolve into the solid
  // logo while the corner brackets draw in. The digits are the real ASCII of "ETC ETC"
  // (E = 01000101, T = 01010100, C = 01000011); they flicker randomly until they settle.
  var BITS = "ETC ETC".split("").map(function (ch) {
    return ("0000000" + ch.charCodeAt(0).toString(2)).slice(-8);
  }).join("");

  var STEPS = 14;          // digit images, from sparse to fully formed
  var BUILD = 1100;        // ms for the digits to fill the letters
  var HOLD = 350;          // ms the finished binary letters stay on screen
  var RESOLVE = 650;       // ms to turn into the solid logo
  var DELAY = 150;

  function drawBinary(box, fontSize) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.ceil(box.width * dpr);
    var h = Math.ceil(box.height * dpr);
    var cell = Math.max(7, fontSize / 11) * dpr;
    var step = cell * 0.62;
    var line = cell * 0.82;  // rows packed close so the letters read as solid shapes
    var cols = Math.ceil(w / step);
    var rows = Math.ceil(h / line);
    var rust = getComputedStyle(document.documentElement).getPropertyValue("--rust").trim();
    var arrival = [];
    for (var i = 0; i < cols * rows; i++) arrival.push(Math.random());

    var frames = [];
    for (var k = 1; k <= STEPS; k++) {
      var canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      var ctx = canvas.getContext("2d");
      ctx.font = "700 " + cell + "px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
      ctx.textBaseline = "top";
      var shown = k / STEPS;
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var n = r * cols + c;
          if (arrival[n] > shown) continue;
          var age = shown - arrival[n];
          var settled = k === STEPS || age > 0.35;
          var bit = settled ? BITS[n % BITS.length] : (Math.random() < 0.5 ? "0" : "1");
          // New digits flash rust while building; the finished letters are pure white
          var fresh = k < STEPS && age < 0.1;
          ctx.fillStyle = fresh ? rust : "rgba(255, 255, 255, " + (settled ? 1 : 0.5 + Math.random() * 0.4) + ")";
          ctx.fillText(bit, c * step, r * line);
        }
      }
      frames.push(canvas);
    }
    // Turn each frame into a decoded image URL so swapping them never flickers
    return Promise.all(frames.map(function (canvas) {
      return new Promise(function (resolve) { canvas.toBlob(resolve); }).then(function (blob) {
        var url = URL.createObjectURL(blob);
        var img = new Image();
        img.src = url;
        return (img.decode ? img.decode() : Promise.resolve()).then(function () { return url; });
      });
    }));
  }

  function playIntro() {
    var root = document.documentElement;
    var reveal = function () { root.classList.remove("intro-pending"); };
    var frame = document.querySelector(".frame");
    // Too late (slow connection) or unsupported: just show the logo
    if (!root.classList.contains("intro-pending") || !frame || !frame.animate || performance.now() > 2500) return reveal();

    var text = frame.querySelector("h1.wordmark");
    var binary = frame.querySelector(".wordmark-binary");
    var brackets = frame.querySelectorAll(".hero .bracket");

    drawBinary(binary.getBoundingClientRect(), parseFloat(getComputedStyle(binary).fontSize)).then(function (urls) {
      var total = DELAY + BUILD + HOLD + RESOLVE;
      var builtAt = (DELAY + BUILD) / total;
      var resolveAt = (DELAY + BUILD + HOLD) / total;
      var timing = { duration: total, fill: "both" };

      // Step through the digit images, sparse to fully formed, on the same clock
      var steps = urls.map(function (url, k) {
        return { offset: (DELAY + BUILD * k / STEPS) / total, backgroundImage: "url(" + url + ")" };
      });
      steps.push({ offset: 1, backgroundImage: steps[steps.length - 1].backgroundImage });

      var animations = [
        binary.animate([
          { offset: 0, opacity: 1 },
          { offset: resolveAt, opacity: 1 },
          { offset: 1, opacity: 0 }
        ], timing),
        binary.animate(steps, timing),
        // A faint glow of the letters builds up behind the digits, then turns solid
        text.animate([
          { offset: 0, opacity: 0, filter: "blur(8px)" },
          { offset: builtAt, opacity: 0.18, filter: "blur(8px)" },
          { offset: resolveAt, opacity: 0.18, filter: "blur(8px)" },
          { offset: 1, opacity: 1, filter: "blur(0px)" }
        ], timing)
      ];
      // The brackets draw out from their corners as the digits finish
      Array.prototype.forEach.call(brackets, function (el) {
        var size = { width: el.offsetWidth + "px", height: el.offsetHeight + "px" };
        animations.push(el.animate([
          { offset: 0, opacity: 0, width: "0px", height: "0px" },
          { offset: 0.25, opacity: 1, width: "0px", height: "0px", easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" },
          Object.assign({ offset: builtAt, opacity: 1 }, size),
          Object.assign({ offset: 1, opacity: 1 }, size)
        ], timing));
      });
      reveal();

      // Hand back to the stylesheet afterwards so the brackets still resize with the screen
      animations[0].onfinish = function () {
        animations.forEach(function (a) { a.cancel(); });
        urls.forEach(function (url) { URL.revokeObjectURL(url); });
      };
    }).catch(reveal);
  }

  // Draw once the fonts are in, so the digits fill the real letter shapes
  var fontsReady = document.fonts
    ? Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 800); })])
    : Promise.resolve();
  fontsReady.then(playIntro);

  // Intro video: plays only while on screen. If the phone blocks autoplay
  // (e.g. iPhone Low Power Mode) or the viewer prefers less motion, show a still instead.
  var video = document.querySelector("[data-intro]");
  if (video) {
    var still = "assets/intro-still.jpg";
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      video.poster = still;
      video.controls = true;
    } else {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            video.pause();
            return;
          }
          var playing = video.play();
          if (playing) playing.catch(function () { video.poster = still; });
        });
      }, { threshold: 0.25 }).observe(video);
    }
  }

  document.addEventListener("click", function (event) {
    if (event.target.closest("[data-placeholder]")) event.preventDefault();
  });
})();
