# FRONTEND SETTINGS DOMAIN KNOWLEDGE BASE

## OVERVIEW
`pages/settings/` is the internal architecture behind `../SettingsPage.tsx`: section navigation, save-state rendering, confirmation dialogs, auth setup, billing and timezone preferences, and retention and blocklist flows.

## STRUCTURE
```
settings/
├── sections/                    # Feature sections rendered by SettingsPage
├── dialogs/                     # Destructive and rule-edit dialogs
├── SettingsSectionsNav.tsx      # Sticky section navigation UI
├── useSettingsSectionNavigation.ts
├── sectionSaveState.tsx
├── settingsPageHelpers.ts
└── settingsSaveTypes.ts
```

## WHERE TO LOOK

- Section registry, labels, and stable section IDs: `settingsPageHelpers.ts`, `SettingsSectionsNav.tsx`
- Hash and scroll-driven section focus: `useSettingsSectionNavigation.ts`
- Section save-state badges and render helpers: `sectionSaveState.tsx`, `settingsSaveTypes.ts`
- Auth setup and verified-email flow: `sections/AuthenticationSection.tsx`
- Audit and blocklist UI: `sections/AuditConfigurationSection.tsx`, `dialogs/RuleDialog.tsx`, `dialogs/DeleteRuleConfirmDialog.tsx`
- Billing and timezone preferences: `sections/BillingCurrencySection.tsx`, `sections/TimezoneSection.tsx`
- Backup, import/export, and destructive retention flows: `sections/BackupSection.tsx`, `sections/RetentionDeletionSection.tsx`, `dialogs/DeleteConfirmDialog.tsx`

## CONVENTIONS

- Keep new settings features sectionized; extend `sections/` and helper registries instead of inflating `SettingsPage.tsx` further.
- Hash navigation is part of the UX contract; new sections need stable IDs and should participate in scroll and active-section logic.
- Save-state feedback belongs in the shared section save-state helpers, not ad hoc local spinners.
- Destructive flows require dedicated confirmation copy and dialog components.
- Auth settings are global-instance concerns even though most settings UI is profile-scoped; keep that distinction clear in copy and save behavior.

## ANTI-PATTERNS

- Do not add inline modal-state branches to `SettingsPage.tsx` when a local dialog or helper file fits.
- Do not bypass section save-state helpers with ad hoc spinners or toast-only feedback.
- Do not hide auth or recovery-email prerequisites when toggling authentication on.
