# FRONTEND SETTINGS SECTIONS KNOWLEDGE BASE

## OVERVIEW
`pages/settings/sections/` owns the rendered settings sections used by `../SettingsPage.tsx`. This folder covers the section-level UI for auth setup, audit and privacy, billing and currency, backup, retention and deletion, and timezone preferences, plus the nested `authentication/` and `billing-currency/` UI clusters.

## STRUCTURE
```
sections/
├── AuthenticationSection.tsx
├── AuditConfigurationSection.tsx
├── AuditConfigurationProviderToggles.tsx
├── AuditConfigurationRuleActions.tsx
├── AuditConfigurationRuleSection.tsx
├── AuditConfigurationRuleTable.tsx
├── BillingCurrencySection.tsx
├── BackupSection.tsx
├── RetentionDeletionSection.tsx
├── TimezoneSection.tsx
├── authentication/                # Auth status, setup grid, passkey cards, browser ceremony hook
└── billing-currency/              # Reporting currency card and FX mapping UI pieces
```

## WHERE TO LOOK

- Auth setup, verified-email prerequisites, and passkey UX: `AuthenticationSection.tsx`, `authentication/`
- Audit and privacy toggles, rule actions, and rule table rendering: `AuditConfigurationSection.tsx`, `AuditConfigurationProviderToggles.tsx`, `AuditConfigurationRuleActions.tsx`, `AuditConfigurationRuleSection.tsx`, `AuditConfigurationRuleTable.tsx`
- Billing and currency section shell that renders reporting currency and FX mapping UI: `BillingCurrencySection.tsx`, `billing-currency/`
- Backup and config import or export section: `BackupSection.tsx`
- Retention and deletion section: `RetentionDeletionSection.tsx`
- Timezone preference section: `TimezoneSection.tsx`
- Shared page shell, section IDs, and save-state helpers: `../AGENTS.md`, `../settingsPageHelpers.ts`, `../sectionSaveState.tsx`
- Costing bootstrap, derived state, and save logic that feeds billing and timezone sections: `../costing/AGENTS.md`

## LOCAL CLUSTERS

- `authentication/`: auth status cards, setup field shells, passkey metadata, and `usePasskeyManagement.ts`
- `billing-currency/`: `ReportingCurrencyCard.tsx`, `FxMappingForm.tsx`, `FxMappingsSummary.tsx`, and `FxMappingsTable.tsx`

## CONVENTIONS

- Keep these files focused on section rendering, local field composition, and section-specific copy.
- Let `authentication/` own browser passkey ceremony and credential presentation details.
- Let `billing-currency/` own the reporting-currency card and FX mapping presentation widgets.
- Pull bootstrap, dirty-state derivation, and save orchestration from the parent settings hooks instead of rebuilding that logic inside section components.
- Keep section IDs and save-state wiring aligned with the parent settings helpers.

## ANTI-PATTERNS

- Do not move auth setup or passkey browser logic out of `authentication/`.
- Do not move FX mapping CRUD state into `billing-currency/` presentation components. That boundary belongs to `../costing/`.
- Do not invent extra settings sections or nested AGENTS files beyond the two local clusters already covered here.
