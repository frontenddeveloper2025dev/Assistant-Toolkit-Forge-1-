import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AssistantPage } from '@/pages/AssistantPage'

function HomePage() {
  return (
    <ProtectedRoute>
      <AssistantPage />
    </ProtectedRoute>
  )
}

export default HomePage 