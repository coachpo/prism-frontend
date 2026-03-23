# FRONTEND SETTINGS DOMAIN KNOWLEDGE BASE

## OVERVIEW
`pages/settings/` is the route-domain shell behind `../SettingsPage.tsx`. It owns section navigation, stable section IDs, hash-driven focus, shared save-state rendering, and delegation into the local `sections/`, `costing/`, and `dialogs/` clusters.

## STRUCTURE
```
settings/
├── sections/                      # Rendered settings sections and local section clusters
├── costing/                       # Costing bootstrap, derived state, FX mapping CRUD, save flows
├── dialogs/                       # Destructive and rule-edit dialogs
├── SettingsSectionsNav.tsx        # Sticky section navigation UI
├── useSettingsPageData.ts         # Top-level page composition
├── useSettingsSectionNavigation.ts
├── useAuthenticationSettingsData.ts
├── useCostingSettingsData.ts
├── useAuditConfigurationData.ts
├── useConfigBackupData.ts
├── useRetentionDeletionData.ts
├── sectionSaveState.tsx
├── settingsPageHelpers.ts
└── settingsSaveTypes.ts
```

## WHERE TO LOOK

- Thin route shell and section ordering: `../SettingsPage.tsx`, `useSettingsPageData.ts`
- Stable section IDs, labels, tab split, and default costing helpers: `settingsPageHelpers.ts`
- Hash and scroll-driven active-section behavior: `useSettingsSectionNavigation.ts`, `SettingsSectionsNav.tsx`
- Shared save-state badges and render helpers: `sectionSaveState.tsx`, `settingsSaveTypes.ts`
- Section implementation boundary: `sections/AGENTS.md`
- Costing bootstrap, derived state, FX mapping CRUD, and save boundary: `costing/AGENTS.md`
- Destructive confirmation dialogs and audit rule dialogs: `dialogs/`, `useAuditConfigurationData.ts`, `useRetentionDeletionData.ts`, `useConfigBackupData.ts`

## CHILD DOCS

- `sections/AGENTS.md`: auth setup, audit and privacy, billing and currency UI, backup, retention, timezone, and the nested `authentication/` and `billing-currency/` clusters.
- `costing/AGENTS.md`: costing bootstrap, dirty-state derivation, FX mapping CRUD, save flows, and the boundary between costing hooks and billing-currency UI.

## CONVENTIONS

- Keep new settings work sectionized. Extend `sections/` and helper registries instead of inflating `SettingsPage.tsx`.
- Hash navigation is part of the UX contract. New sections need stable IDs and must participate in scroll and active-section logic.
- Save-state feedback belongs in the shared helpers, not ad hoc local spinners.
- Auth settings are instance-level concerns. Most other settings stay profile-scoped. Keep that distinction clear in copy and save behavior.
- Billing, reporting currency, FX mappings, and timezone preferences span both `sections/` and `costing/`. Let the page shell delegate instead of duplicating that boundary here.
- Backup and import/export copy should stay aligned with profile-targeted `version: 2` replace-style config import/export.

## ANTI-PATTERNS

- Do not add inline modal-state branches to `SettingsPage.tsx` when a local dialog or helper file fits.
- Do not bypass section save-state helpers with ad hoc spinners or toast-only feedback.
- Do not duplicate auth setup or FX mapping details here when `sections/AGENTS.md` and `costing/AGENTS.md` already own those local boundaries.
