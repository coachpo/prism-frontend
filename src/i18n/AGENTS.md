# FRONTEND I18N KNOWLEDGE BASE

## OVERVIEW
`src/i18n/` owns Prism's frontend-only locale boundary: locale selection, persistence, message catalogs, and shared formatting helpers for numbers, timestamps, relative time, and collation.

## STRUCTURE
```
i18n/
├── AGENTS.md            # This file: locale ownership boundary
├── LocaleProvider.tsx   # Runtime locale state + document.lang synchronization
├── locale-context.ts    # Shared React context contract
├── useLocale.ts         # Consumer hook exposing locale, messages, and format helpers
├── format.ts            # Locale helpers for Intl formatting and collation
└── messages/
    ├── en.ts
    └── zh-CN.ts
```

## WHERE TO LOOK

- Provider mount point: `../main.tsx`
- Public auth + protected shell consumers: `../App.tsx`, `../components/GlobalPreferencesControls.tsx`, `../components/LanguageSwitcher.tsx`
- Shared formatting consumers: `../hooks/useTimezone.ts`, `../lib/timezone.ts`, `../lib/costing.ts`, and the page-level route helpers under `../pages/`

## CONVENTIONS

- Keep locale selection frontend-only. Do not introduce backend persistence or profile-scoped locale state.
- Keep `document.documentElement.lang` synchronized through `LocaleProvider.tsx`.
- Add new user-facing strings to the message catalogs, not inline component literals, when they belong to a reusable route or shared component boundary.
- Route shared formatting through `format.ts` or `useLocale()` instead of scattering ad hoc `Intl.*` usage through page components.

## ANTI-PATTERNS

- Do not bypass `useLocale()` for shared visible copy in shell- or route-level components.
- Do not introduce another locale store outside `LocaleProvider.tsx`.
- Do not duplicate number/date/relative-time formatting helpers in page folders when `format.ts` already owns that concern.
