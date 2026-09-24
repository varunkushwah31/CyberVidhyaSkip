# CyberVidya Attendance & Skip Planner

Chrome extension for students of KIET, ABES, AKGEC, and all institutions using CyberVidya ERP to track attendance, compute safe skip allowances, simulate leave impact, and prevent debarment under the 75% attendance rule.

## 🚀 Key Features

- **Interactive "What-If" Leave Simulator**: Test `+1 Attended` / `+1 Missed` scenarios per subject or test full-day leaves ("Can I skip tomorrow?") without touching real data.
- **Duty Leave (OD) Recovery Tracker**: Log pending On-Duty / Medical certificates to project your attendance and debarment clearance.
- **Full-Semester Skip Budget**: Calculate remaining skips allowed across the entire ~45-lecture semester under the 75% threshold.
- **Multi-Institute Support**: Works automatically on any `*.cybervidya.net` portal with dynamic subdomain detection.
- **In-Portal Enhancements**: Danger row highlighting (<75% warning tint) and a non-intrusive floating quick pill widget directly inside CyberVidya.

## 📌 User Instructions: Getting Accurate Data

To get **100% accurate data** (including complete lecture logs and Duty Leave / OD adjustments):

1. Go to your portal's attendance page (e.g. **`https://[your-college].cybervidya.net/attendance/my-attendance`**) in your browser.
2. The extension will automatically read and cache the verified lecture breakdown and attendance logs for all your registered courses.
3. Open the extension popup anytime to view your exact skip margin, simulate leaves, and track your aggregate attendance!

---

This is a [Plasmo extension](https://docs.plasmo.com/) project bootstrapped with [`plasmo init`](https://www.npmjs.com/package/plasmo).

## Getting Started

First, run the development server:

```bash
pnpm dev
# or
npm run dev
```

Open your browser and load the appropriate development build. For example, if you are developing for the chrome browser, using manifest v3, use: `build/chrome-mv3-dev`.

You can start editing the popup by modifying `popup.tsx`. It should auto-update as you make changes. To add an options page, simply add a `options.tsx` file to the root of the project, with a react component default exported. Likewise to add a content page, add a `content.ts` file to the root of the project, importing some module and do some logic, then reload the extension on your browser.

For further guidance, [visit our Documentation](https://docs.plasmo.com/)

## Making production build

Run the following:

```bash
pnpm build
# or
npm run build
```

This should create a production bundle for your extension, ready to be zipped and published to the stores.

## Submit to the webstores

The easiest way to deploy your Plasmo extension is to use the built-in [bpp](https://bpp.browser.market) GitHub action. Prior to using this action however, make sure to build your extension and upload the first version to the store to establish the basic credentials. Then, simply follow [this setup instruction](https://docs.plasmo.com/framework/workflows/submit) and you should be on your way for automated submission!
