# Story 1.3: Sign-In and Sign-Out

Status: done

## Story

As a registered user,
I want to sign in to my account and sign out when I am done,
so that my data is protected and I control my session.

## Acceptance Criteria

1. **Happy path:** Given I am on /login and enter my registered email and correct password → submit → signed in and redirected to `/coach/dashboard`
2. **Wrong credentials:** Given I enter incorrect credentials → "Invalid email or password" displayed, remain on /login — no indication of which field is wrong
3. **Sign out:** Given I am signed in and click "Sign Out" → Supabase session cleared, local state reset, redirected to /login
4. **Session auto-refresh:** Supabase client handles token refresh automatically — no explicit implementation needed

> **Note:** "Continue with Google" on /login is deferred to Story 1.2 (requires Google Cloud Console setup). Story 1.2 will cover both /signup and /login OAuth touchpoints.

## Tasks / Subtasks

- [ ] Task 1: Extend `useAuth` with `signIn` and `signOut`
  - [ ] Add `signIn(email, password)` — call `supabase.auth.signInWithPassword`, redirect to `/coach/dashboard` on success, throw on error
  - [ ] Add `signOut()` — call `supabase.auth.signOut`, redirect to `/login`
- [ ] Task 2: Sign-in form component
  - [ ] Create `src/features/auth/components/signin-form.tsx` (`'use client'`)
  - [ ] React Hook Form — fields: `email`, `password` (no age gate)
  - [ ] On Supabase `Invalid login credentials` error → set generic `serverError` "Invalid email or password" at form level (not field-level)
- [ ] Task 3: Login page
  - [ ] Create `src/app/(auth)/login/page.tsx` (server component wrapping `<SigninForm />`)
  - [ ] Add link to `/signup` for new users
- [ ] Task 4: Sign-out — temporary placement
  - [ ] Create `src/features/auth/components/sign-out-button.tsx` (`'use client'`)
  - [ ] Create stub `src/app/coach/dashboard/page.tsx` with sign-out button to validate AC3 (replaced in Story 1.6)

## Dev Notes

### `useAuth.ts` additions

```ts
const signIn = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  router.push('/coach/dashboard')
}

const signOut = async () => {
  await supabase.auth.signOut()
  router.push('/login')
}

return { signUp, signIn, signOut }
```

### Error Handling — AC2

Supabase returns `error.message === 'Invalid login credentials'` for both bad email and bad password. Map to a single form-level `serverError` state — do NOT use `form.setError('email', ...)` or `form.setError('password', ...)` as that would indicate which field is wrong.

### Signin Form Structure

Mirror the signup form layout (logo → heading → form):

```
Logo
"Sign in to your account"
Email field
Password field
[server error message if any]
[Sign in button]
[Link: "Don't have an account? Sign up"]
[Placeholder comment: Google button added in Story 1.2]
```

### Stub Dashboard (Task 4)

`/coach/dashboard` is replaced in Story 1.6. Create a minimal stub so sign-in redirect and sign-out can be tested end-to-end:

**`src/app/coach/dashboard/page.tsx`** (temporary):
```tsx
// Stub — replaced in Story 1.6
import { SignOutButton } from '@/features/auth/components/sign-out-button'

export default function DashboardPage() {
  return (
    <main className="p-8 bg-mx-bg min-h-screen">
      <h1 className="text-mx-text">Dashboard (stub)</h1>
      <SignOutButton />
    </main>
  )
}
```

`sign-out-button.tsx` is a `'use client'` component that calls `useAuth().signOut()` on click.

### What Changes vs Story 1.1

| File | Change |
|---|---|
| `src/features/auth/hooks/useAuth.ts` | Add `signIn`, `signOut` |
| `src/features/auth/components/signin-form.tsx` | **New** |
| `src/features/auth/components/sign-out-button.tsx` | **New** |
| `src/app/(auth)/login/page.tsx` | **New** |
| `src/app/coach/dashboard/page.tsx` | **New** (stub, replaced in 1.6) |

No backend changes required.

### Anti-Patterns — DO NOT DO

- `form.setError('email', ...)` or `form.setError('password', ...)` for wrong credentials — use form-level `serverError` state
- Making `signin-form.tsx` a server component — uses React Hook Form, MUST be `'use client'`
- Forgetting to add the Google button placeholder comment for Story 1.2

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.3]
- [Supabase signInWithPassword docs](https://supabase.com/docs/reference/javascript/auth-signinwithpassword)
- [Supabase signOut docs](https://supabase.com/docs/reference/javascript/auth-signout)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
