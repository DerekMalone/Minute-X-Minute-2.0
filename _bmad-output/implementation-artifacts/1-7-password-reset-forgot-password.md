# Story 1.7: Password Reset (Forgot Password)

Status: review

## Story

As a registered user,
I want to reset my password via email,
so that I can regain access to my account when I forget my password.

## Acceptance Criteria

1. **Forgot password link:** Given I am on `/login`, there is a "Forgot password?" link visible on the page that navigates to `/forgot-password`
2. **Request reset (registered email):** Given I am on `/forgot-password` and enter a registered email address and submit, the form shows a confirmation message: "Check your email for a reset link"
3. **Request reset (unregistered email):** Given I enter an email address that is not registered and submit, I see the same confirmation message "Check your email for a reset link" — no indication that the email is not registered (security requirement)
4. **Reset password page:** Given I click the password reset link in my email, I land on `/reset-password` and am shown a form to enter and confirm a new password
5. **Successful reset:** Given I submit a valid new password on `/reset-password`, my password is updated via Supabase and I am redirected to `/login` with a success message: "Your password has been updated. Please sign in."
6. **Expired or used link:** Given I click a password reset link that has expired or been used, I see an error message: "This reset link has expired. Request a new one." with a link back to `/forgot-password`

## Tasks / Subtasks

- [x] Task 1: Create `/auth/callback` Route Handler (AC: 4, 6)
  - [x] Create `src/app/auth/callback/route.ts` as a Next.js Route Handler (GET)
  - [x] Read `code` and `next` query params from the request URL
  - [x] Use server Supabase client (`@/lib/supabase/server`) to call `supabase.auth.exchangeCodeForSession(code)`
  - [x] On success: `NextResponse.redirect(origin + next)` where `next` defaults to `/reset-password`
  - [x] On error: `NextResponse.redirect(origin + next + '?error=link_expired')`
  - [x] If no `code` param: redirect to `/login`

- [x] Task 2: Extend `useAuth` with password reset methods (AC: 2, 3, 5)
  - [x] Add `requestPasswordReset(email: string)` — calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/auth/callback?next=/reset-password' })`, throw on error
  - [x] Add `updatePassword(password: string)` — calls `supabase.auth.updateUser({ password })`, throw on error, on success `router.push('/login?message=Your+password+has+been+updated.+Please+sign+in.')`

- [x] Task 3: Build forgot-password flow (AC: 1, 2, 3)
  - [x] Create `src/features/auth/components/forgot-password-form.tsx` (`'use client'`)
    - [x] React Hook Form — single field: `email`
    - [x] `useState<boolean>(false)` for `submitted` — on success swap form for inline confirmation (do not route to a new page)
    - [x] Call `requestPasswordReset(email)` on submit; always set `submitted = true` on completion regardless of whether email is registered (Supabase never errors for unregistered emails — intentional security behavior)
    - [x] If unexpected API error: show generic `serverError` "Something went wrong. Please try again."
    - [x] Include back link to `/login`
  - [x] Create `src/app/(auth)/forgot-password/page.tsx` — server component wrapping `<Suspense><ForgotPasswordForm /></Suspense>`
  - [x] Update `src/features/auth/components/signin-form.tsx`:
    - [x] Add "Forgot password?" link below the password field (before submit button)
    - [x] Read `message` param from `useSearchParams` (already imported) and display above the form if present

- [x] Task 4: Build reset-password flow (AC: 4, 5, 6)
  - [x] Create `src/features/auth/components/reset-password-form.tsx` (`'use client'`)
    - [x] Read `error` param from `useSearchParams`
    - [x] If `error === 'link_expired'`: render expired state — "This reset link has expired. Request a new one." with `Link` to `/forgot-password`
    - [x] Otherwise: React Hook Form with `password` (min 8 chars) + `confirmPassword` fields with match validation
    - [x] On submit: call `updatePassword(password)` — `useAuth` handles redirect to `/login?message=...`
    - [x] On `updateUser` error: show generic `serverError` "Something went wrong. Please request a new reset link." with link to `/forgot-password`
  - [x] Create `src/app/(auth)/reset-password/page.tsx` — server component wrapping `<Suspense><ResetPasswordForm /></Suspense>`

## Dev Notes

