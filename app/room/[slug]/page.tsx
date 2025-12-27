import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RoomLobby from './RoomLobby'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function RoomPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch room data
  const { data: room, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !room) {
    notFound()
  }

  // Check if room is expired
  if (room.expires_at && new Date(room.expires_at) < new Date()) {
    notFound()
  }

  return <RoomLobby room={room} />
}
