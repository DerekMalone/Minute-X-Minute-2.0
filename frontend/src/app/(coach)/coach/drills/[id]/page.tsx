import { DrillDetailPage } from '@/features/drill-library/components/drill-detail-page'

export default async function DrillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <DrillDetailPage drillId={id} />
}
