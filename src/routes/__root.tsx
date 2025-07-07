import { createRootRoute } from '@tanstack/react-router'
import { RootLayout } from '@/components/layout/RootLayout'

export const Route = createRootRoute({
  component: () => (
    <>
      <RootLayout />
      {/* Router devtools disabled to prevent Vite cache issues */}
      {/* You can access router state via browser dev tools React components tab */}
    </>
  ),
})
