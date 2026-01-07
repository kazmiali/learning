# React in Production: Operations, DX, and Senior Q&A

> “Systems fail at their seams. Your job is to know every seam.” — Charity Majors

Shipping React apps as a senior engineer means thinking beyond components: deployments, observability, accessibility, security, and team workflows. This guide ties the pieces together so you can defend decisions under scrutiny.

---

## Deployment Architectures

| Approach | Description | Pros | Cons |
|----------|-------------|------|------|
| Static SPA (Vite/CRA) | Build to static assets, serve via CDN. | Simple, cheap, great cacheability. | No SSR/SEO, slower first paint on slow connections. |
| SSR (Next.js, Remix, custom) | Server renders HTML per request. | SEO, faster TTFB, data hydration. | Requires server/runtime, more ops complexity. |
| SSG + Revalidation | Pre-rendered pages with incremental updates. | Fast + SEO, hybrid SSR for dynamic routes. | Works best with mostly static content. |
| Islands / Partial Hydration | Render HTML server-side, hydrate components individually. | Less JS shipped, better perf. | Tooling immature, complex mental model. |

**Senior call:** Choose architecture per route. Marketing pages may be SSG; dashboard pages CSR with Suspense streaming.

---

## Production Checklist

1. **CI/CD Pipeline**
   - Lint, type-check, test, build on every PR.
   - Preview deployments for product QA (Vercel, Netlify, custom).
2. **Feature Flags**
   - Use LaunchDarkly, Statsig, or homegrown system.
   - Flags should be typed, time-boxed, and removable.
3. **Env Management**
   - `.env` for local, secrets in vaults (AWS Parameter Store, Doppler).
   - Document required env vars; fail fast if missing.
4. **Security Posture**
   - CSP headers, XSS protections, dependency scanning (Dependabot, Snyk).
   - Avoid embedding secrets in client bundles (use proxy/API).
5. **Accessibility**
   - Automated checks (axe-core) + manual keyboard and screen-reader passes.

---

## Observability & Incident Response

### Metrics to Monitor

| Category | Examples |
|----------|----------|
| Performance | Core Web Vitals (LCP, CLS, INP), bundle size, long tasks. |
| Reliability | Error rate (client & server), action success rate, Suspense fallbacks frequency. |
| Engagement | Conversion funnels, feature adoption, retention. |

### Tooling

- **Logging:** Sentry, LogRocket, Datadog RUM.
- **Metrics:** New Relic, Datadog, Grafana with custom events.
- **Tracing:** OpenTelemetry to correlate frontend spans with backend services.

Establish runbooks:

1. Detection (alert triggers).
2. Triage (severity, affected users).
3. Mitigation (feature flag off, rollback).
4. Postmortem (root cause, prevention).

---

## Error Boundaries & Recovery UI

```jsx
class AppErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    logError(error, info);
  }
  render() {
    if (this.state.hasError) {
      return <Fallback />;
    }
    return this.props.children;
  }
}
```

- Scope boundaries around risky regions (dashboard widgets, 3rd-party embeds).
- Provide recovery actions (retry, reload, contact support).
- Pair with Suspense boundaries so loading vs error states are distinct.

---

## Accessibility (A11y) Discipline

1. **Semantics:** Use native elements first (buttons, links).
2. **Focus Management:** After navigation or Suspense resolution, send focus to meaningful elements.
3. **Color Contrast:** Meet WCAG AA minimum (4.5:1 text contrast).
4. **Keyboard Support:** All interactive elements reachable via Tab/Shift+Tab, with visible focus states.
5. **Testing:** Use axe DevTools, NVDA/VoiceOver screen readers, and manual keyboard walkthroughs.

Accessibility isn’t optional in production—it’s a legal and ethical requirement.

---

## Security Practices

1. **Input Sanitization:** Escape user-generated HTML; use libraries like DOMPurify.
2. **CSP & Trusted Types:** Enforce strict CSP headers to block inline scripts; adopt Trusted Types to prevent DOM XSS sinks.
3. **Dependency Hygiene:** Run `npm audit`, use automated PRs for patches, but regression-test before merging.
4. **Auth Tokens:** Store in HTTP-only cookies when possible; avoid localStorage for sensitive tokens.
5. **Secrets in Build:** Never hardcode API keys; use server proxies or edge functions to keep secrets off the client.

---

## Internationalization (i18n)

- Plan for translations early: wrap strings in i18n calls.
- Consider RTL layout support (CSS logical properties, dir attributes).
- Lazy-load locale bundles to keep default bundle lean.
- Use ICU message format for pluralization, gender, currency.

---

## Team Workflows

1. **Code Reviews:** Enforce architecture decisions (state placement, API usage).
2. **Design Systems:** Adopt component libraries (Storybook, Ladle) with documented tokens.
3. **Docs & ADRs:** Record decisions (why Suspense, why React Query). Future you will thank current you.
4. **Pairing & Knowledge Sharing:** Run architecture reviews; rotate on-call duties for frontend incidents.

---

## Senior Interview Prompts

| Prompt | Talking Points |
|--------|----------------|
| “How do you handle rollbacks?” | Immutable builds, versioned deployments, feature flags to disable features without redeploy, maintain database migrations reversible. |
| “Explain your monitoring setup.” | Web Vitals instrumentation, error boundaries wired to Sentry, dashboards for release health, alerts on unusual transitions rate or error spikes. |
| “How do you ensure accessibility?” | Automated linting, CI checks, manual audits per feature, focus management guidelines, training for engineers and designers. |
| “Describe your approach to CSP.” | Default-src 'self'; script-src with nonces; use Trusted Types for frameworks; monitor report-uri for violations. |

---

## Production Ready Checklist

- [ ] CI verifies lint, types, tests, bundle size budgets.
- [ ] Feature flags guard risky releases; kill switches documented.
- [ ] Observability pipeline collects errors, metrics, and traces with dashboards.
- [ ] Accessibility and security scans run in CI/CD.
- [ ] Rollback procedures rehearsed; runbooks accessible.
- [ ] ADRs and docs keep the team aligned on architecture decisions.

Own these operational details and you’ll be the calm voice during incidents and the architect trusted with the most critical features.
