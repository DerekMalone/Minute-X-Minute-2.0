'use client'

import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { useCreateDrill } from '../hooks/useCreateDrill'
import type { DrillDto } from '../types'

interface Props {
  teamId: string
}

interface FormValues {
  name: string
}

export function CreateDrillForm({ teamId }: Props) {
  const router = useRouter()
  const createDrill = useCreateDrill(teamId)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ mode: 'onBlur' })

  const { ref, onBlur, ...rest } = register('name', {
    required: 'Drill name is required',
    validate: (v) => v.trim().length > 0 || 'Drill name is required',
  })

  function submit(values: FormValues) {
    const name = values.name.trim()
    createDrill.mutate(
      { name },
      {
        onSuccess: (drill: DrillDto) => {
          router.push(`/coach/drills/${drill.id}`)
        },
      }
    )
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    onBlur(e)
    if (createDrill.isPending || createDrill.isSuccess) return
    handleSubmit(submit)()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit(submit)()
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Input
        placeholder="Drill name"
        autoFocus
        {...rest}
        ref={ref}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={createDrill.isPending}
      />
      {errors.name && (
        <p className="text-sm text-destructive">{errors.name.message}</p>
      )}
      {createDrill.isError && (
        <p className="text-sm text-destructive">Failed to save drill. Try again.</p>
      )}
    </div>
  )
}
