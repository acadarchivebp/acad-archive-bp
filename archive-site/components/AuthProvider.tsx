'use client'

import { createClient } from '@/utils/supabase' // Use the client we updated
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true) // Start strictly loading
  const router = useRouter()
  const pathname = usePathname()
  
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      // 1. Get the current user
      const { data: { user } } = await supabase.auth.getUser()

      // If we are already on the login page, we don't need to check access
      if (pathname === '/login') {
        setIsAuthorized(true)
        setIsLoading(false)
        return
      }

      // 2. No User? -> Kick to Login
      if (!user) {
        router.replace('/login')
        return
      }

      // 3. Check Domain (Case Insensitive)
      const email = user.email?.toLowerCase() || ''
      const isValidDomain = email.endsWith('bits-pilani.ac.in')

      if (!isValidDomain) {
        // BAD USER: Sign out immediately and redirect
        await supabase.auth.signOut()
        alert('Access Restricted: Please use your BITS Pilani email.')
        router.replace('/login')
      } else {
        // GOOD USER: Allow access
        setIsAuthorized(true)
        setIsLoading(false)
      }
    }

    checkUser()
  }, [router, pathname])

  // 4. The Shield: Show a spinner until we are sure
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-transparent border-b-gray-900 dark:border-b-white"></div>
      </div>
    )
  }

  // 5. Only render the website if authorized
  return <>{children}</>
}