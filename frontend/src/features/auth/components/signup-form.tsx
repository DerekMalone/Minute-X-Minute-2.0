'use client'
import { useForm } from 'react-hook-form'
import Image from 'next/image'
import { useState } from 'react'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AgeGateCheckbox } from '@/features/auth/components/age-gate-checkbox'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { SignupFormValues } from '@/features/auth/types'

export function SignupForm() {
  const { signUp } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<SignupFormValues>({
    defaultValues: { email: '', password: '', ageGate: false },
  })

  const onSubmit = async (values: SignupFormValues) => {
    setServerError(null)
    try {
      await signUp(values.email, values.password)
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'User already registered') {
        form.setError('email', { message: 'Email already in use. Try signing in.' })
      } else {
        setServerError('Something went wrong. Please try again.')
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-mx-bg">
      <div className="w-full max-w-sm space-y-8 px-6">
        <div className="flex flex-col items-center gap-4">
          <Image src="/icon-512x512.png" alt="MinuteXMinute" width={48} height={48} priority />
          <h1 className="text-2xl font-bold text-mx-text">Create your account</h1>
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
              rules={{
                required: 'Password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters' },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-mx-text">Password</FormLabel>
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
              name="ageGate"
              rules={{
                validate: (value) => value || 'You must be 13 or older to create an account',
              }}
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormControl>
                    <AgeGateCheckbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      error={fieldState.error?.message}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {serverError && <p className="text-sm text-mx-red">{serverError}</p>}

            <Button
              type="submit"
              className="w-full min-h-[44px] bg-mx-green text-black hover:bg-mx-green/90 font-semibold"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}
