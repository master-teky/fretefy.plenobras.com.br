"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import androidChrome192 from "../../../../public/assets/images/favicon/android-chrome-192-192.png";
import androidChrome72 from "../../../../public/assets/images/favicon/android-chrome-72-72.png";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    const result = await signIn("credentials", {
      username: formData.get("username") as string,
      password: formData.get("password") as string,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Credenciais inválidas");
    } else {
      router.push("/drivers");
    }
  }

  return <div className="flex min-h-screen">
    <div
      className="hidden lg:flex lg:w-1/2 items-center justify-center relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #003062 0%, #001a38 100%)",
      }}
    >
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#ff4700]/10" />
      <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-[#ff4700]/5" />
      <div className="absolute top-1/4 right-1/4 h-64 w-64 rounded-full bg-white/5" />

      <div className="relative z-10 text-center">
        <Image
          src={androidChrome192}
          alt="Plenobras"
          width={120}
          height={120}
          className="mx-auto mb-8"
        />
        <h2 className="text-3xl font-bold text-white mb-2">Fretefy</h2>
        <p className="text-white/50 text-sm">Plataforma de Gestão de Fretes</p>
      </div>
    </div>

    <div className="flex w-full lg:w-1/2 items-center justify-center bg-white px-8">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
        <div className="mb-8">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <Image
              src={androidChrome72}
              alt="Plenobras"
              width={40}
              height={40}
            />
            <span className="text-xl font-bold text-[#003062]">Fretefy</span>
          </div>
          <h1 className="text-2xl font-bold text-[#003062]">Bem-vindo de volta</h1>
          <p className="text-gray-500 text-sm mt-1">
            Entre na sua conta
          </p>
        </div>

        {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-red-600 text-sm">
          {error}
        </div>}

        <div className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              E-mail
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm transition-colors focus:border-[#003062] focus:outline-none focus:ring-2 focus:ring-[#003062]/20"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm transition-colors focus:border-[#003062] focus:outline-none focus:ring-2 focus:ring-[#003062]/20"
              placeholder="Digite sua senha"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#ff4700] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[#e63f00] focus:outline-none focus:ring-2 focus:ring-[#ff4700]/50 disabled:opacity-50"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  </div>
}