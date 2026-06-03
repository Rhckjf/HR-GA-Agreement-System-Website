import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, FileText } from 'lucide-react';
import { getAllDepartments } from '@/departmentConfig';
import { API } from '../config';

const departments = getAllDepartments();

export default function Login({ setIsAuthenticated }) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, {
        email: formData.email,
        password: formData.password,
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setIsAuthenticated(true);
      toast.success('Login successful!');

      // Role-based redirect
      const user = response.data.user;
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.department) {
        navigate(`/department/${user.department}`);
      } else {
        navigate('/');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Image */}
      <div
        className="hidden lg:flex lg:w-1/2 relative bg-cover bg-center"
        style={{
          backgroundImage: 'url(/pt-diamond.jpeg)'
        }}
      >
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to bottom, rgba(19, 78, 74, 0.9), rgba(19, 78, 74, 0.7))'
        }}></div>
        <div className="relative z-10 flex flex-col justify-center items-start p-16 text-white">
          <div className="flex items-center gap-3 mb-6">
            <FileText size={40} strokeWidth={2} />
            <h1 className="text-4xl font-bold tracking-tight">Agreement Manager</h1>
          </div>
          <p className="text-xl leading-relaxed max-w-md opacity-90">
            PT Diamond Electric Indonesia's multi-department agreement management system with centralized tracking and role-based access control.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {departments.slice(0, 8).map((dept) => {
              const DeptIcon = dept.icon;
              return (
                <div key={dept.name} className="flex items-center gap-2 text-white/70 text-sm">
                  <DeptIcon size={14} />
                  <span>{dept.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden" style={{ backgroundColor: '#FAFAF9' }}>
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Gradient Orbs */}
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl animate-gradient-shift" style={{ backgroundColor: 'rgba(19, 78, 74, 0.15)' }}></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl animate-gradient-shift-reverse" style={{ backgroundColor: 'rgba(15, 118, 110, 0.12)' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl animate-pulse-slow" style={{ backgroundColor: 'rgba(19, 78, 74, 0.1)' }}></div>
          
          {/* Animated Waves */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute bottom-0 left-0 right-0 h-64">
              <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1200 120" preserveAspectRatio="none">
                <path 
                  d="M0,50 C150,80 350,0 600,50 C850,100 1050,20 1200,50 L1200,120 L0,120 Z" 
                  fill="rgba(19, 78, 74, 0.15)"
                  className="animate-wave"
                />
              </svg>
              <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1200 120" preserveAspectRatio="none">
                <path 
                  d="M0,70 C200,20 400,100 600,70 C800,40 1000,90 1200,70 L1200,120 L0,120 Z" 
                  fill="rgba(19, 78, 74, 0.1)"
                  className="animate-wave-slow"
                />
              </svg>
            </div>
          </div>

          {/* Floating Geometric Shapes */}
          <div className="absolute top-20 left-20 w-32 h-32 border-2 rounded-3xl animate-float-rotate" style={{ borderColor: 'rgba(19, 78, 74, 0.2)' }}></div>
          <div className="absolute top-40 right-40 w-24 h-24 border-2 rounded-full animate-pulse-slow delay-300" style={{ borderColor: 'rgba(15, 118, 110, 0.25)' }}></div>
          <div className="absolute bottom-40 left-40 w-40 h-40 border-2 rounded-[2rem] rotate-12 animate-float-slow" style={{ borderColor: 'rgba(19, 78, 74, 0.15)' }}></div>
          <div className="absolute bottom-20 right-20 w-28 h-28 border-2 rounded-full animate-pulse-slow delay-600" style={{ borderColor: 'rgba(19, 78, 74, 0.2)' }}></div>
        </div>

        {/* Main Form Container with Animation */}
        <div className="w-full max-w-md relative z-10 animate-fade-in">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-stone-200/50 p-8 transform transition-all duration-500 hover:shadow-3xl hover:scale-[1.02] relative overflow-hidden">
            {/* Decorative Top Bar with more curve */}
            <div className="absolute top-0 left-0 right-0 h-2 rounded-t-3xl" style={{ background: 'linear-gradient(135deg, #134E4A, #0F766E)' }}></div>
            
            <div className="mb-8">
              {/* Animated Icon with more rounded corners */}
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5 shadow-lg animate-bounce-subtle transform hover:rotate-6 transition-transform duration-300" style={{ background: 'linear-gradient(135deg, #134E4A, #0F766E)' }}>
                <FileText size={36} className="text-white" strokeWidth={2.5} />
              </div>
              
              <h2 className="text-3xl font-semibold tracking-tight text-stone-900 mb-2">
                Welcome Back
              </h2>
              <p className="text-sm text-stone-500">
                Enter your credentials to access your department
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              <div className="space-y-2 group">
                <Label htmlFor="email" className="text-sm font-medium text-stone-700 transition-colors duration-200" style={{ color: formData.email ? '#134E4A' : undefined }}>
                  Email
                </Label>
                <Input
                  id="email"
                  data-testid="login-email-input"
                  type="email"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="h-11 rounded-xl transition-all duration-200 focus:ring-2 hover:border-[#0F766E]"
                  style={{ 
                    borderColor: formData.email ? '#0F766E' : undefined,
                    '--tw-ring-color': '#134E4A'
                  }}
                />
              </div>

              <div className="space-y-2 group">
                <Label htmlFor="password" className="text-sm font-medium text-stone-700 transition-colors duration-200" style={{ color: formData.password ? '#134E4A' : undefined }}>
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    data-testid="login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="h-11 pr-10 rounded-xl transition-all duration-200 focus:ring-2 hover:border-[#0F766E]"
                    style={{ 
                      borderColor: formData.password ? '#0F766E' : undefined,
                      '--tw-ring-color': '#134E4A'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 transition-all duration-200 hover:scale-110"
                    style={{ color: showPassword ? '#134E4A' : undefined }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#134E4A'}
                    onMouseLeave={(e) => e.currentTarget.style.color = showPassword ? '#134E4A' : '#9ca3af'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                data-testid="login-submit-button"
                disabled={loading}
                className="w-full h-12 text-white font-semibold rounded-xl transition-all duration-300 active:scale-95 shadow-lg hover:shadow-xl relative overflow-hidden group"
                style={{ 
                  background: loading ? '#0F766E' : 'linear-gradient(135deg, #134E4A 0%, #0F766E 100%)'
                }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Please wait...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </span>
                {/* Animated shine effect */}
                {!loading && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                )}
              </Button>
            </form>

            {/* Footer decoration with rounded design */}
            <div className="mt-6 pt-6 border-t border-stone-100 flex items-center justify-center gap-2 text-xs text-stone-400">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'linear-gradient(135deg, #134E4A, #0F766E)' }}></div>
              <span className="font-medium">Secure Login</span>
              <div className="w-2 h-2 rounded-full animate-pulse delay-150" style={{ background: 'linear-gradient(135deg, #0F766E, #134E4A)' }}></div>
            </div>
          </div>

          {/* Floating particles with rounded shapes */}
          <div className="absolute -z-10 w-full h-full pointer-events-none">
            <div className="absolute top-10 left-10 w-4 h-4 rounded-full animate-float delay-0 shadow-lg" style={{ background: 'linear-gradient(135deg, #134E4A, #0F766E)' }}></div>
            <div className="absolute top-32 right-16 w-3 h-3 rounded-full animate-float delay-200 shadow-lg" style={{ background: 'linear-gradient(135deg, #0F766E, #134E4A)' }}></div>
            <div className="absolute bottom-24 left-20 w-3.5 h-3.5 rounded-full animate-float delay-400 shadow-lg" style={{ background: 'linear-gradient(135deg, #134E4A, #0F766E)' }}></div>
            <div className="absolute bottom-40 right-12 w-4 h-4 rounded-full animate-float delay-600 shadow-lg" style={{ background: 'linear-gradient(135deg, #0F766E, #134E4A)' }}></div>
            <div className="absolute top-1/2 left-1/4 w-2.5 h-2.5 rounded-full animate-float delay-800 shadow-lg" style={{ background: 'linear-gradient(135deg, #134E4A, #0F766E)' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}