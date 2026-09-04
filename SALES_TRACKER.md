# Pocock Sanders Sales Tracker

A self-contained HTML tool for logging sales, fees, protection, LOAs and monthly and annual
targets. It runs entirely in the browser. There is no server and no build step. Nothing typed
into it leaves the machine it is opened on.

Current file: `Pocock_Sanders_Sales_Tracker.html` (version 2.2).

## Dashboard

The top of the tool is a performance dashboard, refreshed on every change:

- **Run-rate projection.** From the pace of the year so far (counted in working days), the
  projected year-end total, with a chip showing how far ahead of or short of the annual goal
  that pace lands. Shown only when an annual goal is set.
- **Monthly pace.** For the live month, how far ahead of or behind the steady pace you are, in
  pounds, with a marker on the target bar at the point the month has reached. Pace uses working
  days, so it is a fair "where you should be by today".
- **Year at a glance.** A bar of total fees for each month of the selected year, the best month
  in gold, and a dashed line at the average monthly figure the annual goal implies. Hover a bar
  for its figure.
- **Milestones.** Consecutive months the monthly target was met, best month so far, the gap to
  the next round-number YTD milestone, and the year's running total.

All figures are rounded to the nearest pound. Progress percentages on the bars are shown as
whole numbers for readability; this is an internal dashboard, not client-facing output.

## Running it

Open the file in a browser. Double-clicking works, as does opening it from a network share.
Chrome or Edge are preferred.

## Where the data lives

All data (sales, LOAs, goals, monthly targets) is held in the browser's `localStorage`, keyed
to wherever the file is opened from. It is not held inside the HTML file itself, so the file
carries no client information and is safe to keep in version control.

Two consequences follow, and they matter:

1. **Data is per browser and per device.** A sale logged on your laptop does not appear on
   your phone by itself. The tool has no cloud sync by design, so no client data ever leaves
   your own devices.
2. **Open the file from the same place each time.** `localStorage` is tied to the file's
   location. If you move the file to a different folder or a different machine, the new copy
   starts empty until you restore a backup into it.

## Moving data between devices

Use **Backup All Data** to save a `PS_Sales_Tracker_Backup_YYYY-MM-DD.json` file. On the other
device, use **Restore Backup** and choose:

- **Merge** &mdash; keeps everything already on that device and adds anything from the backup it
  does not already have. Records are matched on their id first, then on a value fingerprint, so
  the same sale is never duplicated. Nothing is deleted. Use this to bring a phone and a laptop
  into line.
- **Replace** &mdash; wipes the device first and loads the backup as the single source of truth.

The tool shows the date of the last backup taken on the device, and warns when it is more than
a week old.

These backup files contain client names and figures. They are blocked in `.gitignore` and must
never be committed or sent to any third-party service.

## Auto-backup to a folder (Chrome or Edge)

**Set Auto-Backup Folder** lets you nominate one folder (for example a Dropbox folder) that the
tool writes to automatically. After you choose it once, every change saves a dated backup,
`PS_Sales_Tracker_Backup_YYYY-MM-DD.json`, into that folder, overwriting the same file through
the day. Pointing this at a Dropbox folder is the cleanest way to get the data onto every
device: the tool writes locally and Dropbox handles the sync.

Two limits come from the browser, not the tool:

- It works only in **Chrome or Edge**. Other browsers fall back to the manual download, and the
  status line says so.
- Browsers reset folder permission each session for security. When you reopen the file, the
  status line shows auto-backup as **paused**, and the first time you add or edit an entry the
  browser asks you to allow the folder again. Click allow once and it is silent for the rest of
  the session. There is no way to remove that one prompt without a server, which the tool
  deliberately does not use.

The folder choice is remembered between sessions, so you only pick it once per device. If you
move the HTML file to a different location, choose the folder again.

## Updating the tool

The single canonical copy of the app lives on the `Sales-Tracker` branch of this repository.
To update a device, download the latest `Pocock_Sanders_Sales_Tracker.html` and open it from
the same location as before. Because the data is stored separately from the code, replacing the
file in place keeps your data intact. If in doubt, take a backup first, then replace the file,
then restore with **Merge** if the new copy opens empty.

There is no automatic push of code updates to every device, because the tool is deliberately
serverless. "Update once, carry the file" is the trade for keeping all data on your own kit.

## Data integrity flag

Each sale's **Total** should equal **Fees + Protection**. Where a stored Total does not (for
example an imported row parked at zero, or a typo), the row shows an amber ⚠ in the Total
column and the month header shows a count. Hover the ⚠ for the detail. The tool never rewrites
the record. Open **Edit** and save to recalculate, or leave it if the row is deliberate.

## Import from Excel

**Import** reads an `.xlsx`, `.xls` or `.csv` workbook and pulls in every tab named like a
month (for example `Jan 2026`). Summary and collective tabs, subtotal rows and repeated header
rows are skipped so nothing is double-counted. Rows that duplicate an existing entry
(same date, client and total) are skipped.

## Tests

`node tests/test_sales_tracker.js`

The harness lifts the inline script out of the HTML and runs it against a minimal DOM stub, the
same technique used for the IHT planner, so the tests exercise shipped code. Coverage is the
total-mismatch flag, the merge logic (adding only new records, skipping duplicates under a
different id, and the handling of goals and monthly targets), and the dashboard maths (working
days, monthly and yearly pace, the year-end projection, monthly totals, best month, target
streaks and the next milestone).

## Branding

Purple `#502D7F` (Pantone 268), Calibri Light throughout, firm logo embedded as base64 so the
file stays self-contained.
