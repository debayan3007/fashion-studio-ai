import { useState } from 'react';
import type { FormEvent } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { setToken } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/signup', { email, password });
      setToken(res.data.token);
      navigate('/studio');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <form onSubmit={onSubmit} className="bg-white p-6 rounded shadow w-full max-w-md space-y-4">
        <h1 className="text-xl font-semibold">Sign up</h1>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="Email"
          type="email"
          required
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="Password"
          type="password"
          required
        />
        <button className="w-full bg-slate-900 text-white py-2 rounded hover:bg-slate-800">
          Create account
        </button>
        <p className="text-sm">
          Already have an account? <Link className="text-slate-900" to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}

