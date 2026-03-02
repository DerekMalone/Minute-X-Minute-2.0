'use client'
import { useForm } from 'react-hook-form'
import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

type ResetPasswordFormValues = {
  password: string
  confirmPassword: string
}

type ExchangeState = 'pending' | 'ready' | 'error'

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  const errorParam = searchParams.get('error')

  // Stable client instance — exchange and updateUser must share the same instance
  const supabase = useMemo(() => createClient(), [])
  const [exchangeState, setExchangeState] = useState<ExchangeState>(
    errorParam === 'link_expired' ? 'error' : 'pending'
  )
  const [serverError, setServerError] = useState<string | null>(null)
  const exchangeAttempted = useRef(false)

  const form = useForm<ResetPasswordFormValues>({
    defaultValues: { password: '', confirmPassword: '' },
  })

  useEffect(() => {
    if (exchangeAttempted.current) return
    exchangeAttempted.current = true

    if (errorParam === 'link_expired' || !code) {
      setExchangeState('error')
      return
    }
    // createBrowserClient auto-exchanges the code via detectSessionInUrl.
    // getSession() awaits that initialization before returning.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setExchangeState(session ? 'ready' : 'error')
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setServerError(null)
    const { error } = await supabase.auth.updateUser({ password: values.password })
    if (error) {
      setServerError('Something went wrong. Please request a new reset link.')
      return
    }
    router.push('/login?message=Your+password+has+been+updated.+Please+sign+in.')
  }

  if (exchangeState === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mx-bg">
        <div className="w-full max-w-sm space-y-8 px-6">
          <div className="flex flex-col items-center gap-4">
            <Image src="/icon-512x512.png" alt="MinuteXMinute" width={48} height={48} priority />
            <h1 className="text-2xl font-bold text-mx-text">Link expired</h1>
          </div>
          <p className="text-center text-sm text-mx-text">
            This reset link has expired.{' '}
            <Link href="/forgot-password" className="text-mx-teal hover:underline">
              Request a new one.
            </Link>
          </p>
        </div>
      </div>
    )
  }

  if (exchangeState === 'pending') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mx-bg">
        <p className="text-sm text-mx-muted">Verifying reset link...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-mx-bg">
      <div className="w-full max-w-sm space-y-8 px-6">
        <div className="flex flex-col items-center gap-4">
          <Image src="/icon-512x512.png" alt="MinuteXMinute" width={48} height={48} priority />
          <h1 className="text-2xl font-bold text-mx-text">Set a new password</h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="password"
              rules={{
                required: 'Password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters' },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-mx-text">New password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Min. 8 characters"
                      className="min-h-[44px] focus-visible:ring-2 focus-visible:ring-mx-teal"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-mx-red" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              rules={{
                required: 'Please confirm your password',
                validate: (val) =>
                  val === form.getValues('password') || 'Passwords do not match',
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-mx-text">Confirm new password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Repeat your password"
                      className="min-h-[44px] focus-visible:ring-2 focus-visible:ring-mx-teal"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-mx-red" />
                </FormItem>
              )}
            />

            {serverError && (
              <p className="text-sm text-mx-red">
                {serverError}{' '}
                <Link href="/forgot-password" className="text-mx-teal hover:underline">
                  Request a new reset link.
                </Link>
              </p>
            )}

            <Button
              type="submit"
              className="w-full min-h-[44px] bg-mx-green text-black hover:bg-mx-green/90 font-semibold"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Updating...' : 'Update password'}
            </Button>
          </form>
        </Form>

        <p className="text-center text-sm text-mx-muted">
          <Link href="/login" className="text-mx-teal hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
