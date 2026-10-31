// PharmaLeaf shared script: header, footer, login state, catalogue and API helpers.
(function () {
  const C = window.PL_CONFIG;
  const sb = window.supabase.createClient(C.supabaseUrl, C.supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce" },
  });
  const LEAF = '<svg width="34" height="34" viewBox="0 0 64 64" aria-hidden="true"><path d="M10 54 C10 24 30 8 56 8 C56 36 40 54 10 54 Z" fill="#9AE6B4" stroke="#1d1d1f" stroke-width="3" stroke-linejoin="round"/><path d="M12 52 C24 40 34 30 48 16" fill="none" stroke="#1d1d1f" stroke-width="3" stroke-linecap="round"/></svg>';

  function esc(s) { return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function rupees(n) { return "₹" + Number(n).toLocaleString("en-IN"); }
  function qs(k) { return new URLSearchParams(location.search).get(k); }

  function header() {
    const h = document.createElement("header");
    h.className = "site";
    h.innerHTML = `<div class="wrap">
      <a class="brand" href="index.html">${LEAF}<span>PharmaLeaf</span></a>
      <nav class="main" aria-label="Main">
        <a href="index.html#notes">Notes</a>
        <a href="index.html#how">How it works</a>
        <a href="library.html">My Library</a>
        <a id="pl-auth" class="btn btn-green btn-sm" href="login.html">Log in</a>
      </nav></div>`;
    document.body.prepend(h);
  }
  function footer() {
    const f = document.createElement("footer");
    f.className = "site";
    f.innerHTML = `<div class="wrap">
      <div style="max-width:520px"><p class="k" style="margin:0 0 4px;font-weight:700;font-size:22px;color:#276749">PharmaLeaf</p>
      <p style="margin:0">B.Pharm notes prepared as per the PCI 2026 (NEP 2020) syllabus, followed by RUHS. PharmaLeaf is not an official PCI or RUHS publication.</p>
      <p style="margin:6px 0 0">Contact: <a href="mailto:${esc(C.email)}">${esc(C.email)}</a></p></div>
      <nav aria-label="Policies"><a href="about.html">About us</a><a href="pricing.html">Pricing</a><a href="terms.html">Terms and conditions</a><a href="privacy.html">Privacy policy</a><a href="refund.html">Refund and cancellation</a><a href="shipping.html">Delivery policy</a><a href="contact.html">Contact us</a></nav>
      </div>`;
    document.body.append(f);
  }

  async function session() { const { data } = await sb.auth.getSession(); return data.session; }

  async function refreshAuthButton() {
    const s = await session();
    const a = document.getElementById("pl-auth");
    if (!a) return;
    if (s) {
      a.textContent = "Log out";
      a.href = "#";
      a.className = "btn btn-line btn-sm";
      a.onclick = async (e) => { e.preventDefault(); await sb.auth.signOut(); location.href = "index.html"; };
    }
  }

  async function catalogue() {
    const { data: products, error } = await sb.from("products")
      .select("id,title,semester,pages,price_inr,status,kind").eq("kind", "semester").order("semester");
    const { data: files } = await sb.from("product_files").select("product_id,code,title,pages,sort").order("sort");
    if (error || !products) return null;
    return products.map((p) => ({ ...p, files: (files || []).filter((f) => f.product_id === p.id) }));
  }

  async function callFn(name, body) {
    const s = await session();
    const res = await fetch(`${C.supabaseUrl}/functions/v1/${name}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: C.supabaseKey, Authorization: `Bearer ${s ? s.access_token : C.supabaseKey}` },
      body: JSON.stringify(body || {}),
    });
    return res;
  }

  function msg(el, text, kind) { el.textContent = text; el.className = "msg show " + (kind || "info"); }

  window.PL = { sb, C, esc, rupees, qs, session, catalogue, callFn, msg, LEAF };
  document.addEventListener("DOMContentLoaded", () => {
    header(); footer(); refreshAuthButton();
    document.querySelectorAll("[data-cfg]").forEach((el) => { el.textContent = C[el.dataset.cfg] ?? ""; });
  });
})();
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("a.cfg-mail").forEach((a) => { a.href = "mailto:" + window.PL_CONFIG.email; });
});
