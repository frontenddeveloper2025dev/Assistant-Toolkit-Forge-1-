import { ReactNode, useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { LoginDialog } from '@/components/auth/LoginDialog'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuthStore()
  const [showLogin, setShowLogin] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      setShowLogin(true)
    } else {
      setShowLogin(false)
    }
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-muted-foreground">Please sign in to access your assistant</p>
          </div>
        </div>
        <LoginDialog open={showLogin} onOpenChange={setShowLogin} />
      </>
    )
  }

  return <>{children}</>
}