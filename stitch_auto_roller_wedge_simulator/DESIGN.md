---
name: Apex Physics Lab - Auto-Roller Wedge
colors:
  surface: '#f9faf7'
  surface-dim: '#d9dad8'
  surface-bright: '#f9faf7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f1'
  surface-container: '#edeeeb'
  surface-container-high: '#e7e8e6'
  surface-container-highest: '#e2e3e0'
  on-surface: '#191c1b'
  on-surface-variant: '#414847'
  inverse-surface: '#2e312f'
  inverse-on-surface: '#f0f1ee'
  outline: '#727877'
  outline-variant: '#c1c8c6'
  surface-tint: '#486460'
  primary: '#001d1a'
  on-primary: '#ffffff'
  primary-container: '#16322f'
  on-primary-container: '#7d9b96'
  inverse-primary: '#aecdc8'
  secondary: '#795902'
  on-secondary: '#ffffff'
  secondary-container: '#fdd275'
  on-secondary-container: '#775800'
  tertiary: '#231700'
  on-tertiary: '#ffffff'
  tertiary-container: '#3c2b00'
  on-tertiary-container: '#b49042'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cae9e4'
  primary-fixed-dim: '#aecdc8'
  on-primary-fixed: '#02201d'
  on-primary-fixed-variant: '#304c48'
  secondary-fixed: '#ffdf9e'
  secondary-fixed-dim: '#ebc166'
  on-secondary-fixed: '#261a00'
  on-secondary-fixed-variant: '#5b4300'
  tertiary-fixed: '#ffdea0'
  tertiary-fixed-dim: '#e9c16d'
  on-tertiary-fixed: '#261a00'
  on-tertiary-fixed-variant: '#5c4300'
  background: '#f9faf7'
  on-background: '#191c1b'
  surface-variant: '#e2e3e0'
typography:
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Space Grotesk
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  title-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  title-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.03em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system expresses the discipline, analytical rigor, and pristine clarity of an advanced physics instrumentation suite. Built for laboratory researchers, precision engineers, and experimental physicists interacting with the Auto-Roller Wedge apparatus, the UI evokes measured confidence, empirical veracity, and calm focus under high-stakes experimental conditions.

The aesthetic philosophy draws from modern precision engineering and classical scientific publication:
- **Laboratory Minimalist & Instrument Grade**: Crisp technical boundaries, high optical clarity, and zero ornamental noise.
- **Cartographic Precision**: Fine hairline strokes reminiscent of coordinate planes, vernier scales, and oscilloscope readouts.
- **Material Restraint**: Deep botanical evergreen anchor points paired with warm, unbleached lab-parchment neutrals and calibrated gold calibration markers.

## Colors

The palette is strictly calibrated for high-legibility light environments, simulating premium scientific ledger surfaces and optical measurement instruments.

### Core Roles
- **Primary (`#16322F`)**: Deep forest green serving as the dominant visual weight—used for foundational interactive states, structural strokes, and high-emphasis analytical markers.
- **Secondary (`#C9A24B`)**: Muted instrument gold deployed exclusively for operational state highlights, active calibration toggles, and vector indicator accents.
- **Tertiary (`#8A6A1F`)**: Deep accessible gold designated for textual emphasis, metric subheadings, and high-contrast callouts requiring AAA accessibility against pale containers.
- **Neutral Canvas (`#F7F8F5` / `#FFFFFF`)**: Warm off-white substrate (`#F7F8F5`) grounding the page, with crisp bleached white (`#FFFFFF`) dedicated to floating metric cards and canvas plotters.

### Surface Tiers & Container Logic
- `surface-dim`: `#F7F8F5` (Application root background, gutter panels)
- `surface`: `#FFFFFF` (Base workspace backdrop)
- `surface-container-lowest`: `#FFFFFF` (Primary elevation for elevated telemetry cards)
- `surface-container-low`: `#F7F8F5` (Inset sub-panels, secondary trays)
- `surface-container`: `#EEF2EF` (Neutral grouping frames, axis control wells)
- `surface-container-high`: `#E3E8E5` (Hover states, nested data arrays)
- `surface-container-highest`: `#D9E1DC` (Divider strokes, inactive boundaries)

