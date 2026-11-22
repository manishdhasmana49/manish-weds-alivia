(function () {
  var A = window.App, el = A.el;
  var $ = function (id) { return document.getElementById(id); };
  var password = ""; // Kept in memory only, so closing or reloading the page locks it.

  function when(iso) {
    var d = new Date(iso);
    return isNaN(d) ? "" : A.fmt(d, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });
  }
  function day(s) { return s ? A.fmt(new Date(s + "T12:00:00+05:30"), { day: "numeric", month: "short" }) : ""; }
  function word(v) { return v === "yes" ? "Yes" : v === "no" ? "No" : ""; }
  function row(label, value) {
    return value === "" || value == null ? null : el("div", {}, el("dt", { text: label }), el("dd", { text: String(value) }));
  }

  function render(rows) {
    var sorted = rows.slice().sort(function (a, b) { return String(b.updated).localeCompare(String(a.updated)); });
    var yes = rows.filter(function (r) { return r.attending === "yes"; });
    var people = yes.reduce(function (n, r) { return n + (Number(r.guests) || 0); }, 0);
    $("adminStats").replaceChildren.apply($("adminStats"), [["Responses", rows.length], ["Attending", yes.length], ["Total guests", people], ["Can't come", rows.length - yes.length]].map(function (s) {
      return el("div", {}, el("b", { text: String(s[1]) }), el("span", { text: s[0] }));
    }));
    var list = $("adminList");
    if (!sorted.length) { list.replaceChildren(el("li", { class: "card soon", text: "No RSVPs yet." })); return; }
    list.replaceChildren.apply(list, sorted.map(function (r) {
      return el("li", { class: "card admin-card" },
        el("div", { class: "admin-top" }, el("h2", { text: r.name }), el("span", { class: "pill " + (r.attending === "yes" ? "yes" : "no"), text: r.attending === "yes" ? "Attending" : "Not coming" })),
        el("a", { class: "admin-phone", href: "tel:+91" + r.phone, text: "+91 " + r.phone }),
        el("dl", {},
          row("Side", r.side === "groom" ? "Groom's side" : "Bride's side"),
          r.attending === "yes" ? row("Guests", r.guests) : null,
          row("Events", (r.events || []).join(", ")),
          row("Arrival", day(r.arrival)), row("Departure", day(r.departure)),
          row("With Dehradun group", word(r.withGroup)), row("Accommodation", word(r.accommodation)),
          row("Food", r.food), row("Message", r.message), row("Last updated", when(r.updated))));
    }));
  }

  function load(btn, status) {
    status.textContent = "";
    btn.disabled = true;
    return A.api("admin_rsvps", { password: password }, 30000).then(function (res) {
      render(res.rows);
      $("loginForm").hidden = true; $("adminData").hidden = false;
    }).catch(function (err) {
      if (err.code === "bad_password" || err.code === "locked") lock();
      ($("loginForm").hidden ? status : $("loginStatus")).textContent = err.code === "network" ? "Couldn't connect. Please try again." : err.message;
    }).finally(function () { btn.disabled = false; });
  }

  function lock() {
    password = "";
    $("adminList").replaceChildren(); $("adminStats").replaceChildren();
    $("adminData").hidden = true; $("loginForm").hidden = false;
    $("adminPassword").value = ""; $("adminPassword").focus();
  }

  $("loginForm").addEventListener("submit", function (ev) {
    ev.preventDefault();
    password = $("adminPassword").value;
    $("adminPassword").value = "";
    if (password) load($("loginBtn"), $("loginStatus"));
  });
  $("refreshBtn").addEventListener("click", function () { load($("refreshBtn"), $("dataStatus")); });
  $("lockBtn").addEventListener("click", function () { $("loginStatus").textContent = ""; lock(); });
})();
