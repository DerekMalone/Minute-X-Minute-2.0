import { Card, CardContent } from '@/components/ui/card'
import type { DrillDto } from '../types'

interface Props {
  drill: DrillDto
}

export function DrillCard({ drill }: Props) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="font-medium">{drill.name}</p>
        {drill.category && (
          <p className="text-sm text-muted-foreground">{drill.category}</p>
        )}
      </CardContent>
    </Card>
  )
}
