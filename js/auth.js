/* INFC.1405 - عضویت و تاریخچه QR (Firebase) */
const V = "10.14.1";
const firebaseConfig = {
  apiKey: "AIzaSyCFOQ6bS5FrYoGmpuwjeN6y9Lk3T87SgiU",
  authDomain: "infc-site.firebaseapp.com",
  projectId: "infc-site",
  storageBucket: "infc-site.firebasestorage.app",
  messagingSenderId: "527376014399",
  appId: "1:527376014399:web:ef9df8506c69b1bc132c8a"
};

const $ = (id) => document.getElementById(id);
const isFa = () => !(window.INFC && window.INFC.getLang && window.INFC.getLang() === "en");
const t = (fa, en) => (isFa() ? fa : en);

function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const k in attrs || {}) {
    const v = attrs[k];
    if (v === false || v == null) continue;
    if (k === "class") e.className = v;
    else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? "" : v);
  }
  kids.flat().forEach((c) => { if (c != null && c !== false) e.append(c); });
  return e;
}

const CSS = `
.auth-wrap{margin:18px 0}
.auth-input{width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid rgba(128,128,128,.55);border-radius:8px;background:transparent;color:inherit;font:inherit}
.auth-link{background:none;border:0;padding:0;color:inherit;text-decoration:underline;cursor:pointer;font:inherit}
.auth-links{display:flex;gap:16px;flex-wrap:wrap;margin-top:12px}
.auth-nudge{margin-top:14px;padding:12px 14px;border:1px dashed rgba(128,128,128,.7);border-radius:10px}
.auth-nudge p{margin:0 0 10px}
.hist-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;margin-top:14px}
.hist-item{border:1px solid rgba(128,128,128,.4);border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:10px}
.hist-item img{width:100%;max-width:150px;aspect-ratio:1;object-fit:contain;background:#fff;border-radius:8px;align-self:center}
.hist-meta{font-size:.88em;opacity:.9;word-break:break-word}
`;

const ERR = {
  "auth/invalid-email": ["ایمیل معتبر نیست.", "The email address is not valid."],
  "auth/missing-password": ["رمز را وارد کنید.", "Enter your password."],
  "auth/weak-password": ["رمز باید حداقل ۶ کاراکتر باشد.", "Password must be at least 6 characters."],
  "auth/email-already-in-use": ["این ایمیل قبلاً ثبت‌نام کرده است. وارد شوید.", "This email is already registered. Please sign in."],
  "auth/invalid-credential": ["ایمیل یا رمز اشتباه است.", "Wrong email or password."],
  "auth/user-not-found": ["ایمیل یا رمز اشتباه است.", "Wrong email or password."],
  "auth/wrong-password": ["ایمیل یا رمز اشتباه است.", "Wrong email or password."],
  "auth/too-many-requests": ["تلاش‌های زیاد. کمی بعد دوباره امتحان کنید.", "Too many attempts. Try again later."],
  "auth/network-request-failed": ["اتصال به سرویس برقرار نشد. اینترنت یا فیلترشکن را بررسی کنید.", "Could not reach the service. Check your connection or VPN."],
  "auth/popup-closed-by-user": ["ورود با گوگل لغو شد.", "Google sign-in was cancelled."],
  "auth/cancelled-popup-request": ["ورود با گوگل لغو شد.", "Google sign-in was cancelled."],
  "auth/popup-blocked": ["پنجره‌ی ورود مسدود شد. اجازه‌ی پاپ‌آپ بدهید.", "The sign-in popup was blocked. Allow popups."],
  "auth/unauthorized-domain": ["این دامنه در Firebase مجاز نشده است.", "This domain is not authorized in Firebase."]
};
const errText = (e) => ERR[(e && e.code) || ""] || ["خطایی رخ داد. دوباره امتحان کنید.", "Something went wrong. Please try again."];

