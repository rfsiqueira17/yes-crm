import LoginForm from '@/components/shared/LoginForm'

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-4">
      {/* Detalhe vermelho superior */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-yes-red" />

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/yes-logo.jpeg"
            alt="YES! Idiomas"
            className="h-20 w-auto object-contain mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-900">CRM de Leads</h1>
          <p className="text-sm text-gray-500 mt-1">Acesse sua escola</p>
        </div>

        <LoginForm />

        <p className="text-center text-xs text-gray-400 mt-8">
          © {new Date().getFullYear()} YES! Idiomas. Todos os direitos reservados.
        </p>
      </div>
    </main>
  )
}
