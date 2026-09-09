/* =========================================================
   INFC.1405 shared site logic
   - language switch (fa/en) with persistence
   - live clock + date (Jalali when fa, Gregorian when en)
   - simple local visit counter (placeholder until real
     analytics is wired up)
   - image gallery renderer + lightbox
   ========================================================= */

(function () {
  "use strict";

  var LANG_KEY = "infc1405_lang";
  var VISIT_KEY = "infc1405_visits";

  function getLang() {
    return localStorage.getItem(LANG_KEY) || "fa";
  }

  function applyLang(lang) {
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", lang === "fa" ? "rtl" : "ltr");

    document.querySelectorAll("[data-fa][data-en]").forEach(function (el) {
      el.textContent = lang === "fa" ? el.getAttribute("data-fa") : el.getAttribute("data-en");
    });

    document.querySelectorAll("[data-fa-html][data-en-html]").forEach(function (el) {
      el.innerHTML = lang === "fa" ? el.getAttribute("data-fa-html") : el.getAttribute("data-en-html");
    });

    document.querySelectorAll("[data-fa-placeholder][data-en-placeholder]").forEach(function (el) {
      el.setAttribute("placeholder", lang === "fa" ? el.getAttribute("data-fa-placeholder") : el.getAttribute("data-en-placeholder"));
    });

    var toggle = document.querySelector(".lang-toggle .lang-toggle-label");
    if (toggle) toggle.textContent = lang === "fa" ? "English" : "فارسی";

    renderClockDate(lang);
  }

  function toggleLang() {
    var next = getLang() === "fa" ? "en" : "fa";
    localStorage.setItem(LANG_KEY, next);
    applyLang(next);
  }

  function toJalali(gy, gm, gd) {
    var g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    var jy = gy <= 1600 ? 0 : 979;
    gy -= gy <= 1600 ? 621 : 1600;
    var gy2 = gm > 2 ? gy + 1 : gy;
    var days = 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
    jy += 33 * Math.floor(days / 12053);
    days %= 12053;
    jy += 4 * Math.floor(days / 1461);
    days %= 1461;
    jy += Math.floor((days - 1) / 365);
    if (days > 365) days = (days - 1) % 365;
    var jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
    var jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
    return [jy, jm, jd];
  }

  var faMonths = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
  var faWeekdays = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];
  var enWeekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var enMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  function faDigits(str) {
    var map = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return String(str).replace(/\d/g, function (d) { return map[d]; });
  }

  function pad(n) { return n < 10 ? "0" + n : "" + n; }

  function renderClockDate(lang) {
    var now = new Date();
    var clockEl = document.querySelector(".clock-date .clock");
    var dateEl = document.querySelector(".clock-date .date");
    if (!clockEl || !dateEl) return;

    var timeStr = pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds());

    if (lang === "fa") {
      var j = toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
      var dateStr = faWeekdays[now.getDay()] + "، " + j[2] + " " + faMonths[j[1] - 1] + " " + j[0];
      clockEl.textContent = faDigits(timeStr);
      dateEl.textContent = faDigits(dateStr);
    } else {
      var dateStrEn = enWeekdays[now.getDay()] + ", " + enMonths[now.getMonth()] + " " + now.getDate() + ", " + now.getFullYear();
      clockEl.textContent = timeStr;
      dateEl.textContent = dateStrEn;
    }
  }

  function renderVisitCounter() {
    var count = parseInt(localStorage.getItem(VISIT_KEY) || "0", 10) + 1;
    localStorage.setItem(VISIT_KEY, count);
    document.querySelectorAll(".visit-counter .count").forEach(function (el) {
      el.textContent = (getLang() === "fa" ? faDigits(count) : count);
    });
  }

  var GALLERY_IMAGES = [
  ];

  function renderGallery(lang) {
    var grid = document.querySelector(".gallery-grid");
    if (!grid) return;
    grid.innerHTML = "";

    if (!GALLERY_IMAGES.length) {
      var empty = document.createElement("div");
      empty.className = "gallery-empty";
      empty.textContent = lang === "fa" ? "هنوز تصویری اضافه نشده است" : "No images added yet";
      grid.appendChild(empty);
      return;
    }

    GALLERY_IMAGES.forEach(function (item) {
      var cell = document.createElement("div");
      cell.className = "gallery-item";

      var img = document.createElement("img");
      img.src = item.file;
      img.alt = lang === "fa" ? item.caption_fa : item.caption_en;
      img.loading = "lazy";

      cell.appendChild(img);
      cell.addEventListener("click", function () {
        openLightbox(item.file, img.alt);
      });
      grid.appendChild(cell);
    });
  }

  function openLightbox(src, alt) {
    var overlay = document.querySelector(".lightbox-overlay");
    if (!overlay) return;
    overlay.querySelector("img").src = src;
    overlay.querySelector("img").alt = alt;
    overlay.classList.add("open");
  }

  function closeLightbox() {
    var overlay = document.querySelector(".lightbox-overlay");
    if (overlay) overlay.classList.remove("open");
  }

  document.addEventListener("DOMContentLoaded", function () {
    applyLang(getLang());
    renderVisitCounter();
    renderGallery(getLang());

    var toggleBtn = document.querySelector(".lang-toggle");
    if (toggleBtn) toggleBtn.addEventListener("click", toggleLang);

    var lightboxClose = document.querySelector(".lightbox-close");
    if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);

    var lightboxOverlay = document.querySelector(".lightbox-overlay");
    if (lightboxOverlay) {
      lightboxOverlay.addEventListener("click", function (e) {
        if (e.target === lightboxOverlay) closeLightbox();
      });
    }

    setInterval(function () { renderClockDate(getLang()); }, 1000);
  });

  var _applyLang = applyLang;
  applyLang = function (lang) {
    _applyLang(lang);
    renderGallery(lang);
  };
})();
