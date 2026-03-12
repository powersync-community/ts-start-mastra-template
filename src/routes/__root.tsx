import type { ReactNode } from 'react'
import { useState, useEffect } from 'react'
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from '@tanstack/react-router'
import { PowerSyncContext } from '@powersync/react'
import { PowerSyncDatabase } from '@powersync/web'
import { AppSchema } from '~/lib/schema'
// Connector unused in local-only mode

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Chat App' },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap',
      },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  const [db, setDb] = useState<PowerSyncDatabase | null>(null)

  useEffect(() => {
    const database = new PowerSyncDatabase({
      schema: AppSchema,
      database: { dbFilename: 'chat.db' },
    })
    // Local-only mode — no PowerSync service to connect to
    setDb(database)
  }, [])

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif', background: '#0a0a0a', color: '#e5e5e5' }}>
        {db ? (
          <PowerSyncContext.Provider value={db}>
            <Outlet />
          </PowerSyncContext.Provider>
        ) : (
          <LoadingScreen />
        )}
        <Scripts />
      </body>
    </html>
  )
}

function LoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <p style={{ color: '#888' }}>Initializing...</p>
    </div>
  )
}
