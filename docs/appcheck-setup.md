# Firebase App Check — setup guide (C8)

App Check protects Firestore from abusive clients. The integration code is
prepared but **disabled by default** — enabling it without console setup
blocks ALL writes.

## Steps to enable

1. Firebase Console → **App Check** → register the **Web app**
   with **reCAPTCHA v3** (get a site key from https://console.cloud.google.com/security/recaptcha).
2. Open `admin/js/common.js` and `assets/js/ui.js` is NOT required for public
   reads; writes happen only from admin.
3. In `admin/js/app.js`, add near the top (after firebase-config import):

```js
import { initializeAppCheck, ReCaptchaV3Provider } from
    "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-check.js";
import { app } from '../../assets/js/firebase-config.js';

initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('YOUR_RECAPTCHAV3_SITE_KEY'),
  isTokenAutoRefreshEnabled: true
});
```

4. Start in **monitoring mode** in the console, review metrics for a few days,
   then switch to **Enforced**.

## Notes

- Public read-only pages keep working without App Check tokens unless you also
  enforce checks on reads (not recommended for this project).
- Local development: add `debug` token via
  `self.FIREBASE_APPCHECK_DEBUG_TOKEN = '...'` before initialize when testing on localhost.