async function main() {
  const layout = document.querySelector(".qr-layout");
  const dlPng = $("qrDlPng");
  if (!layout || !dlPng) return;

  document.head.append(h("style", null, CSS));
  const authBox = h("section", { class: "auth-wrap" });
  const historyBox = h("section", { class: "auth-wrap" });
  const nudge = h("div", { class: "auth-nudge", hidden: true });
  layout.before(authBox);
  layout.after(historyBox);
  const actions = layout.querySelector(".qr-actions");
  if (actions) actions.after(nudge); else layout.append(nudge);

  const S = { ready: false, failed: false, user: null, open: false, mode: "login",
              busy: false, email: "", pass: "", msg: null, nudge: null,
              history: null, histErr: false };
  let fb = null;
  let lastSaved = "";

  const setMsg = (pair, kind) => { S.msg = pair ? { p: pair, kind } : null; };

  /* ---------- عملیات ورود ---------- */
  async function doEmail() {
    S.busy = true; setMsg(null); render();
    try {
      const A = fb.A, email = S.email.trim();
      if (S.mode === "signup") await A.createUserWithEmailAndPassword(fb.auth, email, S.pass);
      else await A.signInWithEmailAndPassword(fb.auth, email, S.pass);
      S.open = false; S.pass = "";
    } catch (e) { setMsg(errText(e), "err"); }
    S.busy = false; render();
  }
  async function doGoogle() {
    S.busy = true; setMsg(null); render();
    try { await fb.A.signInWithPopup(fb.auth, new fb.A.GoogleAuthProvider()); S.open = false; }
    catch (e) { setMsg(errText(e), "err"); }
    S.busy = false; render();
  }
  async function doReset() {
    const email = S.email.trim();
    if (!email) { setMsg(["ابتدا ایمیل را وارد کنید.", "Enter your email first."], "err"); render(); return; }
    try {
      await fb.A.sendPasswordResetEmail(fb.auth, email);
      setMsg(["اگر این ایمیل ثبت شده باشد، لینک بازیابی ارسال می‌شود.", "If this email is registered, a reset link has been sent."], "ok");
    } catch (e) { setMsg(errText(e), "err"); }
    render();
  }
  async function doSignOut() {
    try { await fb.A.signOut(fb.auth); } catch (e) {}
    lastSaved = "";
  }

  /* ---------- تاریخچه ---------- */
  async function loadHistory() {
    if (!S.user || !fb) { S.history = null; renderHistory(); return; }
    try {
      const F = fb.F;
      const q = F.query(F.collection(fb.db, "users", S.user.uid, "qrs"), F.orderBy("createdAt", "desc"), F.limit(30));
      const snap = await F.getDocs(q);
      S.history = snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
      S.histErr = false;
    } catch (e) { S.history = []; S.histErr = true; }
    renderHistory();
  }
  async function delItem(id) {
    if (!confirm(t("این QR از تاریخچه حذف شود؟", "Delete this QR from history?"))) return;
    try { await fb.F.deleteDoc(fb.F.doc(fb.db, "users", S.user.uid, "qrs", id)); } catch (e) {}
    loadHistory();
  }
  function summaryOf(type) {
    const ids = { url: "qrUrl", instagram: "qrIg", telegram: "qrTg", whatsapp: "qrPhone", phone: "qrPhone", email: "qrEmail", text: "qrText" };
    const el = $(ids[type]);
    return el ? el.value.trim().slice(0, 120) : "";
  }
  function typeLabel(type) {
    const o = document.querySelector('#qrType option[value="' + type + '"]');
    return o ? o.getAttribute(isFa() ? "data-fa" : "data-en") || type : type;
  }
  function setNudge(pair, kind) { S.nudge = pair ? { p: pair, kind } : null; renderNudge(); }

  async function saveCurrent() {
    if (!S.user || !fb || dlPng.disabled) return;
    const type = $("qrType").value;
    if (type === "wifi") {
      setNudge(["QR وای‌فای در تاریخچه ذخیره نمی‌شود، چون رمز داخل تصویر است.", "Wi-Fi QR codes are not saved to history because the image contains the password."], "warn");
      return;
    }
    let image;
    try { image = $("qrCanvas").toDataURL("image/png"); } catch (e) { return; }
    if (image === lastSaved) return;
    if (image.length > 900000) {
      setNudge(["این QR برای ذخیره در تاریخچه بزرگ است. اندازه‌ی خروجی را کمتر کنید.", "This QR is too large to save to history. Choose a smaller output size."], "warn");
      return;
    }
    try {
      const F = fb.F;
      await F.addDoc(F.collection(fb.db, "users", S.user.uid, "qrs"),
        { type, summary: summaryOf(type), image, createdAt: F.serverTimestamp() });
      lastSaved = image;
      setNudge(["در تاریخچه‌ی شما ذخیره شد.", "Saved to your history."], "ok");
      loadHistory();
    } catch (e) {
      setNudge(["ذخیره در تاریخچه ممکن نشد.", "Could not save to history."], "warn");
    }
  }

  /* ---------- رندر ---------- */
  function renderAuth() {
    authBox.replaceChildren();
    const panel = h("div", { class: "qr-panel" });
    authBox.append(panel);
    const title = (fa, en) => h("h2", { class: "qr-section-title" }, t(fa, en));

    if (!S.ready) { panel.append(h("p", { class: "qr-hint" }, t("در حال بررسی وضعیت ورود…", "Checking sign-in status…"))); return; }
    if (S.failed) {
      panel.append(title("عضویت", "Membership"),
        h("p", { class: "qr-hint" }, t("سرویس عضویت در دسترس نیست (ممکن است فیلترشکن لازم باشد). ساخت QR بدون عضویت کار می‌کند.", "The membership service is unreachable (a VPN may be needed). The QR maker still works without it.")));
      return;
    }
    if (S.user) {
      panel.append(title("عضو سایت", "Site member"),
        h("p", { class: "qr-hint" }, t("وارد شده‌اید با: ", "Signed in as: "), h("bdi", null, S.user.displayName || S.user.email || "")),
        h("div", { class: "qr-btn-row" }, h("button", { type: "button", class: "qr-btn ghost", onclick: doSignOut }, t("خروج", "Sign out"))));
      return;
    }
    panel.append(title("عضویت در سایت (اختیاری)", "Join the site (optional)"),
      h("p", { class: "qr-hint" }, t("ساخت QR بدون عضویت هم آزاد است. اعضا تاریخچه‌ی QRهای خود را می‌بینند و دوباره دانلود می‌کنند.", "Making QR codes is free without an account. Members see their QR history and can download again.")));
    if (!S.open) {
      panel.append(h("div", { class: "qr-btn-row" }, h("button", { type: "button", class: "qr-btn", onclick: () => { S.open = true; renderAuth(); } }, t("ورود / ثبت‌نام", "Sign in / Sign up"))));
      return;
    }
    const signup = S.mode === "signup";
    const form = h("form", { novalidate: true, onsubmit: (e) => { e.preventDefault(); doEmail(); } },
      h("div", { class: "qr-field" },
        h("label", { class: "qr-label", for: "authEmail" }, t("ایمیل", "Email")),
        h("input", { id: "authEmail", class: "auth-input", type: "email", dir: "ltr", autocomplete: "email", value: S.email, oninput: (e) => { S.email = e.target.value; } })),
      h("div", { class: "qr-field" },
        h("label", { class: "qr-label", for: "authPass" }, t("رمز عبور", "Password")),
        h("input", { id: "authPass", class: "auth-input", type: "password", dir: "ltr", autocomplete: signup ? "new-password" : "current-password", value: S.pass, oninput: (e) => { S.pass = e.target.value; } }),
        signup ? h("p", { class: "qr-hint" }, t("حداقل ۶ کاراکتر.", "At least 6 characters.")) : null),
      h("div", { class: "qr-btn-row" },
        h("button", { type: "submit", class: "qr-btn", disabled: S.busy }, signup ? t("ساخت حساب", "Create account") : t("ورود", "Sign in")),
        h("button", { type: "button", class: "qr-btn ghost", disabled: S.busy, onclick: doGoogle }, t("ورود با گوگل", "Continue with Google"))),
      S.msg ? h("p", { class: "qr-msg" + (S.msg.kind === "err" ? " err" : ""), role: "status" }, t(S.msg.p[0], S.msg.p[1])) : null,
      h("div", { class: "auth-links" },
        h("button", { type: "button", class: "auth-link", onclick: () => { S.mode = signup ? "login" : "signup"; setMsg(null); renderAuth(); } },
          signup ? t("حساب دارید؟ ورود", "Have an account? Sign in") : t("حساب ندارید؟ ثبت‌نام", "No account? Sign up")),
        signup ? null : h("button", { type: "button", class: "auth-link", onclick: doReset }, t("فراموشی رمز", "Forgot password"))));
    panel.append(form);
  }

  function dateText(ts) {
    try { return ts.toDate().toLocaleDateString(isFa() ? "fa-IR" : "en-GB"); } catch (e) { return ""; }
  }
  function item(it) {
    const safe = typeof it.image === "string" && it.image.indexOf("data:image/png;base64,") === 0;
    return h("div", { class: "hist-item" },
      safe ? h("img", { src: it.image, alt: "QR" }) : null,
      h("div", { class: "hist-meta" }, h("strong", null, typeLabel(it.type)), h("br"), h("bdi", null, it.summary || ""), h("br"), dateText(it.createdAt)),
      h("div", { class: "qr-btn-row" },
        safe ? h("a", { class: "qr-btn", href: it.image, download: "qr-code.png" }, t("دانلود", "Download")) : null,
        h("button", { type: "button", class: "qr-btn ghost", onclick: () => delItem(it.id) }, t("حذف", "Delete"))));
  }
  function renderHistory() {
    historyBox.replaceChildren();
    if (!S.user) return;
    const panel = h("div", { class: "qr-panel" }, h("h2", { class: "qr-section-title" }, t("تاریخچه‌ی من", "My history")));
    historyBox.append(panel);
    if (S.history === null) { panel.append(h("p", { class: "qr-hint" }, t("در حال بارگذاری…", "Loading…"))); return; }
    if (S.histErr) { panel.append(h("p", { class: "qr-msg err" }, t("تاریخچه بارگذاری نشد.", "Could not load history."))); return; }
    if (!S.history.length) {
      panel.append(h("p", { class: "qr-hint" }, t("هنوز QRای ذخیره نشده. هر بار PNG یا SVG دانلود کنید، خودکار اینجا ذخیره می‌شود.", "Nothing saved yet. Each time you download a PNG or SVG it is saved here automatically.")));
      return;
    }
    panel.append(h("div", { class: "hist-grid" }, S.history.map(item)));
  }
  function renderNudge() {
    nudge.replaceChildren();
    nudge.hidden = true;
    if (S.nudge) {
      nudge.hidden = false;
      const k = S.nudge.kind === "warn" ? " warn" : S.nudge.kind === "err" ? " err" : "";
      nudge.append(h("p", { class: "qr-msg" + k, role: "status" }, t(S.nudge.p[0], S.nudge.p[1])));
      return;
    }
    if (!S.ready || S.failed || S.user || dlPng.disabled) return;
    nudge.hidden = false;
    nudge.append(
      h("p", null, t("برای ذخیره‌ی تاریخچه‌ی QRها و دانلود دوباره، عضو سایت شوید.", "Join the site to keep your QR history and download it again.")),
      h("button", { type: "button", class: "qr-btn ghost", onclick: () => { S.open = true; renderAuth(); authBox.scrollIntoView({ behavior: "smooth", block: "start" }); } }, t("ورود / ثبت‌نام", "Sign in / Sign up")));
  }
  function render() { renderAuth(); renderHistory(); renderNudge(); }

  /* ---------- اتصال به رویدادها ---------- */
  dlPng.addEventListener("click", saveCurrent);
  const dlSvg = $("qrDlSvg");
  if (dlSvg) dlSvg.addEventListener("click", saveCurrent);
  layout.addEventListener("input", () => { if (S.nudge) { S.nudge = null; renderNudge(); } });
  layout.addEventListener("change", () => { if (S.nudge) { S.nudge = null; renderNudge(); } });
  new MutationObserver(renderNudge).observe(dlPng, { attributes: true, attributeFilter: ["disabled"] });
  document.addEventListener("infc:langchange", render);

  render();

  /* ---------- بارگذاری Firebase ---------- */
  try {
    const base = "https://www.gstatic.com/firebasejs/" + V + "/";
    const mods = await Promise.all([
      import(base + "firebase-app.js"),
      import(base + "firebase-auth.js"),
      import(base + "firebase-firestore.js")
    ]);
    const app = mods[0].initializeApp(firebaseConfig);
    fb = { auth: mods[1].getAuth(app), db: mods[2].getFirestore(app), A: mods[1], F: mods[2] };
    fb.A.onAuthStateChanged(fb.auth, (u) => {
      S.user = u; S.ready = true; S.history = null;
      render();
      if (u) loadHistory();
    });
  } catch (e) {
    S.failed = true; S.ready = true; render();
  }
}

main();
