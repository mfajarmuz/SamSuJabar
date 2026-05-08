# UI/UX Redesign — SamSuJabar Android App

**Date:** 2026-05-07  
**Scope:** Visual redesign of 3 existing screens (UploadScreen, RingkasanScreen, WhatsAppScreen)  
**Approach:** Card-based Redesign — Modern & Clean  
**Functional changes:** None. All logic, API calls, and navigation remain unchanged.

---

## 1. Design Foundation

### Color Palette
| Token | Value | Usage |
|---|---|---|
| Primary | `#1565C0` | Buttons, icons, accent (unchanged) |
| Primary Light | `#E3F2FD` | Drop zone background |
| Primary Medium | `#BBDEFB` | Borders, WP total box |
| Background | `#F4F6F9` | Screen background (was `#fff`) |
| Surface | `#FFFFFF` | Card background |
| Text Primary | `#1A1A2E` | Main text (was `#333`) |
| Text Secondary | `#616E7C` | Labels, captions (was `#666`) |
| Success | `#2E7D32` | Success banner, file badges |
| Success Light | `#E8F5E9` | Success banner background |
| WA Green | `#25D366` | WA button (unchanged) |
| WA Bubble | `#DCF8C6` | WA preview background |
| Warning | `#E65100` | Error box, total setoran text |
| Border | `#E2E8F0` | Row separators |

### Typography
| Role | Size | Weight | Notes |
|---|---|---|---|
| Stat Number | 32px | 800 | WP counts |
| Card Title | 11px | 700 | UPPERCASE, letterSpacing 1.2 |
| Body | 15px | 400 | Standard content |
| File Name | 13px | 400 | Truncated with numberOfLines=1 |
| Caption | 12px | 400 | Color: Text Secondary |
| Monospace Preview | 13.5px | 400 | WhatsApp preview text |

### Shadow/Elevation System
```
Card:   elevation 3, shadowColor '#000', shadowOffset {width:0, height:2},
        shadowOpacity 0.08, shadowRadius 8
Button: elevation 2
```

---

## 2. UploadScreen

**Background:** `#F4F6F9`

### Drop Zone Card
- Background: `#FFFFFF` (was `#E3F2FD`)
- Border: solid `1.5px #BBDEFB` (was dashed `#1565C0`)
- Border radius: 16px (was 12px)
- Shadow: Card elevation
- Icon: 📄 at 48px (unchanged)
- Title: "Pilih File PDF" — 16px, 600, `#1565C0`
- Subtitle: "SAM III-2 · Rekap Kasir · STS" — 12px, secondary color

### File Item Cards
- Background: `#FFFFFF`
- Border radius: 10px
- Shadow: Card elevation
- Left accent: `borderLeftWidth: 3` — color by type:
  - SAM → `#1565C0` (blue)
  - REKAP → `#2E7D32` (green)
  - STS → `#E65100` (orange)
- Type badge: small pill (paddingHorizontal 8, paddingVertical 2, borderRadius 10)
  - Extracted from filename: contains "SAM" → "SAM", "REKAP" → "REKAP", "STS" → "STS", else "PDF"
- File name: 13px, `#333`, numberOfLines=1
- Remove button: "✕" in `#B71C1C`

### Submit Button
- Background: `#1565C0`
- Height: 52px (was ~48px)
- Border radius: 12px
- Text: "Kirim ke Server" (remove `→` arrow)
- Disabled: `#90CAF9`

---

## 3. RingkasanScreen

**Background:** `#F4F6F9`

### Success Banner (replaces emoji header)
```
┌─────────────────────────────────────────────────────┐
│ ✓  Outlet Ciawi – Sukareja          │  tanggal text │
└─────────────────────────────────────────────────────┘
```
- Background: `#E8F5E9`
- Border radius: 12px
- Left border: `borderLeftWidth: 4, borderLeftColor: '#2E7D32'`
- Outlet name: 16px, 700, `#1B5E20`
- Tanggal: 13px, `#388E3C`
- Icon `✓`: 20px, `#2E7D32` (plain text character, no emoji)

### WP Card
- Card background: `#FFFFFF`, shadow
- R.2 and R.4 boxes side by side: background `#F0F7FF`, border radius 10
- Total WP box: full width, background `#BBDEFB`
- Stat numbers: 32px, 800 (was 28px)
- Labels: 11px, secondary color

### Penerimaan Card
- Card background: `#FFFFFF`, shadow
- Rows: paddingVertical 10 (was 8), separator `#E2E8F0`
- Total Setoran row:
  - Background: `#FFF8E1`
  - Border radius: 8px
  - Text: `#E65100`, 700, 15px
  - No separator line below

### WhatsApp Button
- Background: `#25D366` (unchanged)
- Height: 52px
- Border radius: 12px
- Text: "Buat Laporan WhatsApp" (remove 📱 emoji — use text only for cleanliness)

---

## 4. WhatsAppScreen

**Background:** `#F4F6F9`

### Section Label
- Text: "PREVIEW TEKS LAPORAN"
- 11px, 700, UPPERCASE, letterSpacing 1.2, color Text Secondary

### Preview Box
- Outer card: `#FFFFFF`, shadow, border radius 16px
- Inner scroll area: background `#DCF8C6` (WA bubble green), border radius 12px, padding 16
- Text: monospace, 13.5px, `#1B5E20`, lineHeight 22

### Action Buttons
- Row gap: 12px (unchanged)
- Height: 52px (was ~48px)
- Border radius: 12px
- Copy button: background `#455A64`
- WA button: background `#25D366`
- Text: 15px, 700, white

---

## 5. Implementation Notes

- All changes are style-only inside the 3 screen files
- File type badge extraction: simple `filename.toUpperCase().includes()` check
- No new dependencies required
- No navigation changes
- No API changes
- `App.js` header style can be updated: add `headerShadowVisible: true`
