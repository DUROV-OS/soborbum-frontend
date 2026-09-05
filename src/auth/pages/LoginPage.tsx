import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/ui/Button'
import { Field, Input } from '@/shared/ui/Field'
import { useAuthStore } from '../store'

export function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const error = useAuthStore((s) => s.error)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const ok = await login(email, password)
    setSubmitting(false)
    if (ok) navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="text-[28px] font-semibold tracking-tight text-brand-dark">Durov OS<span className="text-brand">.</span></div>
          <p className="mt-1 text-[13px] text-muted">
            Рабочее пространство вашей компании
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-md border border-border bg-surface p-5">
          <div className="flex flex-col gap-4">
            <Field label="Почта" required>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mail@example.com"
                autoComplete="username"
              />
            </Field>
            <Field label="Пароль" required>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </Field>
            {error && <p className="text-[12px] text-danger">{error}</p>}
            <Button type="submit" disabled={!email || !password || submitting}>
              {submitting ? 'Вход…' : 'Войти'}
            </Button>
          </div>
        </form>

        <p className="mt-5 text-center text-[12px] text-muted">Для получения доступа обратитесь к администратору компании.</p>
      </div>
    </div>
  )
}
