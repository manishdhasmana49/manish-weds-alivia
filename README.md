# Manish & Alivia wedding website

A static, mobile-first wedding site for GitHub Pages. RSVPs go to a private GitHub repo and guest photos go to Google Drive through Google Apps Script.

- Live site: <https://manishdhasmana49.github.io/manish-weds-alivia/>
- Groom's side: <https://manishdhasmana49.github.io/manish-weds-alivia/?side=groom>
- Bride's side: <https://manishdhasmana49.github.io/manish-weds-alivia/?side=bride>
- Photos: <https://manishdhasmana49.github.io/manish-weds-alivia/photos.html>

## Edit the details

Everything guests read is in `config.js`. Search it for `TODO`.

- Values that start with `TODO` are hidden or shown as "to be announced".
- Dates use `YYYY-MM-DD`, and times use 24-hour IST such as `"19:00"`.
- WhatsApp numbers use country code and digits only, such as `"919876543210"`.
- Google Maps `mapUrl` comes from **Share > Copy link**.
- Google Maps `embedUrl` comes from **Share > Embed a map**. Copy only the `src="..."` address.

After editing:

```bash
git add config.js
git commit -m "Update wedding details"
git push
```

The live site updates in about a minute. WhatsApp caches link previews, so an old preview can linger.

## Connect RSVPs and photos

Follow [SETUP.md](SETUP.md).

## Preview locally

```bash
python3 -m http.server 8000
```

Open <http://localhost:8000>, then use your browser's device toolbar for a phone-sized view.

## Files

```text
index.html, photos.html   Pages
rsvps.html                Hidden, password-protected RSVP list
config.js                 All wedding content
css/, js/                 Styling and behaviour
images/                   Motifs, preview image and QR codes
apps-script/Code.gs       Google backend
SETUP.md                  Backend setup
```

## GitHub Pages

Open **Settings > Pages**, set **Source** to **Deploy from a branch**, then choose **main** and **/ (root)**.

## Optional custom domain

1. Add a `CNAME` file at the repo root containing only your domain, such as `manishwedsalivia.com`.
2. At your domain provider, add these `A` records for `@`:
   `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
3. Add a `CNAME` record for `www` pointing to `manishdhasmana49.github.io`.
4. In **Settings > Pages**, enter the domain, wait for the DNS check, and turn on **Enforce HTTPS**.
5. Replace the old address in the `og:` and canonical tags of `index.html` and `photos.html`.
6. Regenerate the QR codes before printing, because the current ones point to the github.io address.
