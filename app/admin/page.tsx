import { createClient } from '@/lib/supabase/server'
import AdminDashboard from './AdminDashboard'
import AdminLogin from './AdminLogin'

export default async function AdminPage() {
  const supabase = await createClient()

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <AdminLogin />
  }

  // Fetch all rooms
  const { data: rooms, error } = await supabase
    .from('rooms')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching rooms:', error)
  }

  return <AdminDashboard rooms={rooms || []} user={user} />
}
