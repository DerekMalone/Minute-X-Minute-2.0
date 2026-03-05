'use client'

import { useForm } from 'react-hook-form'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useCreateTeam } from '@/features/team-management/hooks/useTeam'

interface FormValues {
  name: string
}

export function TeamCreateForm() {
  const createTeam = useCreateTeam()
  const form = useForm<FormValues>({ defaultValues: { name: '' } })

  function onSubmit(values: FormValues) {
    createTeam.mutate(values.name)
  }

  return (
    <div className="max-w-md">
      <h2 className="text-mx-text text-xl font-semibold mb-6">Create your team</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            rules={{
              required: 'Team name is required',
              validate: (v) => v.trim().length > 0 || 'Team name is required',
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-mx-text">Team name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Lake Norman Lacrosse"
                    className="min-h-[44px] focus-visible:ring-2 focus-visible:ring-mx-teal"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-mx-red" />
              </FormItem>
            )}
          />

          {createTeam.isError && (
            <p className="text-sm text-mx-red">
              {createTeam.error instanceof Error ? createTeam.error.message : 'Failed to create team'}
            </p>
          )}

          <Button type="submit" disabled={createTeam.isPending} className="w-full min-h-[44px]">
            {createTeam.isPending ? 'Creating...' : 'Create team'}
          </Button>
        </form>
      </Form>
    </div>
  )
}
