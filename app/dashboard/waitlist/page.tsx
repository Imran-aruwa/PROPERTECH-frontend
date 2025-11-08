// app/dashboard/waitlist/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const revalidate = 0 // always fetch fresh data

export default async function WaitlistDashboard() {
  // 1️⃣ Create Supabase client using cookie-based session
  const supabase = createServerComponentClient({ cookies })

  // 2️⃣ Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // 3️⃣ Check if user has admin role
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || profile?.role !== 'admin') {
    redirect('/auth/login')
  }

  // 4️⃣ Fetch waitlist entries (admin view only)
  const { data: waitlist, error: waitlistError } = await supabase
    .from('waitlist')
    .select('*')
    .order('created_at', { ascending: false })

  if (waitlistError) {
    console.error('Error fetching waitlist:', waitlistError.message)
  }

  return (
    <main className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">
        Waitlist Admin Dashboard
      </h1>

      {waitlist?.length ? (
        <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-2 font-semibold text-gray-700">Email</th>
                <th className="text-left px-4 py-2 font-semibold text-gray-700">Joined</th>
              </tr>
            </thead>
            <tbody>
              {waitlist.map((w) => (
                <tr key={w.id} className="border-t hover:bg-gray-50 transition">
                  <td className="px-4 py-2">{w.email}</td>
                  <td className="px-4 py-2 text-gray-500">
                    {new Date(w.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500">No waitlist entries yet.</p>
      )}
    </main>
  )
}
