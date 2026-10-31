# Portfolio Website — Setup & User Guide

A customizable portfolio website powered by **GitHub Pages**, with optional dynamic content managed through **Google Apps Script, Google Sheets, and Google Drive**.

This guide is intended for anyone who wants to create and publish their own portfolio. You do not need to use the original website's identity, data, or Google accounts.

> **Important: read this first.** The GitHub repository contains the **public website (frontend)**. The full Portfolio Manager and Mailer backend source code, its private Google Sheets database, Google Drive files, Script Properties, and Google account permissions are **not included in the public repository**. A working dynamic website requires your **own compatible backend**. Instructions below explain how to install the two Apps Script projects **if you have obtained their source files separately**, or what you need to implement if you build your own backend. Simply creating empty scripts will not provide the missing functionality.

## 1. Before you begin

You will need:

- A [GitHub](https://github.com/) account to host the public website.
- A [Google account](https://accounts.google.com/) for Google Apps Script, Google Sheets, and Google Drive.
- A browser and a text editor (VS Code, Notepad++, or similar) to edit website files.
- **For the full-featured version:** compatible source code for the two backend projects (Portfolio Manager and Public Reader / Mailer), provided separately or developed by you.
- **Optional:** a Google Cloud OAuth client for Google Sign-in on contact/download forms.

The public website and private backend are deliberately separate:

| Component | Where it runs | What it does |
|---|---|---|
| **Public website** | GitHub Pages | Displays the portfolio and Academic Portal |
| **Portfolio Manager** | Private Google Apps Script | Edits content, saves drafts, uploads media, and publishes approved content |
| **Public Reader / Mailer** | Separate Google Apps Script | Serves approved public data, handles Mail Me, Guestbook, and authorized downloads |
| **Private database** | Google Sheets | Stores draft and published content, guest records, and private download metadata |
| **Media storage** | Google Drive | Stores photos, logos, and downloadable files |

**Do not put passwords, access tokens, private student records, original download URLs, or guest records into a public GitHub repository.**

## 2. Download and inspect the website

1. Sign in to [GitHub](https://github.com/).
2. Open the repository containing this website.
3. Choose **Code → Download ZIP**, or **Fork** it if you prefer to work directly in GitHub.
4. If you downloaded a ZIP, extract it on your computer.
5. Open the folder containing `index.html`. This folder is the website root.
6. Review the files before uploading them to your own repository. Remove data, backup files, logos, photographs, or documents that you do not own or are not permitted to redistribute.

A typical current frontend includes files such as:

```text
index.html
academic.html
common.js
portfolio.js
academic.js
v62-download.js
styles.css
v7.css, v9.css, v10.css, ... v19.css (where supplied)
logo and favicon files (if supplied)
README.md
```

Use the **actual files included in your download**. Do not look for older scripts such as `v46-download.js`, and do not create an `assets/icons` folder unless your own design explicitly uses one. Some older-version CSS files are still used, so **do not delete them merely because of their filenames**.

## 3. Create your own GitHub Pages website

1. On GitHub, click **New repository**.
2. To publish at the root of a free personal GitHub Pages address, name it **exactly** `<your-username>.github.io`. Replace `<your-username>` with your GitHub username.
3. Choose **Public** and create the repository.
4. Choose **Add file → Upload files**.
5. Upload the website files directly to the **root** of the repository, with `index.html` at the top level (not inside an extra folder).
6. Click **Commit changes**.
7. Open **Settings → Pages**.
8. Under **Build and deployment**, set **Source: Deploy from a branch**, select your main branch (usually `main`), choose `/(root)`, and click **Save**.
9. Visit:
   - Home: `https://<your-username>.github.io/`
   - Academic Portal: `https://<your-username>.github.io/academic.html`

A page loading successfully **does not** mean the dynamic backend has been configured. At this stage, it may show placeholders, empty sections, or information from the original public endpoint until you complete the following steps.

> **Different repository names:** If your repository is not named `<your-username>.github.io`, its website will usually be under a project path, such as `https://<your-username>.github.io/<repository>/`. Review absolute paths in HTML, CSS, and JavaScript before publishing. The original frontend is designed primarily for a site at the root domain.

## 4. Prepare your own Google Sheets and Drive storage

You can let a **compatible Portfolio Manager backend** initialize its database automatically, if its code supports that feature. Otherwise, create a new private Google Spreadsheet and configure your custom backend to read and write it.

1. Visit [Google Drive](https://drive.google.com/) and sign in with the Google account that will own your scripts.
2. Keep your database Spreadsheet **Restricted**; do not make it public or set it to **Anyone with the link**.
3. Prepare a folder for media such as profile images, project documentation, certificates, and slideshow photos. A compatible manager may create this folder automatically.
4. Keep **draft/private records** separate from **published content**. Only published, filtered information should be returned to website visitors.
5. Keep complete student identifiers, private grades, Guestbook data, credentials, and original download links in the private backend only.

If you receive compatible backend code separately, use its **Initialize/Setup** feature rather than manually inventing sheet tab names or columns. The backend expects a specific data structure.

## 5. Create Google Apps Script Project A: Portfolio Manager

**This is the private administrator application.** Do not grant public access to its editor or web app.

### A. Create the project and add files

1. Open [Google Apps Script](https://script.google.com/).
2. Click **New project**.
3. Rename the project to something identifiable, for example `My Portfolio Manager`.
4. In the file list, open the default `Code.gs`. If you have the compatible Portfolio Manager source, replace the file's content with **Portfolio Manager `Code.gs`**.
5. Click the **+** beside *Files*, choose **HTML**, and name the new file **`Admin`**. Apps Script creates `Admin.html`.
6. Paste the content of the supplied Portfolio Manager `Admin.html` into that HTML file.
7. Save the project (Ctrl+S or the Save icon).

Expected file list for the compatible version:

```text
My Portfolio Manager (Google Apps Script project)
├── Code.gs
└── Admin.html
```

If you do **not** have these backend source files, this step only creates an empty project structure; it does not create a working administrator. You would need to build compatible database, editing, media, authentication, and publishing logic separately.

### B. Set private Script Properties

1. In the Apps Script editor, click **Project Settings** (gear icon).
2. Scroll to **Script Properties**, then choose **Add script property**.
3. Add the settings required by your actual backend code. For the compatible version, useful properties include:

| Property | Purpose | Example / guidance |
|---|---|---|
| `OWNER_EMAIL` | Account permitted to operate Portfolio Manager | Your own Google email address |
| `PORTFOLIO_SITE_URL` | Your GitHub Pages website | `https://<your-username>.github.io/` |
| `SPREADSHEET_ID` | ID of your **private** database | Usually created by the manager during initialization |
| `DRIVE_FOLDER_ID` | ID of your Drive media folder | Usually created during initialization |
| `GITHUB_REPO` | Optional GitHub repository configuration | `<your-username>/<your-username>.github.io` |
| `GITHUB_BRANCH` | Optional branch setting | `main` |
| `GITHUB_TOKEN` | GitHub API credential, **only if a feature requires it** | Keep private; never put it in GitHub files |
| `V36_GUESTBOOK_WEBAPP_URL` | URL of your own Mailer web app | Set after deploying the Mailer |
| `V17_TOOLS_SYNC_SECRET` | Private shared key for restricted-download catalog synchronization | Generated by the compatible manager; copy privately to Mailer |

Do not copy someone else's property values. **An empty or missing property is not fixed by putting a secret in `common.js` or `index.html`.** Some values are generated automatically when you initialize the manager.

### C. Initialize the database (if using compatible backend files)

1. Return to the **Editor**.
2. Select the function **`apiInitialize`** from the function dropdown, if available.
3. Click **Run** and follow the Google authorization prompts using your own account.
4. The compatible backend creates a private Spreadsheet and Drive media folder if they have not already been configured.
5. Return to **Project Settings → Script Properties** and verify that `SPREADSHEET_ID` and `DRIVE_FOLDER_ID` are now present.
6. Do not share those assets publicly. Do not run initialization on someone else's database.

If your source version exposes an **Initialize** button in its Setup page, you may use that documented workflow instead.

### D. Deploy Portfolio Manager privately

1. Choose **Deploy → New deployment**.
2. Click the deployment type selector (gear icon) and choose **Web app**.
3. Set **Execute as: Me**.
4. Set **Who has access: Only myself** (or the equivalent owner-only option shown in your account).
5. Click **Deploy**, complete any required authorization, and copy the URL ending in `/exec`.
6. Open the URL while signed in as the owner; confirm that Portfolio Manager loads and can access the initialized database.

**Security rule:** Do not change the private administrator deployment to **Anyone** merely to make it open in another browser. Never give strangers Editor access to the original Apps Script project: editors may be able to inspect the code and Script Properties.

## 6. Create Google Apps Script Project B: Public Reader / Mailer

**This is a separate project.** It handles public requests, but it must expose only approved actions and data. It is not another administrator panel.

### A. Create the project and add files

1. Go to [Google Apps Script](https://script.google.com/) and click **New project** again.
2. Rename it, for example `My Portfolio Public Reader and Mailer`.
3. Replace the default `Code.gs` with the **Mailer `Code.gs`** from your compatible backend files.
4. Use **+ → Script** to add `PortfolioReader.gs`, then paste its source code.
5. Use **+ → Script** again to add `ToolGuestbook.gs`, then paste its source code.
6. If you were given `appsscript.json`, open **Project Settings** and enable **Show "appsscript.json" manifest file in editor**, then update the manifest using the supplied content. Do not remove or guess required OAuth scopes.
7. Save the project.

Expected project files:

```text
My Portfolio Public Reader and Mailer (Google Apps Script project)
├── Code.gs
├── PortfolioReader.gs
├── ToolGuestbook.gs
└── appsscript.json
```

Do not place these `.gs` source files, the Mailer manifest, or private Script Properties in the GitHub Pages repository.

### B. Configure the Mailer Script Properties

Open **Project Settings → Script Properties** in the **Mailer project**, not in Portfolio Manager.

| Property | Required for | Example / guidance |
|---|---|---|
| `SPREADSHEET_ID` | Reading the same private database | Copy the ID from **your own Portfolio Manager** |
| `PORTFOLIO_INBOX` | Receiving messages from Mail Me | Your own destination email address |
| `PORTFOLIO_PARENT_ORIGIN` | Restricting the website origin used by the response | `https://<your-username>.github.io` — **no path or trailing subpage** |
| `V17_TOOLS_SYNC_SECRET` | Synchronizing protected download catalogs | Must match the secret in your Portfolio Manager |
| `PORTFOLIO_MAIL_SIGNATURE` | Optional email signature | Your preferred public signature |

The two projects use **separate Script Properties**. Adding a value to Portfolio Manager does not automatically add it to Mailer.

For the compatible source, the Portfolio Manager function `apiGetOrCreateToolSyncKey` generates the shared catalog secret. Run it as the project owner, then privately copy the resulting value into the Mailer property `V17_TOOLS_SYNC_SECRET`. **Never publish that value in a README, repository, screenshot, or browser script.**

### C. Authorize Mailer access to the private Spreadsheet

1. In the Mailer editor, choose **`v59CheckMailerSettings`** and click **Run**, if that function is available. It checks whether the inbox and site-origin settings are configured.
2. Choose **`tgb38AuthorizeGuestbook`** and click **Run** to authorize Google Sheets access for the Guestbook, if your source includes that function.
3. Approve the requested Google permissions while logged in as the owner.
4. Verify that the Spreadsheet ID is correct and that the necessary tables have been initialized by Portfolio Manager.
5. If authorization fails, review the Apps Script execution logs and your account's access to the Spreadsheet. Do not fix it by sharing the Spreadsheet publicly.

### D. Deploy Mailer as a public web app

1. Choose **Deploy → New deployment → Web app**.
2. Set **Execute as: Me** so the service uses the owner's authorized access to the private database.
3. Set **Who has access: Anyone** **only if** your compatible backend has proper server-side validation, route restrictions, and data filtering.
4. Click **Deploy**, authorize the requested scopes, and copy the web app's `/exec` URL.
5. Keep the URL for the next steps. **The URL is a public endpoint, not a password.** The endpoint must be secure even when the URL is known to visitors.

For future code revisions, use **Deploy → Manage deployments → Edit (pencil) → New version → Deploy** so the existing `/exec` URL stays the same.

## 7. Connect the public website to your backend

1. Open `common.js` in your local website copy or GitHub repository.
2. Locate the public reader URL setting, for example:

   ```javascript
   const PM46_PUBLIC_API = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
   ```

3. Replace its value with **your own Mailer / Public Reader `/exec` URL**.
4. Commit the updated `common.js` to GitHub.
5. In your Portfolio Manager configuration, set the Mailer `/exec` URL for **Mail Me** and **Guestbook/Materials** as required by its Setup/Profile options. The compatible manager may store the Guestbook endpoint under `V36_GUESTBOOK_WEBAPP_URL`.
6. Ensure your backend's allowed website origin matches your GitHub Pages address.
7. Open the public website in a private/incognito window and check that only your own published data is loaded.

**Critical:** Do not leave the original website's Mailer endpoint in `common.js`. That endpoint belongs to a different deployment and will not act as your private database.

### If you write your own backend

The frontend uses an **iframe and `postMessage`**, not a simple public spreadsheet or a standalone JSON file. A replacement must implement a compatible protocol, including:

- `GET ?action=published_portfolio&nonce=...` for published portfolio content.
- `GET ?action=published_academic&nonce=...` for published academic content.
- `GET ?action=published_site&nonce=...` for the shared public site data when requested.
- `GET ?action=published_grades&board=ID&nonce=...` for approved, server-masked grade announcements.
- A response message with type `ASJ_PUBLISHED_V46`, the matching `requestId` / nonce, the appropriate `kind`, and either `ok: true` plus `data`, or `ok: false` plus a safe error message.
- Explicit validation for contact requests, Google identity tokens, Guestbook submissions, restricted materials, and catalog synchronization.

Do not return private sheet rows or original file URLs as part of the ordinary published-site response. Never trust an email address typed into a browser as proof of Google account ownership.

## 8. Add your own identity, media, and content

1. Open your private Portfolio Manager.
2. Replace all sample profile details with your own name, biography, location, institution, and relevant links.
3. Add **Experiences**, **Projects & Studies**, **Publications**, **Other Activities**, and any optional academic sections you need.
4. Add course titles and material descriptions. In compatible recent versions, the course's primary name is entered in **Indonesian**, while an English translation can be generated and corrected manually. Material/book titles are kept as entered.
5. Replace the original logo, header image, favicon, and media references with assets you are authorized to publish. Keep the required local files if your theme uses them.
6. Use your own Google Drive storage for public images. Confirm in Incognito that visitors can load public images.
7. Configure which modules are **ON/OFF**. If a module is OFF, a secure backend should **omit its private data from the public response**, not just hide the HTML element.
8. Click **Save** to store draft changes, then **Publish** to update the public version. Saving a draft alone does not necessarily publish it.

Publicly visible images and files may still be copied by visitors, even if the website disables right-click or stores media in Google Drive.

## 9. Optional features: Google Sign-in, Guestbook, Mail Me, and downloads

These features require a working Mailer and additional configuration. Do not enable them until their backend routes are operational.

**Google Sign-in (for identity verification):**

1. Open the [Google Cloud Console](https://console.cloud.google.com/) and configure a Google Auth Platform / OAuth consent configuration for your application, if required.
2. Create an appropriate **Web application OAuth client ID**.
3. Add your own HTTPS GitHub Pages site to the authorized JavaScript origins as needed by your OAuth setup.
4. Configure that **client ID** in the corresponding Portfolio Manager/Profile Google Sign-in setting (the compatible public profile uses `mailGoogleClientId`).
5. Never include a Google OAuth **client secret** in browser JavaScript. The client ID is public by design.
6. Test login and switching Google accounts, including on mobile devices.

**Guestbook and downloading materials:**

- The visitor's Google identity must be verified by the Mailer **server**, not only by browser JavaScript.
- Keep original file download URLs in the private database or a protected server catalog; do not put them in GitHub.
- If you enable institution-only resources, enforce the domain and account restrictions on the server. A visible warning or disabled button is **not** security by itself.
- Browsers may block automatic downloads, particularly cross-origin Google Drive downloads initiated in hidden iframes. A retry button does not guarantee that the download succeeded.
- Anyone who receives an **Anyone with the link** Drive URL may be able to share that URL with someone else. A Guestbook does not revoke this capability.

**Mail Me:** Set the receiving email in the Mailer Script Property `PORTFOLIO_INBOX`, not directly in public code.

## 10. Optional feature: grade announcements

1. Keep raw grade spreadsheets and full student identifiers private.
2. Publish only data that is intentionally approved for public display.
3. Mask sensitive identifiers **in the backend before transmission**.
4. Set an expiration date where the feature supports it.
5. Test the published response, not just the visual display. Hidden HTML or CSS does not protect data already sent to the browser.
6. Remember that even partially masked grades can sometimes allow re-identification in small groups.

## 11. Final checklist before going live

- [ ] My GitHub Pages URL belongs to **my own GitHub account**.
- [ ] `index.html`, `academic.html`, and all referenced CSS/JS files load correctly.
- [ ] `common.js` points to **my own Mailer**, not the original site's endpoint.
- [ ] Portfolio Manager is deployed with **owner-only** access.
- [ ] Mailer returns only published data and validates sensitive operations server-side.
- [ ] Script Properties contain **my own settings**, not someone else's.
- [ ] The private Spreadsheet is **Restricted**.
- [ ] I replaced sample names, logos, contact links, and other personal content.
- [ ] Save and Publish both work, and changes appear on my own website.
- [ ] ID/EN switching works, and the Academic Portal loads as expected.
- [ ] Images and logos load correctly, including on a phone.
- [ ] If enabled, Google Sign-in fills verified identity information correctly.
- [ ] If enabled, Guestbook, Mail Me, downloads, and restricted materials work.
- [ ] No passwords, GitHub tokens, private data, source grade files, or original restricted download URLs were committed to GitHub.
- [ ] I tested the website in **Incognito** and checked the browser's developer console for errors.

## 12. Troubleshooting

| Problem | What to check |
|---|---|
| GitHub Pages displays 404 | Repository name, `index.html` at root, branch, and **Settings → Pages** |
| Website loads, but content is missing | `PM46_PUBLIC_API` in `common.js`, Mailer `/exec` URL, Publish status, and backend response |
| Website displays the original portfolio | You have not replaced the original API URL or sample published data |
| Apps Script shows `Access denied` | Signed-in Google account, `OWNER_EMAIL`, owner-only deployment, and permissions |
| Apps Script asks for authorization | Run the documented initialization/authorization functions as the owner |
| Mailer cannot read the database | Mailer's `SPREADSHEET_ID`, spreadsheet access, and necessary OAuth permissions |
| Mailer configuration fails | `PORTFOLIO_INBOX`, `PORTFOLIO_PARENT_ORIGIN`, and optional sync secret |
| Images do not load | Google Drive file permissions, URL format, or stale media references |
| Google Sign-in does not work | OAuth client ID, authorized JavaScript origin, browser cookies, and domain configuration |
| A download does not start | Drive permissions, browser pop-up/download restrictions, and Mailer response |
| Academic Portal is empty | Course/module visibility, Save/Publish status, and published academic data |
| Grade announcements do not appear | Board activation, expiration date, and `published_grades` response |

For additional information about the underlying platforms, see the official documentation:

- [GitHub Pages documentation](https://docs.github.com/en/pages)
- [Google Apps Script documentation](https://developers.google.com/apps-script)
- [Apps Script HTML service](https://developers.google.com/apps-script/guides/html)
- [Google Apps Script web apps](https://developers.google.com/apps-script/guides/web)

## 13. Need help?

If you encounter difficulties during setup or need clarification about this guide, please visit **[asjwd.github.io](https://asjwd.github.io/)** and use the **Mail Me** feature to send your question.

Please include which step you are working on and any **non-sensitive** error message. **Never send passwords, API tokens, OAuth client secrets, synchronization keys, or private student records** in a support message.

---

*This repository is intended as a starting point for your own portfolio. You are responsible for configuring your own hosting, Google services, permissions, and content before publishing.*
