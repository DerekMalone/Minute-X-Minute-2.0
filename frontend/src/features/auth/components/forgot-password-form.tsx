'use client'
import { useForm } from 'react-hook-form'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/hooks/useAuth'

type ForgotPasswordFormValues = {
  email: string
}

export function ForgotPasswordForm() {
  const { requestPasswordReset } = useAuth()
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<ForgotPasswordFormValues>({
    defaultValues: { email: '' },
  })

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setServerError(null)
    try {
      await requestPasswordReset(values.email)
    } catch {
      setServerError('Something went wrong. Please try again.')
      return
    }
    setSubmitted(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-mx-bg">
      <div className="w-full max-w-sm space-y-8 px-6">
        <div className="flex flex-col items-center gap-4">
          <Image src="/icon-512x512.png" alt="MinuteXMinute" width={48} height={48} priority />
          <h1 className="text-2xl font-bold text-mx-text">Reset your password</h1>
        </div>

        {submitted ? (
          <p className="text-center text-sm text-mx-text">Check your email for a reset link</p>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                rules={{ required: 'Email is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-mx-text">Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        className="min-h-[44px] focus-visible:ring-2 focus-visible:ring-mx-teal"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-mx-red" />
                  </FormItem>
                )}
              />

              {serverError && <p className="text-sm text-mx-red">{serverError}</p>}

              <Button
                type="submit"
                className="w-full min-h-[44px] bg-mx-green text-black hover:bg-mx-green/90 font-semibold"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Sending...' : 'Send reset link'}
              </Button>
            </form>
          </Form>
        )}

        <p className="text-center text-sm text-mx-muted">
          <Link href="/login" className="text-mx-teal hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