### Text & Line Contrast
- `on-surface`: `#16322F` (Primary metrics, labels, primary readings)
- `on-surface-variant`: `#4A6460` (Units, secondary axis keys, inactive parameters)
- `outline`: `#D9E1DC` (Primary structural bounds and graph grids)
- `outline-variant`: `#E6ECE8` (Secondary grid ticks, subtle row bounds)

### Diagnostic States
- **Success (`#1F8A5B`)**: Nominal velocity, equilibrium reached, sensor locked.
- **Warning (`#C77A12`)**: Thermal variance, limit switch approaching, calibration drift.
- **Error (`#C73A32`)**: Mechanical resistance trip, runaway velocity, emergency stop.

## Typography

Typography establishes an immediate scientific hierarchy through a tri-font structure:
- **Headlines (`Space Grotesk`)**: Technical, balanced, geometric forms that emulate drafting schematics and modern mechanical documentation.
- **Body (`Hanken Grotesk`)**: Sharp, neutral, highly legible sans-serif for observational notes, telemetry analysis, and parameter definitions.
- **Labels & Data (`JetBrains Mono`)**: Strict monospace clarity for coordinate values, roller pitch angles ($\theta$), angular velocity ($\omega$), timestamps, and numeric inputs.

### Typographic Rules
- Always use `label-md` or `label-sm` with tabular lining figures for numerical readouts to prevent horizontal jitter during real-time data streaming.
- Metric units (e.g., `mm/s²`, `rad`, `N·m`) must be rendered using `on-surface-variant` (`#4A6460`) to keep the primary numerical magnitude prominent.

## Layout & Spacing

The layout philosophy follows a disciplined, laboratory instrument workbench grid.

### Layout Model
- **Workbench Canvas**: A desktop-first 12-column layout designed to maximize visible horizontal real-estate for continuous oscillograms and real-time wedge angle diagrams.
- **Columns & Tracks**: 12 columns on desktop (`>= 1200px`) with `1.25rem` (`20px`) gutters; 8 columns on tablet (`768px - 1199px`) with `1rem` (`16px`) gutters; 4 columns on mobile (`< 768px`) with `0.75rem` (`12px`) gutters.
- **Section Margin**: Anchored by a steady `2rem` (`32px`) workspace margin on desktop, collapsing to `1rem` (`16px`) on mobile devices.

### Alignment Rhythm
- Spacing values rely strictly on multiples of 4px/8px to align with scientific drafting conventions.
- Data charts must snap to full container bounds with internal `space-md` (`16px`) safe padding to preserve scale fidelity without clipping axis ticks.

## Elevation & Depth

To avoid murky, non-reproducible shadows in technical environments, this design system uses **Tonal Layers and Low-Contrast Structural Outlines** rather than heavy blurred drop shadows.

### Elevation Architecture
1. **Canvas Base (Level 0)**: Root surface `#F7F8F5`. Complete flat neutral plane.
2. **Instrument Cards (Level 1)**: Pure white `#FFFFFF` crisp surfaces bounded by an explicit 1px stroke of `outline` (`#D9E1DC`). Shadows are micro-diffused: `0 1px 3px rgba(22, 50, 47, 0.04), 0 1px 2px rgba(22, 50, 47, 0.02)`.
3. **Active Telemetry / Inspection Overlays (Level 2)**: Crisp `#FFFFFF` surface accompanied by a subtle double-edge: 1px solid `primary` (`#16322F`) outline and an ambient shadow of `0 4px 12px rgba(22, 50, 47, 0.06), 0 1px 3px rgba(22, 50, 47, 0.04)`.
4. **Modal Diagnostics / Run Interrupters (Level 3)**: `#FFFFFF` surface suspended over a 40% opacity scrim of `#16322F`, supported by `0 12px 28px rgba(22, 50, 47, 0.12)`.

