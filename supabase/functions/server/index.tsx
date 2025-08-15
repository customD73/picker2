import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'npm:@supabase/supabase-js@2'
import * as kv from './kv_store.tsx'

const app = new Hono()

app.use('*', logger(console.log))
app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['*'],
}))

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// User signup endpoint
app.post('/make-server-c6567478/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json()

    if (!email || !password || !name) {
      return c.text('Missing required fields', 400)
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    })

    if (error) {
      console.log('Signup error:', error)
      return c.text(`Signup error: ${error.message}`, 400)
    }

    // Initialize default user settings
    const defaultSettings = {
      metricWeights: {
        team_strength: 25,
        offensive_power: 20,
        defensive_power: 20,
        injury_impact: 15,
        weather_conditions: 10,
        schedule_strength: 10
      }
    }

    await kv.set(`user_settings_${data.user.id}`, defaultSettings)

    return c.json({ success: true, user: data.user })
  } catch (error) {
    console.log('Signup server error:', error)
    return c.text(`Server error during signup: ${error}`, 500)
  }
})

// Get user settings
app.get('/make-server-c6567478/user-settings', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    if (!accessToken) {
      return c.text('Unauthorized: No access token', 401)
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user?.id) {
      console.log('Auth error getting user settings:', error)
      return c.text(`Unauthorized: ${error?.message}`, 401)
    }

    const settings = await kv.get(`user_settings_${user.id}`)
    return c.json(settings || {})
  } catch (error) {
    console.log('Error getting user settings:', error)
    return c.text(`Error getting user settings: ${error}`, 500)
  }
})

// Save user settings
app.post('/make-server-c6567478/user-settings', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    if (!accessToken) {
      return c.text('Unauthorized: No access token', 401)
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user?.id) {
      console.log('Auth error saving user settings:', error)
      return c.text(`Unauthorized: ${error?.message}`, 401)
    }

    const settings = await c.req.json()
    await kv.set(`user_settings_${user.id}`, settings)

    return c.json({ success: true })
  } catch (error) {
    console.log('Error saving user settings:', error)
    return c.text(`Error saving user settings: ${error}`, 500)
  }
})

// Get suicide pool picks
app.get('/make-server-c6567478/suicide-pool-picks', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    if (!accessToken) {
      return c.text('Unauthorized: No access token', 401)
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user?.id) {
      console.log('Auth error getting suicide pool picks:', error)
      return c.text(`Unauthorized: ${error?.message}`, 401)
    }

    const picks = await kv.get(`suicide_pool_picks_${user.id}`)
    return c.json(picks || [])
  } catch (error) {
    console.log('Error getting suicide pool picks:', error)
    return c.text(`Error getting suicide pool picks: ${error}`, 500)
  }
})

// Save suicide pool pick
app.post('/make-server-c6567478/suicide-pool-pick', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    if (!accessToken) {
      return c.text('Unauthorized: No access token', 401)
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user?.id) {
      console.log('Auth error saving suicide pool pick:', error)
      return c.text(`Unauthorized: ${error?.message}`, 401)
    }

    const newPick = await c.req.json()
    const existingPicks = await kv.get(`suicide_pool_picks_${user.id}`) || []
    
    // Check if team was already used
    const usedTeams = existingPicks.map((pick: any) => pick.team)
    if (usedTeams.includes(newPick.team)) {
      return c.text('Team already used in suicide pool', 400)
    }

    // Check if pick already exists for this week
    const existingWeekPick = existingPicks.find((pick: any) => pick.week === newPick.week)
    if (existingWeekPick) {
      return c.text('Pick already made for this week', 400)
    }

    const updatedPicks = [...existingPicks, newPick]
    await kv.set(`suicide_pool_picks_${user.id}`, updatedPicks)

    return c.json({ success: true })
  } catch (error) {
    console.log('Error saving suicide pool pick:', error)
    return c.text(`Error saving suicide pool pick: ${error}`, 500)
  }
})

Deno.serve(app.fetch)