import { createClient } from '@/lib/supabase/server'
import AdminDashboard from './AdminDashboard'
import AdminLogin from './AdminLogin'
import { logError } from '@/lib/error-handler'

export default async function AdminPage() {
  const supabase = await createClient()

  // Get user (middleware already checked auth and role)
  const { data: { user } } = await supabase.auth.getUser()

  // Show login page if no user (middleware allows /admin path)
  if (!user) {
    return <AdminLogin />
  }

  // Fetch all rooms
  const { data: rooms, error } = await supabase
    .from('rooms')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    logError(error, 'AdminPage: fetchRooms')
  }

  return <AdminDashboard rooms={rooms || []} user={user} />
}
