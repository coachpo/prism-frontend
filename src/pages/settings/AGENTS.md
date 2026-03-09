# FRONTEND SETTINGS DOMAIN KNOWLEDGE BASE

## OVERVIEW
`pages/settings/` is the internal architecture behind `SettingsPage.tsx`: section navigation, save-state rendering, confirmation dialogs, auth setup, billing/timezone preferences, and retention/blocklist flows.

## STRUCTURE
```
settings/
├── sections/                    # Feature sections rendered by SettingsPage
├── dialogs/                     # Destructive and rule-edit dialogs
├── useSettingsSectionNavigation.ts
├── sectionSaveState.tsx
├── settingsPageHelpers.ts
└── settingsSaveTypes.ts
```

## WHERE TO LOOK

- Section registry and anchors: `settingsPageHelpers.ts`
- Hash/scroll-driven section focus: `useSettingsSectionNavigation.ts`
- Section save-state badges/rendering: `sectionSaveState.tsx`
- Auth setup and verified-email flow: `sections/AuthenticationSection.tsx`
- Audit/blocklist UI: `sections/AuditConfigurationSection.tsx`, `dialogs/RuleDialog.tsx`, `dialogs/DeleteRuleConfirmDialog.tsx`
- Billing + timezone preferences: `sections/BillingCurrencySection.tsx`, `sections/TimezoneSection.tsx`
- Backup/import/export and destructive retention flows: `sections/BackupSection.tsx`, `sections/RetentionDeletionSection.tsx`, `dialogs/DeleteConfirmDialog.tsx`

## CONVENTIONS

- Keep new settings features sectionized; extend `sections/` and helper registries instead of inflating `SettingsPage.tsx` further.
- Hash navigation is part of the UX contract; new sections need stable IDs and should participate in scroll/active-section logic.
- Destructive flows require dedicated confirmation copy and dialog components.
- Auth settings are global-instance concerns even though most settings UI is profile-scoped; keep that distinction clear in copy and save behavior.

## ANTI-PATTERNS

- Do not add inline modal state branches to `SettingsPage.tsx` when a local dialog/helper file fits.
- Do not bypass section save-state helpers with ad hoc spinners or toast-only feedback.
- Do not hide auth/recovery-email prerequisites when toggling authentication on.
