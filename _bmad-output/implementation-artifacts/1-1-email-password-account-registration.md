# Story 1.1: Email/Password Account Registration

Status: ready-for-dev

## Story

As a visitor,
I want to create an account with email, password, and age confirmation,
so that I can access MinuteXMinute as a coach or player.

## Acceptance Criteria

1. **Happy path:** Given valid email, password ≥8 chars, and checked age gate → Supabase account created, redirected to `/coach/dashboard`
2. **Age gate blocked:** Given unchecked age gate on submission → inline error "You must be 13 or older to create an account", form not submitted
3. **Duplicate email:** Given already-registered email → inline error "Email already in use. Try signing in.", no account created
4. **End-to-end JWT chain:** Given a valid Supabase JWT from a new account → `.NET` `[Authorize]` endpoint at `/api/auth/me` returns 200, confirming Supabase → .NET auth chain is operational

## Tasks / Subtasks

- [ ] Task 1: Backend JWT infrastructure (AC: #4)
  - [ ] Add `Microsoft.AspNetCore.Authentication.JwtBearer 9.0.x` to `Backend.csproj`
  - [ ] Update `Program.cs`: JWT auth config, `AddProblemDetails()`, CORS for both ports
  - [ ] Add `SUPABASE_JWT_SECRET` env var to `docker-compose.yml` backend service
  - [ ] Create `Controllers/AuthController.cs` with `[Authorize]` GET `/api/auth/me` endpoint
- [ ] Task 2: Next.js project infrastructure (AC: #1, #4)
  - [ ] Add API proxy rewrites to `next.config.ts`
  - [ ] Create `src/lib/supabase/client.ts` (browser client)
  - [ ] Create `src/lib/supabase/server.ts` (server client)
  - [ ] Create `src/lib/api.ts` (`apiFetch<T>` wrapper)
  - [ ] Create `src/app/providers.tsx` (React Query client provider)
  - [ ] Update `src/app/layout.tsx` to wrap with `<Providers>`
  - [ ] Add MxM design tokens to `src/app/globals.css`
  - [ ] Install shadcn/ui components: `npx shadcn add button input checkbox form label`
- [ ] Task 3: Auth feature (AC: #1, #2, #3)
  - [ ] Create `src/features/auth/types.ts`
  - [ ] Create `src/features/auth/hooks/useAuth.ts`
  - [ ] Create `src/features/auth/components/age-gate-checkbox.tsx`
  - [ ] Create `src/features/auth/components/signup-form.tsx` (React Hook Form)
  - [ ] Create `src/app/(auth)/layout.tsx` (public, no auth guard)
  - [ ] Create `src/app/(auth)/signup/page.tsx` (server component wrapping signup-form)
- [ ] Task 4: Environment setup and validation (AC: #4)
  - [ ] Verify `.env.local` is in `.gitignore` BEFORE first commit (critical)
  - [ ] Create `frontend/.env.local` with Supabase URL + anon key
  - [ ] Create `.env` at project root with `SUPABASE_JWT_SECRET` (not committed)
  - [ ] Verify `.env` is in root `.gitignore`
  - [ ] End-to-end test: signup → call `/api/auth/me` with JWT → confirm 200

## Dev Notes

**⚠️ FOUNDATIONAL STORY:** This story establishes infrastructure all subsequent stories depend on. Take time to get the patterns right — they propagate everywhere.

### Pre-Implementation Checklist (do BEFORE writing code)

1. Add `.env.local` to `frontend/.gitignore` — verify it's there
2. Add `.env` to root `.gitignore` — verify it's there
3. Get Supabase JWT secret from: Supabase Dashboard → Project Settings → API → JWT Secret (NOT the anon key)
4. Get Supabase URL and anon key from: Supabase Dashboard → Project Settings → API

### Backend Changes

**`Backend.csproj` — add package:**
```xml
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="9.0.x" />
```
Install via: `docker exec -it sports-backend dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer`

**`Program.cs` — complete required changes:**
```csharp
// Add BEFORE builder.Build():
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => {
        options.TokenValidationParameters = new TokenValidationParameters {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["SUPABASE_JWT_SECRET"]!)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddProblemDetails(); // RFC 7807 error format

// Fix CORS — MUST include BOTH ports:
options.AddPolicy("AllowFrontend", policy =>
    policy.WithOrigins("http://localhost:3000", "http://localhost:4200")
          .AllowAnyHeader()
          .AllowAnyMethod());

// Add AFTER builder.Build() in correct ORDER (authentication before authorization):
app.UseCors("AllowFrontend");
app.UseAuthentication();  // MUST come before UseAuthorization
app.UseAuthorization();
app.MapControllers();
```

**`docker-compose.yml` — add env var to backend service:**
```yaml
backend:
  environment:
    ASPNETCORE_URLS: http://+:8080
    ASPNETCORE_ENVIRONMENT: Development
    SUPABASE_JWT_SECRET: ${SUPABASE_JWT_SECRET}  # read from root .env file
```
Create `.env` at project root: `SUPABASE_JWT_SECRET=your-jwt-secret-here`

**`Controllers/AuthController.cs` — AC4 validation endpoint:**
```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    [HttpGet("me")]
    [Authorize]
    public IActionResult GetMe()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub");
        var email  = User.FindFirstValue(ClaimTypes.Email)
                     ?? User.FindFirstValue("email");
        return Ok(new { sub = userId, email });
    }
}
```

### Frontend Infrastructure

**`next.config.ts` — API proxy rewrites (REQUIRED — enables apiFetch to work):**
```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`
          : 'http://localhost:8080/api/:path*',
      },
    ]
  },
}

