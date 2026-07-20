import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

const inputClass =
  'mt-1 w-full rounded-lg border border-line px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-primary-300'

export default function DriveLogin() {
  const { signIn, signUpDriver } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [fleetCode, setFleetCode] = useState('')
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
        navigate('/drive', { replace: true })
      } else {
        const result = await signUpDriver(email, password, fullName, phone, fleetCode)
        if (result.needsEmailConfirmation) {
          setConfirmEmailSent(true)
        } else {
          navigate('/drive', { replace: true })
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
        <h1 className="text-lg font-semibold mt-2">{mode === 'signin' ? 'Driver sign in' : 'Join your fleet'}</h1>
        <p className="text-sm text-ink/50 mt-0.5 mb-5">Log your costs, track your cost per km.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <label className="block">
                <span className="text-xs text-ink/50">Your name</span>
                <input required className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </label>
              <label className="block">
                <span className="text-xs text-ink/50">Phone (optional)</span>
                <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
              <label className="block">
                <span className="text-xs text-ink/50">Fleet code</span>
                <input
                  required
                  className={`${inputClass} uppercase`}
                  value={fleetCode}
                  onChange={(e) => setFleetCode(e.target.value)}
                  placeholder="From your fleet manager"
                />
              </label>
            </>
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
            className="w-full px-4 py-3 text-sm rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-60"
          >
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Join fleet'}
          </button>
        </form>

        <button
          onClick={() => {
            setMode((m) => (m === 'signin' ? 'signup' : 'signin'))
            setError('')
          }}
          className="text-sm text-primary-600 font-medium mt-4"
        >
          {mode === 'signin' ? "New driver? Join with a fleet code" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}
