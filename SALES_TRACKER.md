# Pocock Sanders Sales Tracker

A self-contained HTML tool for logging sales, fees, protection, LOAs and monthly and annual
targets. It runs entirely in the browser. There is no server and no build step. Nothing typed
into it leaves the machine it is opened on.

Current file: `Pocock_Sanders_Sales_Tracker.html` (version 2.0).

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
total-mismatch flag and the merge logic (adding only new records, skipping duplicates under a
different id, and the handling of goals and monthly targets).

## Branding

Purple `#502D7F` (Pantone 268), Calibri Light throughout, firm logo embedded as base64 so the
file stays self-contained.
