'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CadastroScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    secretKey: '',
    name: '',
    number: '', // Código na contabilidade
    role: '',
    pin: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (formData.pin.length !== 4) {
      alert("O PIN deve ter exatamente 4 números.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/employees/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert("Conta criada com sucesso! Você já pode bater ponto.");
        router.push('/');
      } else {
        alert("Erro: " + data.error);
      }
    } catch (e) {
      alert("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">Criar Conta</h1>
        <p className="text-center text-gray-500 mb-6 text-sm">Preencha os dados usando a Chave do Gestor</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chave de Segurança (Fornecida pelo Gestor)</label>
            <input 
              type="text" 
              name="secretKey"
              required
              value={formData.secretKey}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-black placeholder-gray-400"
              placeholder="Ex: LOJA123"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
            <input 
              type="text" 
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-black placeholder-gray-400"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cód. Contabilidade</label>
              <input 
                type="text" 
                name="number"
                required
                value={formData.number}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-black placeholder-gray-400"
                placeholder="Ex: 6"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">PIN (4 Números)</label>
              <input 
                type="tel" 
                name="pin"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                required
                value={formData.pin}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 tracking-widest text-center font-bold text-black placeholder-gray-400"
                placeholder="****"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Função / Cargo</label>
            <input 
              type="text" 
              name="role"
              required
              value={formData.role}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-black placeholder-gray-400"
              placeholder="Ex: Aux. Administrativo"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg mt-4 disabled:opacity-50"
          >
            {loading ? 'Criando...' : 'Criar minha conta'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            Já tem conta? Voltar para o Início
          </Link>
        </div>
      </div>
    </main>
  );
}
