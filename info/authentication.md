Desired User Flow (Step by Step)
🪪 Step 1: Start Form

User types:

Business Name

Email Address

Clicks “Continue”

✅ Backend sends an OTP code (e.g., 6-digit) to that email.
✅ Frontend shows “Verify your email” screen.

🔢 Step 2: Verify Email

User enters the 6-digit OTP they received.

Backend checks if OTP matches & is not expired.

If valid → mark email as verified → return temporary session or allow next form step.

🧍 Step 3: Complete Profile

Now show fields:

Full Name

Phone Number

Password

User submits → /auth/register (with verified email flag)

Backend creates user → issues JWT → redirect to dashboard ✅

⚙️ Technical Implementation (Hono + Node)

Let’s make the OTP verification secure and simple.

Step 1: Install dependencies
pnpm add hono nodemailer otp-generator bcrypt jsonwebtoken

Step 2: auth.ts – with OTP system
import { Hono } from 'hono'
import nodemailer from 'nodemailer'
import otpGenerator from 'otp-generator'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const auth = new Hono()
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'

// Mock DBs
const pendingVerifications: Record<string, any> = {}
const users: any[] = []

// Configure mailer (you can use SendGrid, Resend, Mailgun, etc.)
const transporter = nodemailer.createTransport({
  service: 'gmail', // or use SMTP config
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

// --- STEP 1: Send OTP ---
auth.post('/send-otp', async (c) => {
  const { email, businessName } = await c.req.json()

  // Basic validation
  if (!email || !businessName) return c.json({ message: 'Missing fields' }, 400)
  if (users.find(u => u.email === email)) return c.json({ message: 'Email already registered' }, 400)

  const otp = otpGenerator.generate(6, { digits: true, upperCaseAlphabets: false, specialChars: false })
  const expiresAt = Date.now() + 5 * 60 * 1000 // expires in 5 minutes

  pendingVerifications[email] = { otp, expiresAt, businessName }

  // Send email
  await transporter.sendMail({
    from: 'FishLedger <no-reply@fishledger.com>',
    to: email,
    subject: 'Your FishLedger verification code',
    text: `Your verification code is ${otp}. It will expire in 5 minutes.`,
  })

  return c.json({ message: 'OTP sent to email' })
})

// --- STEP 2: Verify OTP ---
auth.post('/verify-otp', async (c) => {
  const { email, otp } = await c.req.json()
  const record = pendingVerifications[email]
  if (!record) return c.json({ message: 'No OTP found for this email' }, 400)

  if (Date.now() > record.expiresAt) return c.json({ message: 'OTP expired' }, 400)
  if (record.otp !== otp) return c.json({ message: 'Invalid OTP' }, 400)

  // Mark as verified
  record.verified = true
  return c.json({ message: 'Email verified successfully' })
})

// --- STEP 3: Register User ---
auth.post('/register', async (c) => {
  const { email, name, phone, password } = await c.req.json()
  const record = pendingVerifications[email]

  if (!record || !record.verified) return c.json({ message: 'Email not verified' }, 400)

  const hashed = await bcrypt.hash(password, 10)
  const newUser = {
    id: users.length + 1,
    businessName: record.businessName,
    email,
    name,
    phone,
    password: hashed,
  }

  users.push(newUser)
  delete pendingVerifications[email] // cleanup

  const token = jwt.sign({ id: newUser.id, email }, JWT_SECRET, { expiresIn: '7d' })
  return c.json({ message: 'Account created', token })
})

export default auth

🪄 Step 3: Frontend (React)

The flow:

/signup — collects businessName + email, calls /send-otp.

/verify — asks for OTP, calls /verify-otp.

/complete — asks for name, phone, password → calls /register