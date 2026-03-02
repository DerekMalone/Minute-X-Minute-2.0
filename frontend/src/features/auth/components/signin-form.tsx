'use client'
import { useForm } from 'react-hook-form'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/hooks/useAuth'

type SigninFormValues = {
  email: string
  password: string
}

export function SigninForm() {
  const { signIn } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<SigninFormValues>({
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: SigninFormValues) => {
    setServerError(null)
    try {
      await signIn(values.email, values.password)
    } catch {
      setServerError('Invalid email or password')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-mx-bg">
      <div className="w-full max-w-sm space-y-8 px-6">
        <div className="flex flex-col items-center gap-4">
          <Image src="/icon-512x512.png" alt="MinuteXMinute" width={48} height={48} priority />
          <h1 className="text-2xl font-bold text-mx-text">Sign in to your account</h1>
        </div>

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

            <FormField
              control={form.control}
              name="password"
              rules={{ required: 'Password is required' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-mx-text">Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Your password"
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
              {form.formState.isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>

            {/* Google sign-in button added in Story 1.2 */}
          </form>
        </Form>

        <p className="text-center text-sm text-mx-muted">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-mx-teal hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
