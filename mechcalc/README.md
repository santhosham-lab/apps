# MECHCALC

MECHCALC is a free-first, browser-based Mechanical Engineering calculation workspace. Version 0.2.0 extends the initial release and is designed for GATE-oriented learning and transparent numerical calculations.

## Current release: 0.2.0

- Responsive dashboard for mobile, tablet and desktop browsers
- Scientific calculator with a safe expression parser (no eval or dynamic Function execution)
- Unit converter for common mechanical engineering quantities
- Reciprocating pump calculator:
  - Single-acting and double-acting configurations
  - SI unit normalization
  - Theoretical discharge, slip and volumetric efficiency
  - Water power and overall efficiency
  - Step-by-step working, assumptions and plausibility warnings
- Centrifugal pump calculator:
  - SI-normalized flow rate, head, impeller diameter and shaft power
  - Water power and overall efficiency
  - Metric specific speed, impeller tip speed, head coefficient and flow coefficient
  - Step-by-step working, assumptions and plausibility warnings
- Question intake screen for pasted text and image/PDF attachments (automated AI interpretation is not active in this release)
- Built-in calculation self-tests in the browser console

## Run locally

Open index.html in a modern browser. No build step, package manager, account or API key is required.

## GitHub Pages

Published under the existing Apps repository at:

https://santhosham-lab.github.io/apps/mechcalc/

The repository Pages workflow publishes the existing Fitracker at the site root and MECHCALC under /mechcalc/.

## Centrifugal pump equations

Water power: Pw = ρgQH

Overall efficiency: ηo = (Pw / Pin) × 100%

Impeller tip speed: u = πDN / 60

Metric specific speed: Ns = N√Q / H^(3/4), using N in rpm, Q in m³/s and H in metres. Specific-speed conventions vary, so values should only be compared when the same convention is used.

## Reciprocating pump equations

Piston area: A = πD² / 4

Single-acting theoretical discharge: Qth = ALN / 60

Double-acting theoretical discharge, accounting for piston rod area a: Qth = (2A − a)LN / 60

Volumetric efficiency: ηv = (Qactual / Qth) × 100%

Water power: Pw = ρgQactualH

Overall efficiency, using shaft input power: ηo = (Pw / Pin) × 100%

## Validation example

For a single-acting pump with D = 150 mm, L = 300 mm, N = 60 rpm, actual discharge = 4 L/s, H = 20 m, input shaft power = 1.5 kW, water density = 1000 kg/m³ and g = 9.81 m/s²:

- Piston area = 0.0176715 m²
- Theoretical discharge = 0.00530144 m³/s
- Volumetric efficiency = approximately 75.45%
- Water power = 784.8 W
- Overall efficiency = 52.32%

The app runs regression checks for these values when it loads.

## Engineering limitations

This is an early educational and calculation tool, not a certified engineering package. The pump model uses average theoretical displacement. For double-acting pumps, piston-rod area should be supplied for the more accurate equation. The app flags some physically questionable results but does not replace engineering judgement, applicable codes, manufacturer data or independent verification. Do not use it as the sole basis for safety-critical design.

## Roadmap

1. Continue expanding verified GATE Mechanical Engineering calculators by subject (centrifugal pump is the first V2 addition).
2. Add structured formula references and worked examples.
3. Implement local OCR and question parsing for text, images and PDFs.
4. Add optional BYOK AI integrations through a secure architecture.
5. Add professional design calculations with explicit code references, assumptions and validation tests.
