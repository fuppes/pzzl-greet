import { createClient } from '@/lib/supabase/server'

export default async function TestDBPage() {
  const supabase = await createClient()

  // Test database connection
  const { data: rooms, error } = await supabase
    .from('rooms')
    .select('*')

  return (
    <div className="p-8 bg-black text-white min-h-screen">
      <h1 className="text-2xl mb-4">Database Test</h1>

      {error && (
        <div className="bg-red-900 p-4 rounded mb-4">
          <h2 className="font-bold">Error:</h2>
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}

      {rooms && (
        <div className="bg-green-900 p-4 rounded">
          <h2 className="font-bold mb-2">Rooms ({rooms.length}):</h2>
          <pre>{JSON.stringify(rooms, null, 2)}</pre>
        </div>
      )}

      {!error && !rooms && (
        <div className="bg-yellow-900 p-4 rounded">
          <p>No rooms found</p>
        </div>
      )}
    </div>
  )
}
