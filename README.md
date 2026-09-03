# Pocock Sanders Inheritance Tax Planner

A self-contained HTML tool that models a client's Inheritance Tax position and produces a
branded, printable planning report. It runs entirely in the browser. There is no server, no
build step and no external data storage, so nothing that is typed into it leaves the machine
it is opened on.

Current file: `Pocock_Sanders_IHT_Calculator.html` (calculator version 16.21).

## Running it

Open the file in a browser. Double-clicking it works, as does opening it from a network share.
Chrome or Edge are preferred, because the report is produced through the browser print dialogue
and those two give the most reliable "Save as PDF" output.

The only external dependency is a web font pulled from `fonts.cdnfonts.com`. Without a network
connection the tool still works and falls back to Calibri, so the figures and the report are
unaffected.

## What it covers

The tool works through six steps: the estate and asset position, the Inheritance Tax position
under current rules, the position from 6 April 2027 once unused pension funds come inside the
estate, a Discounted Gift Trust with Whole of Life cover, a Business Relief or AIM ISA
investment, and a final client report.

Rules and thresholds reflected in the current version:

| Item | Treatment |
|---|---|
| Nil Rate Band | £325,000 per person, frozen to April 2031 |
| Residence Nil Rate Band | £175,000 per person, frozen to April 2031 |
| RNRB taper | Reduced by £1 for every £2 of estate value above £2,000,000 |
| Standard rate | 40% |
| BPR and APR | 100% relief on the first £2.5m of combined qualifying property per person, 50% above that, since 6 April 2026 |
| AIM-listed shares | 50% relief only since 6 April 2026, and outside the £2.5m allowance |
| Unused pension funds | Inside the estate from 6 April 2027 |

## Modelling assumptions

These are simplifications built into the current version. They are reasonable for an
illustration but they matter when reading the output:

- A couple is modelled as a single combined estate, with allowances doubled. This assumes the
  full Nil Rate Band and Residence Nil Rate Band transfer on first death and that the spouse
  exemption applies in full.
- Lifetime gifts within seven years reduce the available Nil Rate Band. Taper relief and any
  separate charge on the donee are not modelled.
- The estate is entered gross. There is no field for mortgages, loans or other liabilities.
- The reduced 36% rate for estates leaving 10% or more to charity is not modelled.
- Existing Business Relief and trust holdings are assumed to have completed their qualifying
  periods, being two years for Business Relief and seven years for gifts into trust.

## Branding

Purple `#502D7F` (Pantone 268), Calibri Light throughout, with the firm logo embedded as
base64 so the file stays self-contained. The report prints to A4 with fixed margins so that
every printer and every "Save as PDF" produces the same pagination.

## Regulatory note

Output is an illustration to support a discussion between the client and their adviser. It is
not a precise calculation of any actual liability and it is not personalised advice. The
generated report carries the full caveats and the firm's FCA reference.
