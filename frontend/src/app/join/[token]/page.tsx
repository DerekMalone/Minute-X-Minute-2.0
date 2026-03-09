import { JoinTeamPage } from '@/features/team-management/components/join-team-page'

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return <JoinTeamPage token={token} />
}
