import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const inputClass =
  'mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300'

export default function Login() {
  const { signIn, signUpAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmEmailSent, setConfirmEmailSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
        navigate(location.state?.from || '/', { replace: true })
      } else {
        const result = await signUpAdmin(email, password, companyName)
        if (result.needsEmailConfirmation) {
          setConfirmEmailSent(true)
        } else {
          navigate(location.state?.from || '/', { replace: true })
        }
      }
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  if (confirmEmailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-4">
        <div className="card w-full max-w-sm p-6 text-center">
          <h1 className="text-lg font-semibold">Check your email</h1>
          <p className="text-sm text-ink/50 mt-2">
            We sent a confirmation link to <span className="text-ink">{email}</span>. Click it, then come back and
            sign in.
          </p>
          <button
            onClick={() => {
              setConfirmEmailSent(false)
              setMode('signin')
            }}
            className="text-sm text-primary-600 font-medium mt-5"
          >
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="card w-full max-w-sm p-6">
        <div className="meter text-2xl font-bold text-primary-700 leading-none">00.00</div>
        <h1 className="text-lg font-semibold mt-2">
          {mode === 'signin' ? 'Sign in to your fleet' : 'Create your fleet account'}
        </h1>
        <p className="text-sm text-ink/50 mt-0.5 mb-5">Cost per km, tracked per vehicle.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <label className="block">
              <span className="text-xs text-ink/50">Company / fleet name</span>
              <input className={inputClass} value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </label>
          )}
          <label className="block">
            <span className="text-xs text-ink/50">Email</span>
            <input type="email" required className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-xs text-ink/50">Password</span>
            <input
              type="password"
              required
              minLength={6}
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error && <p className="text-xs text-alert-600">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full px-4 py-2 text-sm rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-60"
          >
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <button
          onClick={() => {
            setMode((m) => (m === 'signin' ? 'signup' : 'signin'))
            setError('')
          }}
          className="text-sm text-primary-600 font-medium mt-4"
        >
          {mode === 'signin' ? "Don't have a fleet account? Create one" : 'Already have an account? Sign in'}
        </button>

        <p className="text-xs text-ink/40 mt-6">
          Driving for a fleet already? Use the{' '}
          <a href="/drive/login" className="text-primary-600 hover:underline">
            driver login
          </a>{' '}
          instead.
        </p>
      </div>
    </div>
  )
}