export default nextConfig
```

**`src/lib/supabase/client.ts`:**
```ts
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
```

**`src/lib/supabase/server.ts`:**
```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = async () => {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options))
        },
      },
    }
  )
}
```

**`src/lib/api.ts` — ALL future API calls use this, never raw `fetch('/api/...')`:**
```ts
import { createClient } from '@/lib/supabase/client'

export class ApiError extends Error {
  constructor(public status: number, public detail: string) {
    super(detail)
    this.name = 'ApiError'
  }
}

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {}),
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new ApiError(res.status, err.detail ?? 'Request failed')
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
```

**`src/app/providers.tsx`:**
```ts
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 60 * 1000 } },
  }))
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
```

**`src/app/layout.tsx` — wrap children with Providers:**
```ts
import { Providers } from '@/app/providers'
// wrap children: <Providers>{children}</Providers>
```

### Design Tokens — Add to `globals.css`

**Dark mode is CLASS-BASED** — Tailwind's `darkMode: 'class'` strategy. Default (`:root`) is light mode; `.dark` class on `<html>` activates dark mode. Dark mode is the PRIMARY design surface — add `.dark` to `<html>` by default until a theme toggle is built (Story 1.6).

**⚠️ Do NOT use `@media (prefers-color-scheme)` — this app uses class-based dark mode only.**

Tailwind 4 CSS-native config (no `tailwind.config.js`). Add to `globals.css`:

```css
/* Light mode (default :root) */
:root {
  --mx-bg:          255 255 255;
  --mx-surface:     245 247 250;
  --mx-surface-2:   236 240 246;
  --mx-text:         12  18  28;
  --mx-muted:        92 106 115;
  --mx-stroke:       14  20  28;
  --mx-stroke-soft:  14  20  28 / 0.35;

  /* Identical in both modes */
  --mx-green:       166 214  74;
  --mx-teal:         70 183 166;
  --mx-amber:       214 158  74;
  --mx-red:         200  80  80;
}

