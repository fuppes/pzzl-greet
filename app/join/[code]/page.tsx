import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import JoinSessionForm from './JoinSessionForm'

interface PageProps {
  params: Promise<{
    code: string
  }>
}

export default async function JoinPage({ params }: PageProps) {
  const { code } = await params
  const supabase = await createClient()

  // Fetch session data
  const { data: session, error } = await supabase
    .from('game_sessions')
    .select(`
      *,
      rooms (
        id,
        name,
        slug,
        description
      )
    `)
    .eq('session_code', code.toUpperCase())
    .single()

  if (error || !session) {
    notFound()
  }

  // If session is completed, redirect to greeting
  // @ts-expect-error - session type is inferred from supabase
  if (session.status === 'completed') {
    redirect(`/session/${code}/greeting`)
  }

  return <JoinSessionForm session={session} />
}