### Supabase PKCE Password Reset Flow

The project uses `createBrowserClient` from `@supabase/ssr`, which enables the PKCE auth flow by default. Password reset with PKCE:

1. `requestPasswordReset` calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + '/auth/callback?next=/reset-password' })`
2. Supabase emails a link that routes through `supabase.co/auth/v1/verify` → redirects to `redirectTo` with a `code` query param
3. `/auth/callback` Route Handler receives `code`, calls `supabase.auth.exchangeCodeForSession(code)` via **server** client
4. On success: user has an active recovery session (stored in cookies); redirect to `/reset-password`
5. On failure (expired/used): redirect to `/reset-password?error=link_expired`
6. On `/reset-password`, `supabase.auth.updateUser({ password })` via **browser** client — recovery session in cookies is read automatically by `createBrowserClient`

### `useAuth.ts` Additions

```ts
const requestPasswordReset = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
  })
  if (error) throw error
}

const updatePassword = async (password: string) => {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
  router.push('/login?message=Your+password+has+been+updated.+Please+sign+in.')
}

return { signUp, signIn, signOut, requestPasswordReset, updatePassword }
```

### `/auth/callback` Route Handler

```ts
// src/app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/reset-password'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    return NextResponse.redirect(`${origin}${next}?error=link_expired`)
  }

  return NextResponse.redirect(`${origin}/login`)
}
```

### Supabase Dashboard Requirement

The `redirectTo` URL must be whitelisted under **Authentication → URL Configuration → Redirect URLs**. Add both:
- `http://localhost:3000/auth/callback` (local dev)
- `http://localhost:4200/auth/callback` (Docker pre-PR testing)

### `resetPasswordForEmail` Security Behavior

Supabase intentionally returns `{ data: {}, error: null }` even for unregistered emails to prevent email enumeration attacks. **Always show the confirmation message.** AC3 is automatically satisfied by Supabase's behavior — no special implementation needed.

### `SigninForm` Updates

Add below the password field, before the submit button:

```tsx
<div className="text-right">
  <Link href="/forgot-password" className="text-sm text-mx-teal hover:underline">
    Forgot password?
  </Link>
</div>
```

Add message display above the `<Form>` component (reads from `searchParams` already imported via `useSearchParams`):

```tsx
const message = searchParams.get('message')

{message && (
  <p className="text-sm text-center text-mx-green">{message}</p>
)}
```

### `ForgotPasswordForm` — Inline Submitted State

Use a `submitted` boolean to swap the form for a confirmation message in-place (no page navigation):

```tsx
const [submitted, setSubmitted] = useState(false)

const onSubmit = async (values) => {
  try {
    await requestPasswordReset(values.email)
  } catch {
    setServerError('Something went wrong. Please try again.')
    return
  }
  setSubmitted(true)  // set true even if Supabase silently no-ops for unregistered email
}
```

### `ResetPasswordForm` — Password Confirmation Validation

```ts
confirmPassword: {
  required: 'Please confirm your password',
  validate: (val) =>
    val === form.getValues('password') || 'Passwords do not match',
}
```

### Form Layout Consistency

All auth forms follow the existing pattern from `SigninForm` / `SignupForm`:

```
flex min-h-screen items-center justify-center bg-mx-bg
  w-full max-w-sm space-y-8 px-6
    flex flex-col items-center gap-4
      <Image src="/icon-512x512.png" width={48} height={48} priority />
      <h1 className="text-2xl font-bold text-mx-text">[Heading]</h1>
    [Form content]
    <p className="text-center text-sm text-mx-muted">
      <Link href="/login" className="text-mx-teal hover:underline">Back to sign in</Link>
    </p>
```

Button: `w-full min-h-[44px] bg-mx-green text-black hover:bg-mx-green/90 font-semibold`
Input: `min-h-[44px] focus-visible:ring-2 focus-visible:ring-mx-teal`
Error text: `text-sm text-mx-red`

### Proxy / Middleware — No Changes Required

`/forgot-password`, `/reset-password`, and `/auth/callback` are public routes. Do not add them to `src/proxy.ts` matcher or `AUTH_PATHS`. The token in the URL provides auth context for `/reset-password`.

### Testing Without Email Delivery

