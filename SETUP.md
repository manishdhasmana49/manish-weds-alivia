# Connect RSVPs and photo uploads

This takes about 10 minutes.

- RSVPs are saved in the **private** GitHub repo `manish-weds-alivia-rsvps`, in `rsvps.json`.
- You read them on the hidden, password-protected `rsvps.html` page.
- Guest photos go to [this Drive folder](https://drive.google.com/drive/folders/1_hC7qifCuOezrvwijxSnAvIkNGzyK5HO).
- Google Sheets is not used.

## 1. Create a GitHub access key

1. Open [this prefilled GitHub token page](https://github.com/settings/personal-access-tokens/new?name=Wedding%20RSVP%20backend&description=Saves%20wedding%20RSVPs&expires_in=365&contents=write).
2. Under **Repository access**, choose **Only select repositories**.
3. Select **only** `manish-weds-alivia-rsvps`.
4. Under **Repository permissions**, confirm **Contents** is **Read and write**.
5. Click **Generate token** and copy it. Don't commit it or put it in `config.js`.

## 2. Paste the script

1. Open <https://script.new> using a Google account that can **edit** the Drive folder.
2. Name the project `Wedding backend`.
3. Delete the sample code and paste all of `apps-script/Code.gs`.
4. Click **Save**.

## 3. Add the two private values

1. Click the **gear icon (Project Settings)**.
2. Under **Script Properties**, click **Add script property** and add:

| Property | Value |
|---|---|
| `GITHUB_TOKEN` | The token from step 1 |
| `ADMIN_PASSWORD` | Your private RSVP page password |

3. Click **Save script properties**.

Never write the password in this repo. Everything here is public.

## 4. Run setup once

1. Go back to the **Editor** (`< >` icon).
2. Choose `setup` in the function menu and click **Run**.
3. Click **Review permissions** and choose your account.
4. If Google says the app isn't verified, click **Advanced > Go to Wedding backend**. This is your own script.
5. Click **Allow**.
6. Copy the token shown in the **Execution log**.

## 5. Deploy as a web app

1. Click **Deploy > New deployment**.
2. Click the gear icon and choose **Web app**.
3. Set **Execute as** to **Me**.
4. Set **Who has access** to **Anyone**.
5. Click **Deploy** and copy the **Web app URL** ending in `/exec`.

## 6. Update config.js

```js
backend: {
  url: "https://script.google.com/macros/s/YOUR_ID/exec",
  token: "THE_TOKEN_FROM_STEP_4",
},
```

Commit and push:

```bash
git add config.js
git commit -m "Connect backend"
git push
```

## 7. Test it

1. Wait a minute for GitHub Pages to update, then submit an RSVP on your phone.
2. Open <https://manishdhasmana49.github.io/manish-weds-alivia/rsvps.html> and enter your password.
3. Submit again with the same phone number and check that the same entry changes.
4. Upload a photo on `photos.html` and check the Drive folder.
5. Remove test RSVPs from `rsvps.json` in the private repo before sharing the link.

## Publishing a new version after changing Code.gs

Saving the script does **not** update the live site.

1. Paste the new code and click **Save**.
2. Click **Deploy > Manage deployments**.
3. Select the active deployment and click the **pencil** icon.
4. Under **Version**, choose **New version**.
5. Click **Deploy**.

The URL stays the same, so `config.js` doesn't change. Avoid **New deployment** here, because it creates a different URL.

## Details to update later

Add these in `config.js`, then push. Until then, guests see "to be announced" or the item stays hidden.

- [ ] WhatsApp contacts for the groom's and bride's sides
- [ ] Dress codes for the wedding and reception
- [ ] Hotel details
- [ ] Train or flight details and the return plan
- [ ] RSVP closing date
- [ ] Wedding hashtag
- [ ] Full venue addresses
- [ ] Kolkata venue name: the map link says "Utalika Luxury, Prathama", while the site says "Utalika ~ The Condoville"

## Good to know

- Photos are saved in a subfolder for each event and named after the guest, such as `Riya Sharma.jpg`, then `Riya Sharma 2.jpg`.
- `uploads-log.json` in the Drive folder enforces the 5-photo limit. Keep it there. Removing a device's entries gives that device its allowance back.
- To change the RSVP password, update `ADMIN_PASSWORD` in Script Properties. No redeploy is needed.
- The GitHub token expires after a year, which is well past the wedding.
- After 8 wrong passwords, the RSVP page locks for 15 minutes.
- The site's `backend.token` is visible in public code. It stops casual bots, but it does not protect RSVP data. The password does that.
- The 5-photo limit is per browser on a device. A guest who clears browser data or switches device gets a new allowance.
- Uploaded photos stay private in your Drive unless you share the folder.
