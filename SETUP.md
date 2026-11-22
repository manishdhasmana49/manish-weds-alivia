# Connect RSVPs and photo uploads

This takes about 10 minutes. Use the Google account that should own the guest list and photos.

## 1. Create the Sheet

1. Open <https://sheets.new>.
2. Click the title at the top left and name it `Manish & Alivia Wedding`.

You don't need to create tabs. Step 3 creates the `RSVP` and `Uploads` tabs.

Guest photos go to [this Drive folder](https://drive.google.com/drive/folders/1_hC7qifCuOezrvwijxSnAvIkNGzyK5HO), which is already set in the script. The account you use here must be able to edit that folder.

## 2. Paste the script

1. In the Sheet, click **Extensions > Apps Script**.
2. Delete everything in the editor.
3. Paste the full contents of `apps-script/Code.gs`.
4. Click the **Save** icon.

## 3. Run setup once

1. In the function dropdown at the top, choose `setup`.
2. Click **Run**.
3. Click **Review permissions** and choose your account.
4. If Google says the app isn't verified, click **Advanced > Go to (project name)**. This is your own script.
5. Click **Allow**.
6. Copy the token shown in the **Execution log**. You need it in step 5.

`setup` saves the Sheet ID, folder ID and token in Script Properties, so there are no IDs to edit by hand. It also confirms that it can add files to the Drive folder. To change the folder later, edit `DRIVE_FOLDER_ID` at the top of the script, run `setup` again, and publish a new version.

## 4. Deploy as a web app

1. Click **Deploy > New deployment**.
2. Click the gear icon and choose **Web app**.
3. Set **Execute as** to **Me**.
4. Set **Who has access** to **Anyone**.
5. Click **Deploy**.
6. Copy the **Web app URL**. It ends in `/exec`.

## 5. Update config.js

```js
backend: {
  url: "https://script.google.com/macros/s/YOUR_ID/exec",
  token: "THE_TOKEN_FROM_STEP_3",
},
```

Commit and push:

```bash
git add config.js
git commit -m "Connect backend"
git push
```

## 6. Test it

1. Wait a minute for GitHub Pages to update, then open the site on your phone.
2. Submit an RSVP and check the `RSVP` tab.
3. Submit again with the same phone number and check that the same row changes.
4. Upload a photo on `photos.html` and check the Drive folder and `Uploads` tab.
5. Delete your test rows before sharing the link. Deleting a row from `Uploads` gives that device its photo allowance back.

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

- The token is visible in the public site's code. It stops casual bots, but it isn't a password.
- If the token leaks or spam appears, change `TOKEN` in Script Properties, update `config.js`, and push.
- The 5-photo limit is per browser on a device. A guest who clears browser data or switches device gets a new allowance.
- Uploaded photos stay private in your Drive unless you share the folder.
