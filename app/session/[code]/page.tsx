import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GameSession from './GameSession'

interface PageProps {
  params: Promise<{
    code: string
  }>
}

export default async function SessionPage({ params }: PageProps) {
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
        description,
        video_url,
        quiz_data
      )
    `)
    .eq('session_code', code.toUpperCase())
    .single()

  if (error || !session) {
    notFound()
  }

  // Check if session is completed
  if (session.status === 'completed') {
    redirect(`/session/${code}/greeting`)
  }

  return <GameSession session={session} />
}
