import { LoginForm } from './form'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  // Sólo rutas internas del panel: un `next` absoluto sería un open redirect.
  const destino = next?.startsWith('/admin') ? next : '/admin'

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Panel de reservas</h1>
          <p className="text-sm text-muted-foreground">The Authentic Tango Experience</p>
        </div>
        <LoginForm next={destino} />
      </div>
    </main>
  )
}
