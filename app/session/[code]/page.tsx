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

  // Fetch session with room
  const { data: session, error } = await supabase
    .from('game_sessions')
    .select(`
      *,
      rooms (
        id,
        name,
        slug,
        description,
        video_url
      )
    `)
    .eq('session_code', code.toUpperCase())
    .single()

  if (error || !session) {
    notFound()
  }

  // Fetch game queue for this room
  const { data: gameQueue } = await supabase
    .from('room_game_queue')
    .select(`
      *,
      games (*)
    `)
    // @ts-expect-error - session type is inferred from supabase
    .eq('room_id', (session.rooms as any).id)
    .order('queue_position', { ascending: true })

  // Attach game queue to session
  ;(session as any).game_queue = gameQueue || []

  // Check if session is completed
  // @ts-expect-error - session type is inferred from supabase
  if (session.status === 'completed') {
    redirect(`/session/${code}/greeting`)
  }

  return <GameSession session={session} />
}
