/* INFC.1405 - barcode maker (Code128, EAN-13, EAN-8, UPC-A, Code39).
   Runs fully on the visitor's device; no external library. */
(function (root) {
  'use strict';

  /* ================= encoders ================= */

  var C128 = ['212222','222122','222221','121223','121322','131222','122213','122312','132212','221213',
    '221312','231212','112232','122132','122231','113222','123122','123221','223211','221132',
    '221231','213212','223112','312131','311222','321122','321221','312212','322112','322211',
    '212123','212321','232121','111323','131123','131321','112313','132113','132311','211313',
    '231113','231311','112133','112331','132131','113123','113321','133121','313121','211331',
    '231131','213113','213311','213131','311123','311321','331121','312113','312311','332111',
    '314111','221411','431111','111224','111422','121124','121421','141122','141221','112214',
    '112412','122114','122411','142112','142211','241211','221114','413111','241112','134111',
    '111242','121142','121241','114212','124112','124211','411212','421112','421211','212141',
    '214121','412121','111143','111341','131141','114113','114311','411113','411311','113141',
    '114131','311141','411131','211412','211214','211232','2331112'];

  function widthsToModules(pattern) {
    var m = '', bar = true;
    for (var i = 0; i < pattern.length; i++) {
      var w = +pattern[i];
      m += (bar ? '1' : '0').repeat(w);
      bar = !bar;
    }
    return m;
  }

  function code128Codes(str) {
    var n = str.length, out = [], mode = '', i = 0;
    function isDigit(c) { return c >= '0' && c <= '9'; }
    function run(p) { var k = 0; while (p + k < n && isDigit(str[p + k])) k++; return k; }
    function bval(ch) { return str.charCodeAt(i) - 32; }
    while (i < n) {
      var r = run(i);
      if (mode !== 'C') {
        var need = mode === '' ? 4 : 6;
        if (r >= need || (i + r === n && r >= 4)) {
          if (r % 2 === 1) {
            if (mode === '') { out.push(104); mode = 'B'; }
            out.push(bval()); i++;
          }
          out.push(mode === '' ? 105 : 99); mode = 'C';
          continue;
        }
        if (mode === '') { out.push(104); mode = 'B'; }
        out.push(bval()); i++;
      } else {
        if (r >= 2) { out.push(parseInt(str.substr(i, 2), 10)); i += 2; }
        else { out.push(100); mode = 'B'; }
      }
    }
    var sum = out[0];
    for (var k = 1; k < out.length; k++) sum += out[k] * k;
    out.push(sum % 103);
    out.push(106);
    return out;
  }

  function encode128(str) {
    var codes = code128Codes(str), m = '';
    for (var i = 0; i < codes.length; i++) m += widthsToModules(C128[codes[i]]);
    return m;
  }

  var C39 = {
    '0':'000110100','1':'100100001','2':'001100001','3':'101100000','4':'000110001','5':'100110000',
    '6':'001110000','7':'000100101','8':'100100100','9':'001100100','A':'100001001','B':'001001001',
    'C':'101001000','D':'000011001','E':'100011000','F':'001011000','G':'000001101','H':'100001100',
    'I':'001001100','J':'000011100','K':'100000011','L':'001000011','M':'101000010','N':'000010011',
    'O':'100010010','P':'001010010','Q':'000000111','R':'100000110','S':'001000110','T':'000010110',
    'U':'110000001','V':'011000001','W':'111000000','X':'010010001','Y':'110010000','Z':'011010000',
    '-':'010000101','.':'110000100',' ':'011000100','*':'010010100','$':'010101000','/':'010100010',
    '+':'010001010','%':'000101010'
  };

  function encode39(str) {
    var s = '*' + str + '*', m = '';
    for (var i = 0; i < s.length; i++) {
      var p = C39[s[i]];
      for (var j = 0; j < 9; j++) m += (j % 2 === 0 ? '1' : '0').repeat(p[j] === '1' ? 3 : 1);
      if (i < s.length - 1) m += '0';
    }
    return m;
  }

  var L = ['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
  var R = L.map(function (s) { return s.replace(/[01]/g, function (c) { return c === '1' ? '0' : '1'; }); });
  var G = R.map(function (s) { return s.split('').reverse().join(''); });
  var PAR = ['LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL'];

  function checkDigit(d) {
    var sum = 0, w = 3;
    for (var i = d.length - 1; i >= 0; i--) { sum += (+d[i]) * w; w = w === 3 ? 1 : 3; }
    return (10 - sum % 10) % 10;
  }
  function encodeEAN13(d) {
    var par = PAR[+d[0]], m = '101', i;
    for (i = 1; i <= 6; i++) m += (par[i - 1] === 'L' ? L : G)[+d[i]];
    m += '01010';
    for (i = 7; i <= 12; i++) m += R[+d[i]];
    return m + '101';
  }
  function encodeEAN8(d) {
    var m = '101', i;
    for (i = 0; i < 4; i++) m += L[+d[i]];
    m += '01010';
    for (i = 4; i < 8; i++) m += R[+d[i]];
    return m + '101';
  }

  /* ================= validation ================= */

  function faDigits(s) {
    return s.replace(/[۰-۹]/g, function (c) { return String(c.charCodeAt(0) - 1776); })
            .replace(/[٠-٩]/g, function (c) { return String(c.charCodeAt(0) - 1632); });
  }

  var NUM = { ean13: 13, ean8: 8, upca: 12 };

  /* returns {ok:true, value} or {ok:false, err:{fa,en}} */
  function prepare(type, raw) {
    var v = faDigits(String(raw || '')).trim();
    if (!v) return { ok: false, err: { fa: 'ابتدا کد را وارد کنید.', en: 'Enter the code first.' } };

    if (type === 'code128') {
      if (v.length > 80) return { ok: false, err: { fa: 'حداکثر ۸۰ نویسه مجاز است.', en: 'At most 80 characters are allowed.' } };
      if (!/^[\x20-\x7E]+$/.test(v)) return { ok: false, err: { fa: 'فقط حروف انگلیسی، عدد و علامت مجاز است (حروف فارسی پشتیبانی نمی‌شود).', en: 'Only English letters, digits and symbols are allowed (no Persian letters).' } };
      return { ok: true, value: v };
    }

    if (type === 'code39') {
      v = v.toUpperCase();
      if (v.length > 40) return { ok: false, err: { fa: 'حداکثر ۴۰ نویسه مجاز است.', en: 'At most 40 characters are allowed.' } };
      if (/\*/.test(v) || !/^[0-9A-Z \-.$\/+%]+$/.test(v)) return { ok: false, err: { fa: 'فقط حروف بزرگ انگلیسی، عدد، فاصله و - . $ / + % مجاز است.', en: 'Only capital English letters, digits, space and - . $ / + % are allowed.' } };
      return { ok: true, value: v };
    }

    var len = NUM[type];
    if (!/^\d+$/.test(v)) return { ok: false, err: { fa: 'فقط عدد وارد کنید.', en: 'Digits only, please.' } };
    if (v.length !== len - 1 && v.length !== len) {
      return { ok: false, err: { fa: 'تعداد ارقام باید ' + (len - 1) + ' یا ' + len + ' باشد.', en: 'Enter ' + (len - 1) + ' or ' + len + ' digits.' } };
    }
    var data = v.slice(0, len - 1), cd = checkDigit(data);
    if (v.length === len) {
      if (+v[len - 1] !== cd) return { ok: false, err: { fa: 'رقم کنترل اشتباه است. رقم درست برای این کد: ' + cd + ' (یا فقط ' + (len - 1) + ' رقم اول را بنویسید).', en: 'Wrong check digit. The correct one is ' + cd + ' (or enter just the first ' + (len - 1) + ' digits).' } };
      return { ok: true, value: v };
    }
    return { ok: true, value: data + cd };
  }

  /* ================= layout ================= */

  function build(type, value) {
    var q = 10, modules, parts = [], gap = null;
    if (type === 'code128') { modules = encode128(value); }
    else if (type === 'code39') { modules = encode39(value); }
    else if (type === 'ean13') {
      q = 11; modules = encodeEAN13(value);
      parts.push({ t: value[0], x: q - 4.5 });
      for (var a = 0; a < 6; a++) parts.push({ t: value[1 + a], x: q + 3 + 7 * (a + .5) });
      for (var b = 0; b < 6; b++) parts.push({ t: value[7 + b], x: q + 50 + 7 * (b + .5) });
    } else if (type === 'ean8') {
      q = 11; modules = encodeEAN8(value);
      for (var c = 0; c < 4; c++) parts.push({ t: value[c], x: q + 3 + 7 * (c + .5) });
      for (var d = 0; d < 4; d++) parts.push({ t: value[4 + d], x: q + 36 + 7 * (d + .5) });
    } else { /* upca */
      q = 11; modules = encodeEAN13('0' + value);
      parts.push({ t: value[0], x: q - 4.5 });
      for (var e = 1; e <= 5; e++) parts.push({ t: value[e], x: q + 3 + 7 * (e + .5) });
      for (var f = 0; f < 5; f++) parts.push({ t: value[6 + f], x: q + 50 + 7 * (f + .5) });
      parts.push({ t: value[11], x: q + 95 + 4.5 });
    }
    var total = modules.length + q * 2;
    if (!parts.length) parts.push({ t: value, x: total / 2, whole: true });
    var barsH = Math.max(40, Math.round(total * 0.2));
    return { modules: modules, q: q, total: total, parts: parts, barsH: barsH };
  }

  function geom(lay, showText) {
    return { top: 4, barsH: lay.barsH, font: 9, H: 4 + lay.barsH + (showText ? 12 : 0) + 3 };
  }

  function runs(lay) {
    var out = [], m = lay.modules, i = 0;
    while (i < m.length) {
      if (m[i] === '1') { var s = i; while (i < m.length && m[i] === '1') i++; out.push([lay.q + s, i - s]); }
      else i++;
    }
    return out;
  }

  function renderCanvas(canvas, lay, o) {
    var g = geom(lay, o.showText);
    var mpx = Math.max(1, Math.floor(o.targetWidth / lay.total));
    canvas.width = lay.total * mpx;
    canvas.height = g.H * mpx;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = o.bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = o.fg;
    runs(lay).forEach(function (r) { ctx.fillRect(r[0] * mpx, g.top * mpx, r[1] * mpx, g.barsH * mpx); });
    if (o.showText) {
      ctx.font = (g.font * mpx) + 'px "Space Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      var y = (g.top + g.barsH + 2 + 7.5) * mpx;
      lay.parts.forEach(function (p) { ctx.fillText(p.t, p.x * mpx, y); });
    }
  }

  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function renderSVG(lay, o) {
    var g = geom(lay, o.showText);
    var mpx = Math.max(1, Math.floor(o.targetWidth / lay.total));
    var d = runs(lay).map(function (r) { return 'M' + r[0] + ' ' + g.top + 'h' + r[1] + 'v' + g.barsH + 'h-' + r[1] + 'z'; }).join('');
    var svg = '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="' + (lay.total * mpx) +
      '" height="' + (g.H * mpx) + '" viewBox="0 0 ' + lay.total + ' ' + g.H + '">' +
      '<rect width="100%" height="100%" fill="' + o.bg + '"/>' +
      '<path d="' + d + '" fill="' + o.fg + '" shape-rendering="crispEdges"/>';
    if (o.showText) {
      var y = g.top + g.barsH + 2 + 7.5;
      svg += '<g fill="' + o.fg + '" font-family="Space Mono, monospace" font-size="' + g.font + '" text-anchor="middle">';
      lay.parts.forEach(function (p) { svg += '<text x="' + p.x + '" y="' + y + '">' + esc(p.t) + '</text>'; });
      svg += '</g>';
    }
    return svg + '</svg>';
  }

  var API = { prepare: prepare, build: build, encode128: encode128, code128Codes: code128Codes, encode39: encode39,
    encodeEAN13: encodeEAN13, encodeEAN8: encodeEAN8, checkDigit: checkDigit, C128: C128, C39: C39,
    renderSVG: renderSVG, renderCanvas: renderCanvas };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  root.INFCBarcode = API;

  /* ================= page UI ================= */

  if (typeof document === 'undefined' || !document.getElementById('bcType')) return;

  var $ = function (id) { return document.getElementById(id); };

  function isEn() {
    if (root.INFC && root.INFC.getLang) return root.INFC.getLang() === 'en';
    var lang = (document.documentElement.getAttribute('lang') || 'fa').toLowerCase();
    if (lang === 'en') return true;
    var lbl = document.querySelector('.lang-toggle-label');
    return !!(lbl && /فارسی/.test(lbl.textContent));
  }
  function t(o) { return isEn() ? o.en : o.fa; }

  var INFO = {
    code128: {
      name: { fa: 'Code128', en: 'Code128' },
      use: { fa: 'مناسب هر متن یا عدد انگلیسی و بسیار فشرده است. بیشتر برای کد داخلی کالا، شماره سفارش، کد پیگیری و انبارداری استفاده می‌شود.', en: 'Fits any English text or number and is very compact. Mostly used for internal product codes, order numbers, tracking codes and warehousing.' },
      rule: { fa: 'حروف انگلیسی، عدد و علامت‌های رایج (بدون حروف فارسی).', en: 'English letters, digits and common symbols (no Persian letters).' },
      example: 'INFC-1405'
    },
    ean13: {
      name: { fa: 'EAN-13', en: 'EAN-13' },
      use: { fa: 'استاندارد جهانی بارکد کالا و رایج‌ترین بارکد روی محصولات فروشگاهی. برای استفاده‌ی داخلی فروشگاه کافی است؛ برای فروش با کد جهانی ثبت‌شده باید از GS1 کد بگیرید.', en: 'The worldwide standard for retail products. Fine for in-store use; for a registered global product code you need to obtain one from GS1.' },
      rule: { fa: '۱۲ رقم بنویسید تا رقم کنترل خودکار اضافه شود، یا ۱۳ رقم کامل (رقم کنترل بررسی می‌شود).', en: 'Enter 12 digits and the check digit is added automatically, or all 13 digits (the check digit is verified).' },
      example: '590123412345'
    },
    ean8: {
      name: { fa: 'EAN-8', en: 'EAN-8' },
      use: { fa: 'نسخه‌ی کوتاه EAN-13 برای کالاهای کوچک که جای بارکد بلند ندارند.', en: 'The short version of EAN-13, for small products with no room for a long barcode.' },
      rule: { fa: '۷ رقم بنویسید تا رقم کنترل خودکار اضافه شود، یا ۸ رقم کامل.', en: 'Enter 7 digits and the check digit is added automatically, or all 8 digits.' },
      example: '9638507'
    },
    upca: {
      name: { fa: 'UPC-A', en: 'UPC-A' },
      use: { fa: 'بارکد ۱۲ رقمی رایج در آمریکا و کانادا. بیشتر اسکنرها آن را می‌خوانند، ولی در بازار ایران کاربرد کمتری دارد.', en: 'A 12-digit barcode common in the US and Canada. Most scanners read it, but it is less used in the Iranian market.' },
      rule: { fa: '۱۱ رقم بنویسید تا رقم کنترل خودکار اضافه شود، یا ۱۲ رقم کامل.', en: 'Enter 11 digits and the check digit is added automatically, or all 12 digits.' },
      example: '03600029145'
    },
    code39: {
      name: { fa: 'Code39', en: 'Code39' },
      use: { fa: 'قدیمی‌تر و ساده است و فقط حروف بزرگ انگلیسی، عدد و چند علامت را پشتیبانی می‌کند. بیشتر در صنعت، انبار و کارت‌های شناسایی دیده می‌شود و پهن‌تر از Code128 است.', en: 'Older and simple; supports only capital English letters, digits and a few symbols. Seen mostly in industry, warehouses and ID cards, and wider than Code128.' },
      rule: { fa: 'حروف بزرگ انگلیسی، عدد، فاصله و - . $ / + %', en: 'Capital English letters, digits, space and - . $ / + %' },
      example: 'INFC1405'
    }
  };

  var typeEl = $('bcType'), info = $('bcInfo'), step2 = $('bcStep2'), valEl = $('bcValue'),
      hint = $('bcHint'), msg = $('bcMsg'), canvas = $('bcCanvas'), empty = $('bcEmpty'),
      dlPng = $('bcDlPng'), dlSvg = $('bcDlSvg');
  var current = null; /* {type, value, svg} after a barcode is made */

  function setMsg(text, bad) { msg.textContent = text || ''; msg.style.color = bad ? '#c0392b' : ''; }

  function renderInfo() {
    var tp = typeEl.value, d = INFO[tp];
    if (!d) { info.hidden = true; return; }
    $('bcInfoTitle').textContent = t(d.name);
    $('bcInfoUse').textContent = t(d.use);
    $('bcInfoRule').textContent = t({ fa: 'ورودی: ', en: 'Input: ' }) + t(d.rule);
    $('bcInfoEx').textContent = t({ fa: 'نمونه: ', en: 'Example: ' }) + d.example;
    hint.textContent = t(d.rule) + ' ' + t({ fa: 'نمونه: ', en: 'Example: ' }) + d.example;
    valEl.placeholder = d.example;
    info.hidden = false;
  }

  function clearOutput() {
    current = null;
    canvas.hidden = true; canvas.style.display = 'none'; empty.hidden = false;
    dlPng.disabled = true; dlSvg.disabled = true;
    setMsg('');
  }

  typeEl.addEventListener('change', function () {
    step2.hidden = true; valEl.value = '';
    clearOutput(); renderInfo();
  });

  $('bcAccept').addEventListener('click', function () {
    step2.hidden = false; valEl.focus();
  });

  function make() {
    var tp = typeEl.value;
    var p = prepare(tp, valEl.value);
    if (!p.ok) { setMsg(t(p.err), true); return; }
    var lay = build(tp, p.value);
    var o = { fg: $('bcFg').value, bg: $('bcBg').value, showText: $('bcShowText').checked, targetWidth: +$('bcSize').value };
    renderCanvas(canvas, lay, o);
    canvas.hidden = false; canvas.style.display = 'block'; empty.hidden = true;
    current = { type: tp, value: p.value, svg: renderSVG(lay, o) };
    dlPng.disabled = false; dlSvg.disabled = false;
    if (p.value !== valEl.value.trim()) valEl.value = p.value;
    setMsg(t({ fa: 'بارکد ساخته شد. قبل از چاپ، حتماً با اسکنر یا گوشی تست کنید.', en: 'Barcode created. Always test it with a scanner or phone before printing.' }));
    document.dispatchEvent(new CustomEvent('infc:code-created', { detail: { kind: 'barcode', type: tp, value: p.value } }));
  }
  $('bcMake').addEventListener('click', make);
  valEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); make(); } });

  function fileName(ext) {
    var safe = current.value.replace(/[^A-Za-z0-9._-]+/g, '_').slice(0, 30);
    return 'barcode-' + current.type + '-' + safe + '.' + ext;
  }
  function save(blob, name) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
  }
  dlPng.addEventListener('click', function () {
    if (!current) return;
    canvas.toBlob(function (b) { save(b, fileName('png')); }, 'image/png');
  });
  dlSvg.addEventListener('click', function () {
    if (!current) return;
    save(new Blob([current.svg], { type: 'image/svg+xml' }), fileName('svg'));
  });

  function refreshTexts() {
    renderInfo();
    empty.textContent = t({ fa: 'بارکد ساخته‌شده اینجا نمایش داده می‌شود', en: 'Your barcode will appear here' });
  }
  document.addEventListener('infc:langchange', refreshTexts);
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.lang-toggle')) setTimeout(refreshTexts, 60);
  });

  empty.textContent = t({ fa: 'بارکد ساخته‌شده اینجا نمایش داده می‌شود', en: 'Your barcode will appear here' });
  clearOutput();
})(typeof window !== 'undefined' ? window : globalThis);
