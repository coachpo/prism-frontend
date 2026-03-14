# FRONTEND SETTINGS DOMAIN KNOWLEDGE BASE

## OVERVIEW
`pages/settings/` is the internal architecture behind `../SettingsPage.tsx`: section navigation, save-state rendering, confirmation dialogs, auth setup, billing and timezone preferences, and retention and blocklist flows.

## STRUCTURE
```
settings/
├── sections/                      # Feature sections rendered by SettingsPage
│   ├── authentication/            # Passkey cards, setup grid, metadata, hook
│   └── billing-currency/          # FX mapping cards, table, reporting currency UI
├── costing/                       # Costing settings bootstrap/save/derived-state hooks
├── dialogs/                       # Destructive and rule-edit dialogs
├── SettingsSectionsNav.tsx        # Sticky section navigation UI
├── useAuditConfigurationData.ts
├── useConfigBackupData.ts
├── useRetentionDeletionData.ts
├── useSettingsPageData.ts
├── useSettingsSectionNavigation.ts
├── sectionSaveState.tsx
├── settingsPageHelpers.ts
└── settingsSaveTypes.ts
```

## WHERE TO LOOK

- Section registry, labels, and stable section IDs: `settingsPageHelpers.ts`, `SettingsSectionsNav.tsx`
- Hash and scroll-driven section focus: `useSettingsSectionNavigation.ts`
- Section save-state badges and render helpers: `sectionSaveState.tsx`, `settingsSaveTypes.ts`
- Auth setup, verified-email flow, and passkey management: `sections/AuthenticationSection.tsx`, `sections/authentication/usePasskeyManagement.ts`
- Audit and blocklist UI: `sections/AuditConfigurationSection.tsx`, `dialogs/RuleDialog.tsx`, `dialogs/DeleteRuleConfirmDialog.tsx`
- Billing, reporting currency, FX mappings, and timezone preferences: `sections/BillingCurrencySection.tsx`, `sections/billing-currency/`, `costing/`, `sections/TimezoneSection.tsx`
- Backup, import/export, and destructive retention flows: `sections/BackupSection.tsx`, `sections/RetentionDeletionSection.tsx`, `dialogs/DeleteConfirmDialog.tsx`, `useConfigBackupData.ts`, `useRetentionDeletionData.ts`
- Audit rule orchestration: `useAuditConfigurationData.ts`, `sections/AuditConfigurationSection.tsx`
- Page bootstrap and per-section data hooks: `useSettingsPageData.ts`, `useAuthenticationSettingsData.ts`, `useCostingSettingsData.ts`

## CONVENTIONS

- Keep new settings features sectionized; extend `sections/` and helper registries instead of inflating `SettingsPage.tsx` further.
- Hash navigation is part of the UX contract; new sections need stable IDs and should participate in scroll and active-section logic.
- Save-state feedback belongs in the shared section save-state helpers, not ad hoc local spinners.
- Destructive flows require dedicated confirmation copy and dialog components.
- Auth settings are global-instance concerns even though most settings UI is profile-scoped; keep that distinction clear in copy and save behavior.
- FX mappings, reporting currency, and costing save flows belong in `costing/` plus `sections/billing-currency/` instead of inline section state.
- Backup/import UI fronts profile-targeted `version: 2` replace-style config import/export; do not describe it as a generic merge or whole-system restore.

## ANTI-PATTERNS

- Do not add inline modal-state branches to `SettingsPage.tsx` when a local dialog or helper file fits.
- Do not bypass section save-state helpers with ad hoc spinners or toast-only feedback.
- Do not hide auth or recovery-email prerequisites when toggling authentication on.
- Do not duplicate passkey browser ceremony or credential formatting outside `sections/authentication/usePasskeyManagement.ts` and its helper files.
