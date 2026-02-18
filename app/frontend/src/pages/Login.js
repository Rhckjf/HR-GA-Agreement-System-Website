import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Eye, EyeOff, FileText } from 'lucide-react';
import { getAllDepartments } from '@/departmentConfig';
import { API } from '../config';

const departments = getAllDepartments();

export default function Login({ setIsAuthenticated }) {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    department: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? `${API}/auth/login` : `${API}/auth/register`;
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : { email: formData.email, password: formData.password, name: formData.name, department: formData.department || null };

      const response = await axios.post(endpoint, payload);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setIsAuthenticated(true);
      toast.success(isLogin ? 'Login successful!' : 'Account created successfully!');

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
          backgroundImage: 'url(https://lh3.googleusercontent.com/gps-cs-s/AHVAwepalOYaVcI5cDj-DNIjjs8iJWdpUoIMLTCVIwNL3ZzM1DbQl-LbMKIc4HF-eCCQ0mxtgXCF1lHES1oVolF__gun4E_VnxGe42Lg4xUpVMEg0x7CWiUaZxpCF-1B5jGBQVVgL8iT=s1360-w1360-h1020-rw)'
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
      <div className="flex-1 flex items-center justify-center p-8" style={{ backgroundColor: '#FAFAF9' }}>
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-semibold tracking-tight text-stone-900 mb-2">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-sm text-stone-500">
                {isLogin ? 'Enter your credentials to access your department' : 'Sign up and select your department'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-stone-700">Full Name</Label>
                  <Input
                    id="name"
                    data-testid="register-name-input"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required={!isLogin}
                    className="h-10"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-stone-700">Email</Label>
                <Input
                  id="email"
                  data-testid="login-email-input"
                  type="email"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-stone-700">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    data-testid="login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="h-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="department" className="text-sm font-medium text-stone-700">Department</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => setFormData({ ...formData, department: value })}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select your department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => {
                        const DeptIcon = dept.icon;
                        return (
                          <SelectItem key={dept.name} value={dept.name}>
                            <span className="flex items-center gap-2">
                              <DeptIcon size={14} style={{ color: dept.color }} />
                              {dept.name}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                type="submit"
                data-testid="login-submit-button"
                disabled={loading}
                className="w-full h-11 bg-[#134E4A] hover:bg-[#115E59] text-white font-medium rounded-md transition-all active:scale-95"
              >
                {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-stone-600 hover:text-[#134E4A] font-medium transition-colors"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>

            {isLogin && (
              <div className="mt-6 p-4 bg-stone-50 rounded-md border border-stone-200">
                <p className="text-xs text-stone-500 mb-2 font-medium">Default Credentials:</p>
                <p className="text-xs font-mono text-stone-600">Admin: admin@company.com / Admin123!</p>
                <p className="text-xs font-mono text-stone-600 mt-1">Dept: purchasing@company.com / Dept123!</p>
                <p className="text-xs text-stone-400 mt-1">Available: purchasing, sales, ppic, engineering, accounting, quality, produksi, hr</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}