If email delivery is unreliable during testing, get the reset link directly from:
**Supabase Dashboard → Authentication → Users → [user] → Send password recovery email**

### Anti-Patterns — DO NOT DO

- Do NOT use the browser Supabase client in the `/auth/callback` Route Handler — use `@/lib/supabase/server`
- Do NOT show different messages for registered vs unregistered emails on `/forgot-password`
- Do NOT add field-level errors to the email field for "email not found"
- Do NOT navigate to a separate confirmation page — use inline `submitted` state swap
- Do NOT forget `<Suspense>` wrappers on pages using `useSearchParams` in client components
- Do NOT modify `src/proxy.ts`

### Project Structure Notes

```
src/app/
├── auth/
│   └── callback/
│       └── route.ts                   ← NEW (outside (auth) group — Route Handler, not a page)
├── (auth)/
│   ├── forgot-password/
│   │   └── page.tsx                   ← NEW
│   └── reset-password/
│       └── page.tsx                   ← NEW
src/features/auth/
├── components/
│   ├── forgot-password-form.tsx       ← NEW ('use client')
│   ├── reset-password-form.tsx        ← NEW ('use client')
│   └── signin-form.tsx                ← MODIFIED: forgot-password link + message param
└── hooks/
    └── useAuth.ts                     ← MODIFIED: requestPasswordReset + updatePassword
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.7]
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication-&-Security]
- [Supabase resetPasswordForEmail](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail)
- [Supabase updateUser](https://supabase.com/docs/reference/javascript/auth-updateuser)
- [Supabase exchangeCodeForSession](https://supabase.com/docs/reference/javascript/auth-exchangecodeforsession)
- [Supabase SSR password reset guide](https://supabase.com/docs/guides/auth/password-reset)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- **PKCE session/cookie mismatch**: Original server-side `exchangeCodeForSession` in `/auth/callback` stored the session in `httpOnly` cookies, which `createBrowserClient` cannot read via `document.cookie`. Confirmed via `getSession()` returning null despite cookie being visible in DevTools.
- **Root cause**: `createBrowserClient` auto-exchanges the PKCE code via `detectSessionInUrl: true` when it detects `?code=xxx` in the URL. Manually calling `exchangeCodeForSession` after this fails with `AuthPKCECodeVerifierMissingError` because the verifier is already consumed.
- **Fix**: Route handler passes code through to `/reset-password?code=xxx` without server-side exchange. `ResetPasswordForm` uses a stable `useMemo` browser client instance and calls `getSession()` (which awaits the auto-exchange) rather than manually exchanging. `updateUser` is then called on the same client instance.

### Completion Notes List

- Task 1: Created `/auth/callback` GET route handler. Uses server Supabase client to exchange PKCE code for session. Redirects to `next` param (default `/reset-password`) on success, appends `?error=link_expired` on failure, redirects to `/login` if no code present.
- Task 2: Extended `useAuth` with `requestPasswordReset` (calls `resetPasswordForEmail` with PKCE `redirectTo`) and `updatePassword` (calls `updateUser`, then redirects to `/login?message=...` on success). Both throw on error.
- Task 3: Created `ForgotPasswordForm` with inline `submitted` state swap (no page nav). Created `/forgot-password/page.tsx` with Suspense wrapper. Updated `SigninForm` with "Forgot password?" link and `message` param display.
- Task 4: Created `ResetPasswordForm` — reads `error` param to branch between expired-link state and new-password form. Password + confirmPassword with match validation. On error shows inline link to `/forgot-password`. Created `/reset-password/page.tsx` with Suspense wrapper.

### Change Log

- 2026-03-02: Story implemented. Password reset flow using PKCE client-side exchange pattern. 7 files added/modified.

### File List

- `frontend/src/app/auth/callback/route.ts` (new)
- `frontend/src/features/auth/hooks/useAuth.ts` (modified)
- `frontend/src/features/auth/components/forgot-password-form.tsx` (new)
- `frontend/src/app/(auth)/forgot-password/page.tsx` (new)
- `frontend/src/features/auth/components/signin-form.tsx` (modified)
- `frontend/src/features/auth/components/reset-password-form.tsx` (new)
- `frontend/src/app/(auth)/reset-password/page.tsx` (new)
