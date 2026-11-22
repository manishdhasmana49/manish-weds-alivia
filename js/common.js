/* Shared helpers for both pages. */
(function () {
  var W = window.WEDDING;
  var TZ = "Asia/Kolkata";

  function isSet(v) {
    return typeof v === "string" ? v.trim() !== "" && !/^TODO/i.test(v.trim()) : v != null;
  }

  /* Builds DOM nodes. Text is never parsed as HTML. */
  function el(tag, attrs) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (attrs[k] === false || attrs[k] == null) return;
      if (k === "class") node.className = attrs[k];
      else if (k === "text") node.textContent = attrs[k];
      else if (k.slice(0, 2) === "on") node.addEventListener(k.slice(2), attrs[k]);
      else node.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
    });
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c == null || c === false) continue;
      (Array.isArray(c) ? c : [c]).forEach(function (x) { if (x) node.append(x); });
    }
    return node;
  }

  function icon(name, cls) {
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("aria-hidden", "true");
    if (cls) svg.setAttribute("class", cls);
    var use = document.createElementNS(ns, "use");
    use.setAttribute("href", "images/motifs.svg#" + name);
    svg.appendChild(use);
    return svg;
  }

  function hasTime(e) { return isSet(e.time); }

  function eventStart(e) {
    return new Date(e.date + "T" + (hasTime(e) ? e.time : "00:00") + ":00+05:30");
  }

  function fmt(date, opts) {
    return new Intl.DateTimeFormat("en-IN", Object.assign({ timeZone: TZ }, opts)).format(date);
  }

  function timeLabel(e) {
    if (e.time === "") return "";
    if (!hasTime(e)) return "Time to be announced";
    return fmt(eventStart(e), { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase() + " IST";
  }

  function venueOf(e) {
    var v = W.venues[e.venue];
    if (v) return { name: v.name + (isSet(v.city) && v.name.indexOf(v.city) < 0 ? ", " + v.city : ""), mapUrl: isSet(v.mapUrl) ? v.mapUrl : "" };
    if (isSet(e.venue)) return { name: e.venue, mapUrl: "" };
    if (e.venue === "") return { name: "", mapUrl: "" };
    return { name: e.venueHint ? e.venueHint + " · venue to be announced" : "Venue to be announced", mapUrl: "" };
  }

  function backendReady() { return isSet(W.backend.url) && isSet(W.backend.token); }

  function ApiError(message, code, retryable, data) {
    this.message = message; this.code = code; this.retryable = retryable; this.data = data;
  }

  /* text/plain keeps this a CORS "simple request", which Apps Script needs. */
  function api(action, payload, timeoutMs) {
    if (!backendReady()) return Promise.reject(new ApiError("This feature is not connected yet. Please try again later.", "not_configured", false));
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, timeoutMs || 30000);
    return fetch(W.backend.url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(Object.assign({ token: W.backend.token, action: action }, payload)),
      redirect: "follow",
      signal: ctrl.signal,
    }).then(function (r) {
      if (!r.ok) throw new ApiError("The server is busy.", "http", true);
      return r.json();
    }).then(function (data) {
      if (!data.ok) throw new ApiError(data.error || "Something went wrong.", data.code, !!data.retryable, data);
      return data;
    }).catch(function (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError("The connection dropped.", "network", true);
    }).finally(function () { clearTimeout(timer); });
  }

  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } },
  };

  function uid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    var b = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(b, function (x) { return x.toString(16).padStart(2, "0"); }).join("");
  }

  window.App = { W: W, isSet: isSet, el: el, icon: icon, hasTime: hasTime, eventStart: eventStart, fmt: fmt, timeLabel: timeLabel, venueOf: venueOf, api: api, backendReady: backendReady, store: store, uid: uid };
})();
