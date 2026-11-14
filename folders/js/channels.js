/* INFC.1405 - بخش کانال‌ها (بله و ایتا)
   پر می‌شود در: #channelsMount (صفحه اول)

   ▼ فقط همین بخش را ویرایش کنید ▼
   - آدرس کانال‌ها را در url بگذارید (مثلاً https://ble.ir/xxxx). خالی = «به‌زودی»
   - مرحلهٔ بعد (ربات اطلاع‌رسانی): enabled را true کنید و username ربات‌ها را بگذارید */
const CHANNELS = [
  {
    id: "bale",
    name: ["بله", "Bale"],
    desc: ["اخبار و اطلاعیه‌های گروه در کانال بله.", "News and announcements on our Bale channel."],
    url: ""
  },
  {
    id: "eitaa",
    name: ["ایتا", "Eitaa"],
    desc: ["اخبار و اطلاعیه‌های گروه در کانال ایتا.", "News and announcements on our Eitaa channel."],
    url: ""
  }
];

/* مرحلهٔ بعد: ربات اطلاع‌رسانی
   بعداً: کاربر عضو شده، شناسهٔ بله/ایتای خودش را وصل می‌کند و اعلان می‌گیرد. */
const BOT = {
  enabled: false,
  bale: { username: "" },
  eitaa: { username: "" }
};

const isFa = () => !(window.INFC && window.INFC.getLang && window.INFC.getLang() === "en");
const t = (pair) => (isFa() ? pair[0] : pair[1]);

function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const k in attrs || {}) {
    const v = attrs[k];
    if (v === false || v == null) continue;
    if (k === "class") e.className = v;
    else e.setAttribute(k, v === true ? "" : v);
  }
  kids.flat().forEach((c) => { if (c != null && c !== false) e.append(c); });
  return e;
}

const CSS = `
.ch-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;margin-top:14px}
.ch-card{border:1px solid rgba(128,128,128,.4);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:10px}
.ch-card h3{margin:0}
.ch-card p{margin:0;opacity:.9}
.ch-card .ch-soon{opacity:.7;font-size:.9em}
.ch-btn{text-decoration:none;display:inline-block;align-self:flex-start}
`;

function botLink(id) {
  const u = BOT[id] && BOT[id].username;
  if (!u) return "";
  return id === "bale" ? "https://ble.ir/" + u : "https://eitaa.com/" + u;
}

function render(mount) {
  mount.replaceChildren();
  const cards = CHANNELS.map((c) =>
    h("div", { class: "ch-card", "data-channel": c.id },
      h("h3", null, t(c.name)),
      h("p", null, t(c.desc)),
      c.url
        ? h("a", { class: "qr-btn ch-btn", href: c.url, target: "_blank", rel: "noopener noreferrer" }, t(["عضویت در کانال", "Join channel"]))
        : h("span", { class: "ch-soon" }, t(["به‌زودی", "Coming soon"]))));

  const botCard = h("div", { class: "ch-card", "data-channel": "bot" },
    h("h3", null, t(["ربات اطلاع‌رسانی", "Notification bot"])),
    h("p", null, t(["اعلان پروژه‌ها و اخبار جدید را مستقیم در پیام‌رسان خود بگیرید.", "Get project updates and news straight in your messenger."])),
    BOT.enabled && (botLink("bale") || botLink("eitaa"))
      ? h("div", { class: "qr-btn-row" },
          botLink("bale") ? h("a", { class: "qr-btn ch-btn", href: botLink("bale"), target: "_blank", rel: "noopener noreferrer" }, t(["ربات بله", "Bale bot"])) : null,
          botLink("eitaa") ? h("a", { class: "qr-btn ch-btn", href: botLink("eitaa"), target: "_blank", rel: "noopener noreferrer" }, t(["ربات ایتا", "Eitaa bot"])) : null)
      : h("span", { class: "ch-soon" }, t(["به‌زودی", "Coming soon"])));

  mount.append(
    h("h2", { class: "section-title" }, t(["کانال‌های ما", "Our channels"])),
    h("div", { class: "ch-grid" }, cards, botCard));
}

function main() {
  const mount = document.getElementById("channelsMount");
  if (!mount) return;
  document.head.append(h("style", null, CSS));
  render(mount);
  document.addEventListener("infc:langchange", () => render(mount));
}

main();
