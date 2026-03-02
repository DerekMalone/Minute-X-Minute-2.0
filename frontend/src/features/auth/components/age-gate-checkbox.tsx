'use client'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface AgeGateCheckboxProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  error?: string
}

export function AgeGateCheckbox({ checked, onCheckedChange, error }: AgeGateCheckboxProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-mx-muted">
        MinuteXMinute is currently available to users 13 and older. Players under 13 can access
        practice content via a share link from their coach.
      </p>
      <div className="flex items-center gap-3 min-h-[44px]">
        <Checkbox
          id="age-gate"
          checked={checked}
          onCheckedChange={(val) => onCheckedChange(val === true)}
          className="focus-visible:ring-2 focus-visible:ring-mx-teal"
        />
        <Label htmlFor="age-gate" className="text-mx-text font-normal cursor-pointer">
          I confirm I am 13 or older
        </Label>
      </div>
      {error && <p className="text-sm text-mx-red">{error}</p>}
    </div>
  )
}