/* Dark mode (class-based) — PRIMARY design surface */
.dark {
  --mx-bg:          11  15  20;
  --mx-surface:     16  23  34;
  --mx-surface-2:   22  33  48;
  --mx-text:       234 240 247;
  --mx-muted:      167 179 194;
  --mx-stroke:     234 240 247;
  --mx-stroke-soft: 234 240 247 / 0.25;
}
```

Add Tailwind `@theme` block so `bg-mx-surface`, `text-mx-green`, etc. work as utility classes:

```css
@theme {
  --color-mx-bg:          rgb(var(--mx-bg));
  --color-mx-surface:     rgb(var(--mx-surface));
  --color-mx-surface-2:   rgb(var(--mx-surface-2));
  --color-mx-text:        rgb(var(--mx-text));
  --color-mx-muted:       rgb(var(--mx-muted));
  --color-mx-green:       rgb(var(--mx-green));
  --color-mx-teal:        rgb(var(--mx-teal));
  --color-mx-amber:       rgb(var(--mx-amber));
  --color-mx-red:         rgb(var(--mx-red));
  --color-mx-stroke:      rgb(var(--mx-stroke));
  --color-mx-stroke-soft: rgb(var(--mx-stroke-soft));
}
```

Usage: `bg-mx-surface`, `text-mx-green`, `border-mx-stroke-soft` — prefer these over `bg-[rgb(var(--mx-bg))]` arbitrary values.

### shadcn/ui Installation

```bash
cd frontend
npx shadcn add button input checkbox form label
```
Components land in `src/components/ui/` — never manually edit these files.

### Feature Directory Structure

```
src/features/auth/
├── components/
│   ├── signup-form.tsx          # 'use client' — React Hook Form + Supabase signup
│   └── age-gate-checkbox.tsx   # 'use client' — controlled checkbox component
├── hooks/
│   └── useAuth.ts              # signup, future: signin, signout
└── types.ts                    # SignupFormValues, AuthUser
```

### Signup Form Rules (UX Spec)

- **Error handling:** Inline ONLY — error text below offending field (`text-[rgb(var(--mx-red))]`). NO toasts for form errors.
- **Age gate disclaimer** (above checkbox): *"MinuteXMinute is currently available to users 13 and older. Players under 13 can access practice content via a share link from their coach."*
- **Age gate error:** "You must be 13 or older to create an account"
- **Duplicate email error:** "Email already in use. Try signing in."
- **Password validation:** Minimum 8 characters, validate client-side with React Hook Form
- **Primary CTA:** `bg-[rgb(var(--mx-green))] text-black` (green on dark surface)
- **Focus rings:** `focus-visible:ring-2 focus-visible:ring-[rgb(var(--mx-teal))]`
- **Touch targets:** Minimum 44×44px on all interactive elements
- **After success:** `router.push('/coach/dashboard')` — route doesn't exist yet (built in Story 1.6), that's expected

### Supabase `signUp` Behavior Notes

- Supabase may have email confirmation enabled by default. If so, user won't get a session immediately — they'll need to confirm their email first.
- For development/testing, disable email confirmation in Supabase Dashboard → Authentication → Settings → "Enable email confirmations" OFF.
- `supabase.auth.signUp()` returns `{ data: { user, session }, error }`.
  - `error?.message === 'User already registered'` → show "Email already in use" error
  - `data.session` is null if email confirmation required → show "Check your email to confirm"
  - Redirect only when `data.session` exists (no email confirmation) OR after email confirmed

### `useAuth.ts` Pattern

```ts
'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const router = useRouter()
  const supabase = createClient()

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    if (data.session) router.push('/coach/dashboard')
    return data
  }

  return { signUp }
}
```

### AC4 Test Method

After signup, manually verify the JWT chain:
1. Get access token: `supabase.auth.getSession()` → `data.session.access_token`
2. Call: `apiFetch<{ sub: string; email: string }>('/api/auth/me')`
3. Expect: 200 with user sub and email from JWT claims
4. If 401: JWT secret mismatch — double-check `SUPABASE_JWT_SECRET` value

### Logo / Brand Assets

PWA icons are in `frontend/public/` — use these on the signup page:

| File | Use |
|---|---|
| `icon-512x512.png` | Signup/login page logo (recommend ~48px height) |
| `icon-192x192.png` | PWA manifest `icons` array |
| `icon-180x180.png` | Apple touch icon (`<link rel="apple-touch-icon">` in layout) |
| `icon-32x32.png` | Favicon (replace existing `src/app/favicon.ico`) |
| `icon-1024x1024.png` | Source/master — do not use directly in UI |

On the signup page, render the logo above the form using Next.js `<Image>`:
```tsx
<Image src="/icon-512x512.png" alt="MinuteXMinute" width={48} height={48} priority />
```

### Anti-Patterns — DO NOT DO

- `fetch('/api/auth/me')` directly — use `apiFetch<T>` ALWAYS
- Relative imports like `../../lib/api` — use `@/lib/api` ALWAYS
- JWT secret in `appsettings.json` — environment variable ONLY
- Making `signup-form.tsx` a server component — uses React Hook Form, MUST be `'use client'`
- `app.UseAuthorization()` before `app.UseAuthentication()` — order is critical, breaks auth
- `console.log` in committed code

### Project Structure Notes

- `(auth)/` route group: public routes, NO auth guard
- `middleware.ts` NOT created in this story — Story 1.4
- `(coach)/` and `(player)/` route groups NOT created — Stories 1.4 and 1.6
- `/coach/dashboard` redirect target won't exist until Story 1.6 — that's expected

### References

- [Source: docs/design-system-shadcn-tailwind-styles.md] — canonical token values, utility class names
- [Source: docs/design-system-ui-translation-rules.md] — component rules, radius scale, shadow rules
- [Source: docs/brand-icon-production-spec.md] — icon assets, brand non-negotiables
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication-&-Security]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns-&-Consistency-Rules]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend-Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Complete-Project-Directory-Structure]
- [Source: _bmad-output/planning-artifacts/architecture.md#API-&-Communication-Patterns]
- [Source: _bmad-output/planning-artifacts/prd.md#Functional-Requirements] — FR1, FR5
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.1]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design-Tokens]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Accessibility-Strategy]
- [Source: CLAUDE.md#Architecture]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
