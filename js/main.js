(function () {
  var A = window.App, W = A.W, el = A.el, icon = A.icon, isSet = A.isSet;
  var $ = function (id) { return document.getElementById(id); };
  var urlSide = new URLSearchParams(location.search).get("side");
  var fixedSide = urlSide === "groom" || urlSide === "bride" ? urlSide : null;
  var side = fixedSide || "all";

  function forSide(e) { return side === "all" || e.sides.indexOf(side) >= 0; }

  /* ---------- Hero ---------- */
  function renderHero() {
    $("greetHi").textContent = W.hero.greetingHindi;
    $("greetBn").textContent = W.hero.greetingBengali;
    $("groomName").textContent = W.couple.groom.name;
    $("brideName").textContent = W.couple.bride.name;
    $("invite").textContent = W.hero.invitation;
    $("heroDate").textContent = W.hero.dateLabel + " · " + W.hero.placeLabel;
    if (isSet(W.hero.hashtag)) { $("hashtag").textContent = W.hero.hashtag; $("hashtag").hidden = false; }
    $("footerText").textContent = W.site.footer;
    $("photoLimit").textContent = W.photos.limitPerGuest;

    var target = new Date(W.hero.countdownTo).getTime();
    var cells = {};
    document.querySelectorAll("#countdown b").forEach(function (b) { cells[b.dataset.u] = b; });
    function tick() {
      var left = Math.max(0, Math.floor((target - Date.now()) / 1000));
      cells.d.textContent = Math.floor(left / 86400);
      cells.h.textContent = String(Math.floor(left / 3600) % 24).padStart(2, "0");
      cells.m.textContent = String(Math.floor(left / 60) % 60).padStart(2, "0");
      cells.s.textContent = String(left % 60).padStart(2, "0");
      if (!left) clearInterval(timer);
    }
    var timer = setInterval(tick, 1000);
    tick();
  }

  function renderStory() {
    var paras = (W.story.paragraphs || []).filter(isSet);
    var link = document.querySelector('[data-nav="story"]');
    if (!paras.length) { link.hidden = true; return; }
    $("story").hidden = false;
    $("storyBody").append.apply($("storyBody"), paras.map(function (p) { return el("p", { text: p }); }));
    (W.story.photos || []).forEach(function (p) {
      $("storyPhotos").append(el("img", { src: p.src, alt: p.alt || "", loading: "lazy", decoding: "async", width: 400, height: 500 }));
    });
  }

  /* ---------- Calendar ---------- */
  function stamp(d) { return d.toISOString().replace(/[-:]|\.\d{3}/g, ""); }
  function dayStamp(dateStr, add) {
    var d = new Date(dateStr + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + (add || 0));
    return d.toISOString().slice(0, 10).replace(/-/g, "");
  }
  function calTimes(e) {
    if (!A.hasTime(e)) return { allDay: true, start: dayStamp(e.date), end: dayStamp(e.date, 1) };
    var s = A.eventStart(e);
    return { allDay: false, start: stamp(s), end: stamp(new Date(s.getTime() + (e.durationHours || 2) * 3600000)) };
  }
  function calTitle(e) { return e.title + " · " + W.couple.groom.name + " & " + W.couple.bride.name; }
  function googleCal(e) {
    var t = calTimes(e), v = A.venueOf(e);
    return "https://calendar.google.com/calendar/render?" + new URLSearchParams({
      action: "TEMPLATE", text: calTitle(e), dates: t.start + "/" + t.end, location: v.name,
      ctz: "Asia/Kolkata", details: A.hasTime(e) ? "" : "Exact time to be announced on the wedding website.",
    });
  }
  function icsText(s) { return String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n"); }
  function downloadIcs(e) {
    var t = calTimes(e);
    var lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Manish and Alivia//Wedding//EN", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
      "UID:" + e.id + "@manish-weds-alivia", "DTSTAMP:" + stamp(new Date()),
      t.allDay ? "DTSTART;VALUE=DATE:" + t.start : "DTSTART:" + t.start,
      t.allDay ? "DTEND;VALUE=DATE:" + t.end : "DTEND:" + t.end,
      "SUMMARY:" + icsText(calTitle(e)), "LOCATION:" + icsText(A.venueOf(e).name), "END:VEVENT", "END:VCALENDAR"];
    var url = URL.createObjectURL(new Blob([lines.join("\r\n") + "\r\n"], { type: "text/calendar;charset=utf-8" }));
    var a = el("a", { href: url, download: e.id + ".ics" });
    document.body.append(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
  }

  /* ---------- Events ---------- */
  function renderEvents() {
    var list = $("eventList");
    list.replaceChildren.apply(list, W.events.filter(forSide).map(function (e) {
      var d = new Date(e.date + "T12:00:00+05:30"), v = A.venueOf(e), time = A.timeLabel(e);
      var dress = e.dressCode === "" ? "" : isSet(e.dressCode) ? e.dressCode : "Dress code to be shared";
      return el("li", { class: "event" + (e.rsvp === false ? " minor" : "") },
        el("div", { class: "when" }, el("span", { text: A.fmt(d, { weekday: "short" }) }), el("b", { text: A.fmt(d, { day: "numeric" }) }), el("span", { text: A.fmt(d, { month: "short" }) })),
        el("div", { class: "event-body" },
          el("h3", { text: e.title }),
          e.music && el("div", { class: "music", role: "img", "aria-label": "Dhol-damau and shehnai" }, icon("m-dhol"), icon("m-shehnai")),
          el("ul", { class: "meta" },
            time && el("li", {}, icon("i-clock"), el("span", { text: time })),
            v.name && el("li", {}, icon("i-pin"), el("span", { text: v.name })),
            dress && el("li", {}, icon("i-shirt"), el("span", { text: dress }))),
          el("div", { class: "actions" },
            v.mapUrl && el("a", { class: "btn small", href: v.mapUrl, target: "_blank", rel: "noopener" }, icon("i-pin"), "Open in Google Maps"),
            el("a", { class: "btn small", href: googleCal(e), target: "_blank", rel: "noopener", "aria-label": "Add " + e.title + " to Google Calendar" }, icon("i-cal"), "Add to Calendar"),
            el("button", { class: "btn small", type: "button", "aria-label": "Download " + e.title + " calendar file", onclick: function () { downloadIcs(e); } }, ".ics"))));
    }));
  }

  function renderVenues() {
    var names = Object.keys(W.venues);
    $("venueList").classList.add("pair");
    names.forEach(function (k) {
      var v = W.venues[k];
      $("venueList").append(el("article", { class: "card venue" },
        el("h3", { text: v.name }),
        el("p", { text: isSet(v.address) ? v.address : v.city }),
        isSet(v.embedUrl)
          ? el("iframe", { class: "map", src: v.embedUrl, title: "Map of " + v.name, loading: "lazy", referrerpolicy: "no-referrer-when-downgrade", allowfullscreen: true })
          : el("div", { class: "map map-soon", text: "Map coming soon" }),
        isSet(v.mapUrl) && el("div", { class: "actions" }, el("a", { class: "btn small", href: v.mapUrl, target: "_blank", rel: "noopener" }, icon("i-pin"), "Open in Google Maps"))));
    });
  }

  function renderTravel() {
    var t = W.travel, box = $("groomTravel");
    box.replaceChildren();
    if (side !== "bride") {
      box.append(el("article", { class: "card" },
        el("h3", { text: t.groomPlanTitle }),
        el("ol", { class: "steps" }, t.groomPlan.map(function (s) { return el("li", {}, el("b", { text: s.when }), el("span", { text: s.what })); })),
        el("p", { class: isSet(t.groomPlanNote) ? "" : "soon", text: isSet(t.groomPlanNote) ? t.groomPlanNote : "Train or flight details will be shared soon." })));
    }
    var hotels = (t.hotels || []).filter(function (h) { return isSet(h.name) && (side === "all" || !h.sides || h.sides.indexOf(side) >= 0); });
    var list = $("hotelList");
    list.classList.toggle("pair", hotels.length > 1);
    list.replaceChildren.apply(list, hotels.length ? hotels.map(function (h) {
      return el("article", { class: "card" }, el("h3", { text: h.name }),
        isSet(h.city) && el("p", { text: h.city }), isSet(h.address) && el("p", { text: h.address }), isSet(h.note) && el("p", { text: h.note }),
        el("div", { class: "actions" },
          isSet(h.phone) && el("a", { class: "btn small", href: "tel:+" + h.phone.replace(/\D/g, "") }, "Call hotel"),
          isSet(h.mapUrl) && el("a", { class: "btn small", href: h.mapUrl, target: "_blank", rel: "noopener" }, icon("i-pin"), "Map")));
    }) : [el("p", { class: "card soon", text: "Hotel details will be shared soon. Tell us in your RSVP if you need accommodation." })]);
  }

  function renderContacts() {
    var groups = [["groom", "Groom's side"], ["bride", "Bride's side"]].filter(function (g) { return side === "all" || side === g[0]; });
    var list = $("contactList");
    list.classList.toggle("pair", groups.length > 1);
    list.replaceChildren.apply(list, groups.map(function (g) {
      var people = (W.contacts[g[0]] || []).filter(function (c) { return isSet(c.name) && isSet(c.phone); });
      return el("article", { class: "card" }, el("h3", { text: g[1] }),
        people.length ? people.map(function (c) {
          return el("div", { class: "contact" },
            el("p", {}, el("strong", { text: c.name }), isSet(c.role) ? " · " + c.role : ""),
            el("a", { class: "btn", href: "https://wa.me/" + c.phone.replace(/\D/g, ""), target: "_blank", rel: "noopener" }, icon("i-wa"), "Chat on WhatsApp"));
        }) : el("p", { class: "soon", text: "Contact details coming soon." }));
    }));
  }

  function renderFaq() {
    W.faq.forEach(function (f) { $("faqList").append(el("details", {}, el("summary", { text: f.q }), el("p", { text: f.a }))); });
  }

  /* ---------- RSVP ---------- */
  var form = $("rsvpForm");
  function val(name) { var f = form.elements[name]; return f ? f.value : ""; }
  function rsvpSide() { return fixedSide || val("side"); }
  function setErr(id, inputId, msg) {
    $(id).textContent = msg || "";
    if (inputId) { if (msg) $(inputId).setAttribute("aria-invalid", "true"); else $(inputId).removeAttribute("aria-invalid"); }
    return !msg;
  }
  function normPhone(v) {
    var d = v.replace(/\D/g, "");
    if (d.length === 12 && d.indexOf("91") === 0) d = d.slice(2);
    if (d.length === 11 && d[0] === "0") d = d.slice(1);
    return /^[6-9]\d{9}$/.test(d) ? d : "";
  }

  function renderRsvpEvents() {
    var s = rsvpSide();
    var keep = {};
    form.querySelectorAll('[name="events"]:checked').forEach(function (c) { keep[c.value] = true; });
    var evs = W.events.filter(function (e) { return e.rsvp !== false && (!s || e.sides.indexOf(s) >= 0); });
    var box = $("rsvpEvents");
    box.replaceChildren.apply(box, evs.map(function (e) {
      return el("label", {}, el("input", { type: "checkbox", name: "events", value: e.title, checked: !!keep[e.title] }),
        el("span", { text: e.title + " · " + A.fmt(new Date(e.date + "T12:00:00+05:30"), { day: "numeric", month: "short" }) }));
    }));
    $("groupField").hidden = s !== "groom";
  }

  function validate() {
    var ok = setErr("fName-err", "fName", val("name").trim() ? "" : "Please enter your full name.");
    ok = setErr("fPhone-err", "fPhone", normPhone(val("phone")) ? "" : "Please enter a valid 10-digit Indian mobile number.") && ok;
    ok = setErr("side-err", null, rsvpSide() ? "" : "Please choose a side.") && ok;
    ok = setErr("attending-err", null, val("attending") ? "" : "Please tell us if you can attend.") && ok;
    if (val("attending") === "yes") {
      var g = Number(val("guests"));
      ok = setErr("fGuests-err", "fGuests", Number.isInteger(g) && g >= 1 && g <= W.rsvp.maxGuests ? "" : "Please enter between 1 and " + W.rsvp.maxGuests + " guests.") && ok;
      ok = setErr("events-err", null, form.querySelector('[name="events"]:checked') ? "" : "Please choose at least one event.") && ok;
      var a = val("arrival"), d = val("departure");
      ok = setErr("fDeparture-err", "fDeparture", a && d && d < a ? "Departure cannot be before arrival." : "") && ok;
    }
    return ok;
  }

  function setupRsvp() {
    var closes = W.rsvp.closesAt;
    if (isSet(closes) && Date.now() > new Date(closes).getTime()) {
      form.hidden = true; $("rsvpLead").hidden = true; $("rsvpClosed").hidden = false; return;
    }
    if (isSet(closes)) $("rsvpLead").textContent = "Please reply by " + A.fmt(new Date(closes), { day: "numeric", month: "long", year: "numeric" }) + ".";
    $("fGuests").max = W.rsvp.maxGuests;
    W.rsvp.foodOptions.forEach(function (f) {
      $("foodChoices").append(el("label", {}, el("input", { type: "radio", name: "food", value: f }), el("span", { text: f })));
    });
    if (fixedSide) { $("sideField").hidden = true; }
    renderRsvpEvents();

    form.addEventListener("change", function (ev) {
      if (ev.target.name === "side") renderRsvpEvents();
      if (ev.target.name === "attending") $("yesFields").hidden = ev.target.value !== "yes";
    });
    $("rsvpEdit").addEventListener("click", function () { $("rsvpDone").hidden = true; form.hidden = false; $("fName").focus(); });

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var status = $("rsvpStatus");
      status.textContent = ""; status.className = "status";
      if (!validate()) {
        var bad = form.querySelector('[aria-invalid="true"]');
        status.textContent = "Please check the highlighted details."; status.classList.add("bad");
        if (bad) bad.focus();
        return;
      }
      var yes = val("attending") === "yes";
      var payload = {
        name: val("name").trim(), phone: normPhone(val("phone")), side: rsvpSide(), attending: val("attending"),
        guests: yes ? Number(val("guests")) : 0,
        events: yes ? Array.from(form.querySelectorAll('[name="events"]:checked'), function (c) { return c.value; }) : [],
        arrival: yes ? val("arrival") : "", departure: yes ? val("departure") : "",
        withGroup: yes && rsvpSide() === "groom" ? val("withGroup") : "",
        accommodation: yes ? val("accommodation") : "", food: yes ? val("food") : "", message: val("message").trim(),
      };
      var btn = $("rsvpSubmit");
      btn.disabled = true; btn.textContent = "Sending…";
      sendRsvp(payload, 0).then(function (res) {
        $("doneTitle").textContent = yes ? "Thank you, " + payload.name + "!" : "Thank you for letting us know, " + payload.name + ".";
        $("doneText").textContent = (res.updated ? "Your RSVP has been updated. " : "Your RSVP has been received. ") + (yes ? "We can't wait to celebrate with you." : "You will be in our thoughts on the day.");
        form.hidden = true; $("rsvpDone").hidden = false; $("rsvpDone").focus();
      }).catch(function (err) {
        status.textContent = err.code === "network" ? "We couldn't reach the server. Your answers are still here, so please try again." : err.message;
        status.classList.add("bad");
      }).finally(function () { btn.disabled = false; btn.textContent = "Send RSVP"; });
    });
  }

  function sendRsvp(payload, attempt) {
    return A.api("rsvp", payload, 30000).catch(function (err) {
      if (!err.retryable || attempt >= 2) throw err;
      return new Promise(function (r) { setTimeout(r, 1500 * (attempt + 1)); }).then(function () { return sendRsvp(payload, attempt + 1); });
    });
  }

  /* ---------- Side and navigation ---------- */
  function applySide(next) {
    side = next;
    document.querySelectorAll("#sideToggle button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.side === side)); });
    renderEvents(); renderTravel(); renderContacts();
  }

  function setupNav() {
    var links = Array.from(document.querySelectorAll(".nav a"));
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) {
          var on = a.getAttribute("href") === "#" + en.target.id;
          a.classList.toggle("on", on);
          if (on) { a.setAttribute("aria-current", "true"); a.parentNode.scrollTo({ left: a.offsetLeft - 60 }); } else a.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    links.forEach(function (a) { var t = document.querySelector(a.getAttribute("href")); if (t) io.observe(t); });
  }

  renderHero(); renderStory(); renderVenues(); renderFaq();
  if (!fixedSide) {
    $("sideToggle").hidden = false;
    $("sideToggle").addEventListener("click", function (ev) { var b = ev.target.closest("button"); if (b) applySide(b.dataset.side); });
  }
  applySide(side);
  setupRsvp();
  setupNav();
})();
