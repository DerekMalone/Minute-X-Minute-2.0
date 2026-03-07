'use client'

import { useState } from 'react'
import { useActiveInvite, useGenerateInvite } from '@/features/team-management/hooks/useInvite'

interface InviteLinkManagerProps {
  teamId: string
}

export function InviteLinkManager({ teamId }: InviteLinkManagerProps) {
  const { data: invite, isPending } = useActiveInvite(teamId)
  const generateInvite = useGenerateInvite()
  const [copied, setCopied] = useState(false)

  if (isPending) {
    return (
      <div className="space-y-3">
        <div className="h-6 w-64 rounded bg-mx-text/10 animate-pulse" />
        <div className="h-4 w-40 rounded bg-mx-text/10 animate-pulse" />
      </div>
    )
  }

  if (!invite) {
    return (
      <button
        onClick={() => generateInvite.mutate(teamId)}
        disabled={generateInvite.isPending}
        className="rounded bg-mx-primary px-4 py-2 text-white hover:bg-mx-primary/90 disabled:opacity-50"
      >
        {generateInvite.isPending ? 'Generating...' : 'Generate Invite Link'}
      </button>
    )
  }

  const inviteUrl = `${window.location.origin}/join/${invite.token}`
  const expiryDate = new Date(invite.expiresAt).toLocaleDateString()

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-3">
      <p className="break-all font-mono text-sm">{inviteUrl}</p>
      <p className="text-sm text-mx-text/60">Expires {expiryDate}</p>
      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className="rounded bg-mx-primary px-4 py-2 text-white hover:bg-mx-primary/90"
        >
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
        <button
          onClick={() => generateInvite.mutate(teamId)}
          disabled={generateInvite.isPending}
          className="rounded border border-mx-text/20 px-4 py-2 hover:bg-mx-text/5 disabled:opacity-50"
        >
          Regenerate
        </button>
      </div>
    </div>
  )
}
