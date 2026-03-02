import { Suspense } from 'react'
import { SigninForm } from '@/features/auth/components/signin-form'

export default function LoginPage() {
  return (
    <Suspense>
      <SigninForm />
    </Suspense>
  )
}
