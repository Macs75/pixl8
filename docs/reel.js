/* Pixl8 game reel. Auto-advances through PIXL8_GAMES:
   pre-roll pause (title + author) -> play (muted) -> post-roll pause -> next.
   Starts on a random clip. Muted by default (browser autoplay policy); the
   speaker button unmutes. Exposes window.pixl8Reel.play(i) so the games.html
   grid can jump the reel to a specific clip. */
(function () {
  "use strict";
  var games = (window.PIXL8_GAMES || []).slice();
  var mount = document.querySelector("[data-reel]");
  if (!mount || !games.length) return;

  var PREROLL_MS = 2500;   // paused, showing the game, before it plays
  var POSTROLL_MS = 2000;  // paused after the clip ends, before the next one
  var VID_DIR = "games/";
  var POSTER_DIR = "games/posters/";

  // Speaker glyph shared by both states; the off state adds an X, the on
  // state adds sound waves — so the icon actually reflects sound on vs off.
  var SPK = '<path d="M1 4.5h2L6 2v8L3 7.5H1z" fill="currentColor"/>';
  var ICON_OFF = '<svg viewBox="0 0 14 12" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round">' +
    SPK + '<path d="M9 4.2l3.2 3.6M12.2 4.2 9 7.8"/></svg>';
  var ICON_ON = '<svg viewBox="0 0 14 12" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round">' +
    SPK + '<path d="M8.9 4a2.8 2.8 0 0 1 0 4M10.7 2.6a5 5 0 0 1 0 6.8"/></svg>';

  function posterFor(file) { return POSTER_DIR + file.replace(/\.mp4$/, ".jpg"); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) {
    return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }

  mount.classList.add("reel");
  mount.setAttribute("data-state", "preroll");
  mount.innerHTML =
    '<div class="reel-screen">' +
      '<div class="reel-stage">' +
        '<video playsinline muted preload="auto"></video>' +
        '<span class="reel-status">paused</span>' +
        '<span class="reel-count"></span>' +
        '<div class="reel-progress"></div>' +
        '<div class="reel-meta">' +
          '<div class="reel-title"></div>' +
          '<div class="reel-author"></div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="reel-controls">' +
      '<button class="reel-btn js-prev" type="button" aria-label="Previous game">' +
        '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M7 1 3 5l4 4z" fill="currentColor"/></svg> Prev</button>' +
      '<button class="reel-btn js-mute" type="button" aria-pressed="true" aria-label="Unmute">' +
        '<span class="js-mute-icon" aria-hidden="true"></span>' +
        '<span class="js-mute-label"></span></button>' +
      '<button class="reel-btn js-next" type="button" aria-label="Next game">Next ' +
        '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M3 1l4 4-4 4z" fill="currentColor"/></svg></button>' +
    '</div>' +
    '<a class="reel-bbs js-bbs" target="_blank" rel="noopener" href="#">' +
      'View this cart on the PICO-8 BBS ' +
      '<span aria-hidden="true">↗</span></a>';

  var screen = mount.querySelector(".reel-screen");
  var stage = mount.querySelector(".reel-stage");
  var video = mount.querySelector("video");
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var sliding = false;
  var elTitle = mount.querySelector(".reel-title");
  var elAuthor = mount.querySelector(".reel-author");
  var elCount = mount.querySelector(".reel-count");
  var elProg = mount.querySelector(".reel-progress");
  var muteBtn = mount.querySelector(".js-mute");
  var muteLabel = mount.querySelector(".js-mute-label");
  var muteIcon = mount.querySelector(".js-mute-icon");
  var bbsLink = mount.querySelector(".js-bbs");
  var idx = Math.floor(Math.random() * games.length);
  var timer = null;
  var userMuted = true;

  function setState(s) { mount.setAttribute("data-state", s); }
  function clearTimer() { if (timer) { clearTimeout(timer); timer = null; } }

  function render() {
    var g = games[idx];
    elTitle.textContent = g.title;
    elAuthor.innerHTML = g.author ? "by <b>" + esc(g.author) + "</b>" : "";
    elCount.textContent = (idx + 1) + " / " + games.length;
    if (bbsLink) {
      if (g.bbs) {
        bbsLink.href = "https://www.lexaloffle.com/bbs/?pid=" + encodeURIComponent(g.bbs);
        bbsLink.style.display = "";
      } else {
        bbsLink.style.display = "none";   // no BBS id known for this cart
      }
    }
    if (window.pixl8ReelSync) window.pixl8ReelSync(idx);
  }

  function load(i) {
    clearTimer();
    idx = ((i % games.length) + games.length) % games.length;
    var g = games[idx];
    render();
    setState("preroll");
    elProg.style.width = "0%";
    video.poster = posterFor(g.file);
    video.src = VID_DIR + g.file;
    video.muted = userMuted;
    video.load();
    // Hold on the first frame for a beat, then play.
    timer = setTimeout(startPlay, PREROLL_MS);
  }

  function startPlay() {
    setState("playing");
    var p = video.play();
    if (p && p.catch) p.catch(function () {
      // Autoplay blocked even muted: sit on the poster; a Prev/Next or the
      // grid (both user gestures) will get it going.
      setState("preroll");
    });
  }

  // Slide the current clip out one side and the next in from the other.
  // dir > 0 = next (out left, in from right); dir < 0 = prev (mirror).
  function slideTo(dir) {
    if (sliding) return;
    if (reduceMotion || !stage) { load(idx + dir); return; }
    sliding = true;
    var outX = dir > 0 ? "-103%" : "103%";
    var inX = dir > 0 ? "103%" : "-103%";
    stage.style.transition = "transform .26s ease-in, opacity .26s ease-in";
    stage.style.transform = "translateX(" + outX + ")";
    stage.style.opacity = ".25";
    setTimeout(function () {
      load(idx + dir);                        // swap to the new clip (poster / pre-roll)
      stage.style.transition = "none";        // jump to the incoming edge, no anim
      stage.style.transform = "translateX(" + inX + ")";
      stage.style.opacity = ".25";
      void stage.offsetWidth;                 // reflow so the slide-in actually animates
      stage.style.transition = "transform .3s ease-out, opacity .3s ease-out";
      stage.style.transform = "translateX(0)";
      stage.style.opacity = "1";
      setTimeout(function () { sliding = false; }, 300);
    }, 260);
  }

  function next() { slideTo(1); }
  function prev() { slideTo(-1); }

  video.addEventListener("timeupdate", function () {
    if (video.duration) elProg.style.width = (video.currentTime / video.duration * 100) + "%";
  });
  video.addEventListener("ended", function () {
    setState("postroll");
    elProg.style.width = "100%";
    clearTimer();
    timer = setTimeout(next, POSTROLL_MS);
  });
  // If a clip errors (missing/corrupt), skip to the next after a short beat.
  video.addEventListener("error", function () { clearTimer(); timer = setTimeout(next, 600); });

  mount.querySelector(".js-next").addEventListener("click", next);
  mount.querySelector(".js-prev").addEventListener("click", prev);
  function updateMute() {
    video.muted = userMuted;
    muteBtn.setAttribute("aria-pressed", String(userMuted));
    muteBtn.setAttribute("aria-label", userMuted ? "Unmute" : "Mute");
    muteIcon.innerHTML = userMuted ? ICON_OFF : ICON_ON;
    muteLabel.textContent = userMuted ? "Sound off" : "Sound on";
  }
  muteBtn.addEventListener("click", function () {
    userMuted = !userMuted;
    updateMute();
    if (!userMuted && video.paused && mount.getAttribute("data-state") === "playing") video.play();
  });
  updateMute();   // set initial icon + label

  // Pause the reel entirely when scrolled off-screen (saves bandwidth/CPU).
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { if (video.paused && mount.getAttribute("data-state") === "playing") video.play(); }
        else { video.pause(); }
      });
    }, { threshold: 0.25 }).observe(screen);
  }

  // Public: jump to a specific clip (grid click).
  window.pixl8Reel = {
    play: function (i) { load(i); screen.scrollIntoView({ behavior: "smooth", block: "center" }); }
  };

  load(idx);
})();