Grid lines within charts and splitters use `outline-variant` (`#E6ECE8`) at exactly 1px thickness to emulate millimeter graph paper.

## Shapes

The system implements a **Soft (Level 1)** geometry (`0.25rem` / `4px` base border-radius).

### Geometric Rationale
Soft corners balance mechanical precision with modern software ergonomics:
- **Base Components (Inputs, Buttons, Badges, Tabs)**: `0.25rem` (`4px`). Retains crisp instrument feel without sharp needles.
- **Cards & Data Viewports**: `rounded-lg` (`0.5rem` / `8px`). Softens large structural containers while preserving alignment with graph axes.
- **Modals & Flyouts**: `rounded-xl` (`0.75rem` / `12px`).
- **Graph Nodes & Stepper Points**: Exact circles (`50%` radius) reserved only for dynamic focal points, pivot joints, and roller axis indicators.

## Components

### Buttons
- **Primary (Run / Engage)**: Solid `#16322F` background with `#FFFFFF` text. 1px border of `#16322F`. On hover: background `#1F433F`. Focus-visible: 2px ring of `#C9A24B` with 2px offset.
- **Secondary (Calibrate / Zero)**: `#FFFFFF` background with `#16322F` text and 1px border of `#16322F`. Hover: `#EEF2EF`.
- **Tertiary / Utility**: Ghost appearance, transparent background, `#4A6460` text. Hover: `#F7F8F5` surface with `#16322F` text.
- **Destructive (Abort / E-Stop)**: `#C73A32` background with `#FFFFFF` text. Micro-beveled corners (`4px`), high-contrast focus rings.

### Cards & Panels
- **Telemetry Card**: Pure white background (`#FFFFFF`), bounded by 1px solid `#D9E1DC`. Header contains a monospaced identifier (e.g., `[ROLL-01]`) in `#8A6A1F` alongside the module title in `Space Grotesk`.
- **Graph Plotter Panel**: Pure white canvas with embedded Cartesian gridlines drawn using `#E6ECE8`. Crosshairs track using `#16322F` hairlines with gold coordinate badges (`#C9A24B` background, `#FFFFFF` text).

### Form Controls & Inputs
- **Numeric Calibration Input**: `#FFFFFF` background, 1px border `#D9E1DC`, typography `JetBrains Mono`. Integrated unit badge on the right in `#4A6460`. Active focus shifts border directly to `#16322F` with no blur.
- **Checkboxes & Radios**: 16px structural squares with 2px corner radius for checkboxes, 16px circles for radios. Unchecked: 1.5px stroke `#D9E1DC`. Checked: Solid `#16322F` fill with crisp white checkmark or inner dot.

### Chips & Status Badges
- **Status Indicator**: Pill or micro-box (`4px` radius) with `label-sm` font.
  - Active: `#EEF2EF` container with `#16322F` text and a 6px pulsing dot in `#1F8A5B`.
  - Calibrating: Light gold tint (`#FAF5EB`) container with `#8A6A1F` text and `#C9A24B` dot.
  - Error: Light red tint (`#FBEBEB`) with `#C73A32` text.

### Data Tables & Measurement Lists
- Hairline horizontal rows divided by 1px `#E6ECE8`.
- Alternating rows avoid heavy zebra striping; instead, use pure `#FFFFFF` alternating with `#F7F8F5`.
- Header row styled with `label-sm` in `#4A6460`, all caps, with tracking `0.04em`.

### Domain-Specific Components
- **Wedge Angle Goniometer**: Radial arc selector displaying angular wedge incline ($\theta$) in degrees with dynamic `#16322F` vector lines and `#C9A24B` target reference markers.
- **Roller Velocity Scrubber**: Horizontal range track with stepped intervals at 0.05 mm/s, utilizing a forest green slider handle and real-time monospace readout floating badge.