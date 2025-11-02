Step 1 – Setup Frontend (React)

Install Supabase Client Libraries

pnpm add @supabase/supabase-js @supabase/auth-ui-react @supabase/auth-ui-shared


Add environment variables (.env.local)

VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:8080


Create Supabase client

// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)


Wrap App with a small Auth provider

// src/main.tsx or src/App.tsx
import React from 'react'
import { supabase } from './lib/supabase'
import Dashboard from './pages/Dashboard'
import LoginPage from './pages/LoginPage'

function App() {
  const [session, setSession] = React.useState(null)

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return session?.user ? <Dashboard /> : <LoginPage />
}

export default App


Replace old login page with Supabase Auth UI (optional)

// Example in LoginPage.tsx
import { Auth } from '@supabase/auth-ui-react'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  return <Auth supabaseClient={supabase} />
}

Step 2 – Setup Backend (Hono + Cloudflare Workers)

Install Supabase helper library

cd backend
pnpm add @supabase/supabase-js


Create Supabase Auth middleware

// backend/src/middleware/auth.ts
import { createClient } from '@supabase/supabase-js'
import { Hono } from 'hono'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const app = new Hono()

app.use(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.split(' ')[1]
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  c.set('user', data.user)
  await next()
})

export { app }

