# FRONTEND I18N KNOWLEDGE BASE

## OVERVIEW
`src/i18n/` owns Prism's frontend-only locale boundary, including locale selection, persistence, catalogs, and shared formatting helpers.

## STRUCTURE
```
i18n/
├── LocaleProvider.tsx   # Runtime locale state and document.lang sync
├── locale-context.ts    # Shared React context contract
├── useLocale.ts         # Locale, messages, and format helper hook
├── format.ts            # Intl helpers for formatting and collation
└── messages/
    ├── en.ts
    └── zh-CN.ts
```

## WHERE TO LOOK

- Provider mount point: `../main.tsx`
- Shell and route consumers: `../App.tsx`, `../components/GlobalPreferencesControls.tsx`, `../components/LanguageSwitcher.tsx`
- Shared formatting consumers: `../hooks/useTimezone.ts`, `../lib/timezone.ts`, `../lib/costing.ts`, and page helpers under `../pages/`

## CONVENTIONS

- Keep locale selection frontend-only.
- Keep `document.documentElement.lang` synchronized through `LocaleProvider.tsx`.
- Add new user-facing strings to the catalogs when they belong to reusable shell or route surfaces.
- Route shared formatting through `format.ts` or `useLocale()` instead of ad hoc `Intl.*` usage.

## ANTI-PATTERNS

- Do not bypass `useLocale()` for shared visible copy.
- Do not introduce another locale store outside `LocaleProvider.tsx`.
- Do not duplicate number, date, or relative-time helpers in page folders when `format.ts` already owns them.
