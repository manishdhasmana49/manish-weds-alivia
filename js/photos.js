(function () {
  var A = window.App, W = A.W, el = A.el, icon = A.icon;
  var $ = function (id) { return document.getElementById(id); };
  var LIMIT = W.photos.limitPerGuest, MAX_EDGE = W.photos.maxLongEdge, QUALITY = W.photos.jpegQuality;
  var MAX_ATTEMPTS = 5, BACKOFF = [1500, 4000, 8000, 15000];
  var K = { name: "maw.guestName", device: "maw.deviceId", used: "maw.photosUsed" };

  var deviceId = A.store.get(K.device);
  if (!deviceId) { deviceId = A.uid(); A.store.set(K.device, deviceId); }
  var used = Math.min(LIMIT, parseInt(A.store.get(K.used), 10) || 0);
  var items = [], uploading = false, processing = 0;

  /* ---------- Setup ---------- */
  $("coupleLine").textContent = W.couple.groom.name + " & " + W.couple.bride.name;
  $("guestName").value = A.store.get(K.name) || "";
  $("guestName").addEventListener("input", function () { A.store.set(K.name, this.value.trim()); $("guestName-err").textContent = ""; });

  var events = W.events.filter(function (e) { return e.rsvp !== false; });
  events.forEach(function (e) {
    $("eventSelect").append(el("option", { value: e.title, text: e.title + " · " + A.fmt(new Date(e.date + "T12:00:00+05:30"), { day: "numeric", month: "short" }) }));
  });
  $("eventSelect").value = currentEvent().title;

  /* The most recent event that has started, or the first one before the wedding. */
  function currentEvent() {
    var now = Date.now(), pick = events[0];
    events.forEach(function (e) { if (A.eventStart(e).getTime() <= now) pick = e; });
    return pick;
  }

  /* ---------- Quota ---------- */
  function pending() { return items.filter(function (i) { return i.state !== "done"; }).length; }
  function renderQuota() {
    $("quotaText").textContent = used + " of " + LIMIT + " used";
    $("quotaBar").style.width = (used / LIMIT) * 100 + "%";
    var full = used + pending() + processing >= LIMIT;
    ["takeInput", "galleryInput"].forEach(function (id) { $(id).disabled = full || uploading; });
    ["takeLabel", "galleryLabel"].forEach(function (id) { $(id).classList.toggle("disabled", full || uploading); });
    var sendable = items.filter(function (i) { return i.state === "ready" || i.state === "failed"; }).length;
    $("uploadBtn").hidden = !sendable && !uploading;
    $("uploadBtn").disabled = uploading || !sendable;
    $("uploadBtn").textContent = uploading ? "Uploading…" : items.some(function (i) { return i.state === "failed"; }) ? "Retry upload" : "Upload " + sendable + (sendable === 1 ? " photo" : " photos");
  }
  function setUsed(n) { used = Math.min(LIMIT, Math.max(0, n)); A.store.set(K.used, String(used)); renderQuota(); }
  function say(msg, kind) { $("photoStatus").textContent = msg || ""; $("photoStatus").className = "status" + (kind ? " " + kind : ""); }

  if (A.backendReady()) {
    A.api("quota", { deviceId: deviceId }, 15000).then(function (r) { setUsed(r.used); }).catch(function () { /* local count still applies */ });
  } else {
    say("Photo uploads are not connected yet. Please check back soon.", "bad");
  }

  /* ---------- EXIF orientation ---------- */
  var autoOrient = new Promise(function (resolve) {
    // A 2x1 JPEG tagged orientation 6: browsers that honour EXIF report it as 1x2.
    var img = new Image();
    img.onload = function () { resolve(img.naturalWidth === 1); };
    img.onerror = function () { resolve(true); };
    img.src = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4QAiRXhpZgAATU0AKgAAAAgAAQESAAMAAAABAAYAAAAAAAD/2wBDACgcHiMeGSgjISMtKygwPGRBPDc3PHtYXUlkkYCZlo+AjIqgtObDoKrarYqMyP/L2u71////m8H////6/+b9//j/2wBDASstLTw1PHZBQXb4pYyl+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj/wAARCAABAAIDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDZooooA//Z";
  });

  function readOrientation(file) {
    return file.slice(0, 128 * 1024).arrayBuffer().then(function (buf) {
      var v = new DataView(buf);
      if (v.byteLength < 4 || v.getUint16(0) !== 0xFFD8) return 1;
      var p = 2;
      while (p + 4 <= v.byteLength) {
        var marker = v.getUint16(p), size = v.getUint16(p + 2);
        if (marker === 0xFFE1 && p + 10 <= v.byteLength && v.getUint32(p + 4) === 0x45786966) {
          var t = p + 10;
          if (t + 8 > v.byteLength) return 1;
          var le = v.getUint16(t) === 0x4949;
          var ifd = t + v.getUint32(t + 4, le);
          if (ifd + 2 > v.byteLength) return 1;
          var n = v.getUint16(ifd, le);
          for (var i = 0; i < n; i++) {
            var entry = ifd + 2 + i * 12;
            if (entry + 10 > v.byteLength) return 1;
            if (v.getUint16(entry, le) === 0x0112) return v.getUint16(entry + 8, le);
          }
          return 1;
        }
        if ((marker & 0xFF00) !== 0xFF00) return 1;
        p += 2 + size;
      }
      return 1;
    }).catch(function () { return 1; });
  }

  /* ---------- Compression ---------- */
  function loadImage(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () { resolve({ img: img, url: url }); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("decode")); };
      img.src = url;
    });
  }
  function toBlob(canvas, q) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (b) { b ? resolve(b) : reject(new Error("encode")); }, "image/jpeg", q);
    });
  }

  function compress(file) {
    if (file.type && file.type.indexOf("image/") !== 0) return Promise.reject(new Error("type"));
    return Promise.all([autoOrient, readOrientation(file), loadImage(file)]).then(function (r) {
      var orientation = r[0] ? 1 : r[1], img = r[2].img;
      var w = img.naturalWidth, h = img.naturalHeight;
      var scale = Math.min(1, MAX_EDGE / Math.max(w, h));
      var dw = Math.round(w * scale), dh = Math.round(h * scale);
      var swap = orientation >= 5 && orientation <= 8;
      var canvas = document.createElement("canvas");
      canvas.width = swap ? dh : dw; canvas.height = swap ? dw : dh;
      var c = canvas.getContext("2d");
      var tf = { 2: [-1, 0, 0, 1, dw, 0], 3: [-1, 0, 0, -1, dw, dh], 4: [1, 0, 0, -1, 0, dh], 5: [0, 1, 1, 0, 0, 0], 6: [0, 1, -1, 0, dh, 0], 7: [0, -1, -1, 0, dh, dw], 8: [0, -1, 1, 0, 0, dw] }[orientation];
      if (tf) c.transform.apply(c, tf);
      c.fillStyle = "#fff"; c.fillRect(0, 0, dw, dh);
      c.drawImage(img, 0, 0, dw, dh);
      URL.revokeObjectURL(r[2].url);
      return toBlob(canvas, QUALITY).then(function (b) {
        return b.size > 8 * 1024 * 1024 ? toBlob(canvas, 0.65) : b;
      }).finally(function () { canvas.width = canvas.height = 0; });
    });
  }

  /* ---------- Selection ---------- */
  function addFiles(list) {
    var files = Array.from(list);
    if (!files.length) return;
    var room = LIMIT - used - pending() - processing;
    if (room <= 0) { say("You have reached your limit of " + LIMIT + " photos. Thank you!", "good"); return; }
    var chosen = files.slice(0, room);
    say(files.length > room ? "You can add " + room + " more, so we kept the first " + room + "." : "");
    processing += chosen.length; renderQuota();
    chosen.reduce(function (chain, file) {
      return chain.then(function () {
        return compress(file).then(addItem).catch(function () {
          say("One file could not be read as a photo. Please choose a JPEG or PNG image.", "bad");
        }).finally(function () { processing--; renderQuota(); });
      });
    }, Promise.resolve());
  }

  function addItem(blob) {
    var item = { id: A.uid(), blob: blob, url: URL.createObjectURL(blob), state: "ready" };
    item.info = el("span", { text: "Ready · " + (blob.size / 1048576).toFixed(1) + " MB" });
    item.fill = el("i");
    item.bar = el("div", { class: "bar", hidden: true }, item.fill);
    item.remove = el("button", { class: "remove", type: "button", "aria-label": "Remove photo", onclick: function () { removeItem(item); } }, icon("i-x"));
    item.node = el("li", { class: "thumb" }, el("img", { src: item.url, alt: "Selected photo" }), el("div", { class: "thumb-info" }, item.info, item.bar), item.remove);
    items.push(item);
    $("thumbs").append(item.node);
    renderQuota();
  }

  function removeItem(item) {
    if (uploading) return;
    URL.revokeObjectURL(item.url);
    item.node.remove();
    items = items.filter(function (i) { return i !== item; });
    renderQuota();
  }

  ["takeInput", "galleryInput"].forEach(function (id) {
    $(id).addEventListener("change", function () { addFiles(this.files); this.value = ""; });
  });

  /* ---------- Upload ---------- */
  function setState(item, state, text, pct) {
    item.state = state;
    item.info.textContent = text;
    item.node.className = "thumb" + (state === "done" ? " ok" : state === "failed" || state === "blocked" ? " fail" : "");
    item.bar.hidden = state !== "sending";
    if (pct != null) item.fill.style.width = pct + "%";
    item.remove.disabled = state === "sending" || state === "done";
  }

  function toBase64(blob) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(String(r.result).split(",")[1]); };
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* The browser can't report real upload progress here: an upload listener
     triggers a CORS preflight, which Apps Script rejects. The bar eases toward
     90% while sending and only reaches 100% once the server confirms. */
  function sendItem(item, base64, name, eventName, attempt) {
    var pct = 8;
    setState(item, "sending", attempt > 1 ? "Weak signal, retry " + (attempt - 1) + " of " + (MAX_ATTEMPTS - 1) + "…" : "Uploading…", pct);
    var timer = setInterval(function () { pct += (90 - pct) * 0.12; item.fill.style.width = pct + "%"; }, 400);
    return A.api("upload", { deviceId: deviceId, uploadId: item.id, name: name, event: eventName, mimeType: "image/jpeg", data: base64 }, 120000)
      .finally(function () { clearInterval(timer); })
      .catch(function (err) {
        if (!err.retryable || attempt >= MAX_ATTEMPTS) throw err;
        setState(item, "sending", "Connection lost, trying again…", pct);
        return wait(BACKOFF[attempt - 1]).then(function () { return sendItem(item, base64, name, eventName, attempt + 1); });
      });
  }

  async function uploadAll() {
    var name = $("guestName").value.trim();
    if (!name) { $("guestName-err").textContent = "Please enter your name first."; $("guestName").focus(); return; }
    if (!A.backendReady()) { say("Photo uploads are not connected yet. Please check back soon.", "bad"); return; }
    A.store.set(K.name, name);
    var eventName = $("eventSelect").value;
    var queue = items.filter(function (i) { return i.state === "ready" || i.state === "failed"; });
    var saved = 0, failed = 0, limited = false;
    uploading = true; say(""); renderQuota();
    for (var n = 0; n < queue.length; n++) {
      var item = queue[n];
      if (limited) { setState(item, "blocked", "Over the " + LIMIT + "-photo limit"); continue; }
      try {
        var b64 = await toBase64(item.blob);
        var res = await sendItem(item, b64, name, eventName, 1);
        setState(item, "done", "Uploaded", 100);
        item.node.querySelector(".remove").replaceChildren(icon("i-check"));
        item.remove.style.visibility = "visible";
        setUsed(res.used);
        saved++;
      } catch (err) {
        if (err.code === "limit") {
          limited = true;
          if (err.data && err.data.used != null) setUsed(err.data.used);
          setState(item, "blocked", "Over the " + LIMIT + "-photo limit");
        } else {
          failed++;
          setState(item, "failed", err.code === "network" ? "Not sent. Check your connection." : err.message);
        }
      }
    }
    uploading = false;
    items.filter(function (i) { return i.state === "blocked"; }).forEach(function (i) { i.remove.disabled = false; });
    if (limited) say("You have reached your limit of " + LIMIT + " photos. Thank you!", "good");
    else if (failed) say((saved ? saved + " uploaded, " : "") + failed + " not sent. Tap Retry upload when your signal improves.", "bad");
    else say("Thank you! " + saved + (saved === 1 ? " photo" : " photos") + " shared with Manish & Alivia.", "good");
    renderQuota();
  }

  $("uploadBtn").addEventListener("click", uploadAll);
  window.addEventListener("beforeunload", function (e) { if (uploading) { e.preventDefault(); e.returnValue = ""; } });
  renderQuota();
})();
