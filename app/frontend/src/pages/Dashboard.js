import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle,
  Building2,
  Plus,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { API } from '../config';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [expiringAgreements, setExpiringAgreements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, agreementsRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`, { headers }),
        axios.get(`${API}/agreements?status=expiring_soon`, { headers })
      ]);

      setStats(statsRes.data);
      setExpiringAgreements(agreementsRes.data.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-stone-500">Loading dashboard...</div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Agreements',
      value: stats?.total_agreements || 0,
      icon: FileText,
      color: 'text-[#134E4A]',
      bgColor: 'bg-[#F0FDFA]',
    },
    {
      title: 'Active Agreements',
      value: stats?.active_agreements || 0,
      icon: CheckCircle,
      color: 'text-[#059669]',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Expiring Soon',
      value: stats?.expiring_soon || 0,
      icon: AlertCircle,
      color: 'text-[#D97706]',
      bgColor: 'bg-amber-50',
    },
    {
      title: 'Expired',
      value: stats?.expired_agreements || 0,
      icon: XCircle,
      color: 'text-[#DC2626]',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <div className="space-y-8" data-testid="dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-stone-900">Dashboard</h1>
          <p className="text-base text-stone-600 mt-2">Overview of your agreement management system</p>
        </div>
        <Link to="/agreements/new">
          <Button
            className="bg-[#134E4A] hover:bg-[#115E59] text-white gap-2 h-11 px-6 rounded-md font-medium transition-all active:scale-95"
            data-testid="add-agreement-button"
          >
            <Plus size={18} />
            New Agreement
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className="bg-white border border-stone-200 rounded-lg shadow-sm hover:shadow-md transition-all"
              data-testid={`stat-card-${stat.title.toLowerCase().replace(' ', '-')}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-stone-500 mb-2">{stat.title}</p>
                    <p className="text-3xl font-bold text-stone-900">{stat.value}</p>
                  </div>
                  <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
                    <Icon size={24} strokeWidth={2} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expiring Soon */}
        <Card className="bg-white border border-stone-200 rounded-lg shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-semibold text-stone-900 flex items-center gap-2">
              <AlertCircle size={20} className="text-[#D97706]" />
              Agreements Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expiringAgreements.length === 0 ? (
              <p className="text-sm text-stone-500 py-4">No agreements expiring in the next 30 days</p>
            ) : (
              <div className="space-y-3">
                {expiringAgreements.map((agreement) => (
                  <Link
                    key={agreement.id}
                    to={`/agreements/${agreement.id}`}
                    className="block p-3 rounded-md border border-stone-200 hover:border-[#D97706] hover:bg-amber-50 transition-all"
                    data-testid={`expiring-agreement-${agreement.id}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm text-stone-900">{agreement.title}</p>
                        <p className="text-xs text-stone-500 mt-1">{agreement.vendor_name}</p>
                      </div>
                      <span className="text-xs font-semibold text-[#D97706] bg-amber-50 px-2 py-1 rounded-full">
                        {new Date(agreement.expiry_date).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {expiringAgreements.length > 0 && (
              <Link to="/agreements?status=expiring_soon">
                <Button variant="ghost" className="w-full mt-4 text-[#134E4A] hover:bg-[#F0FDFA]">
                  View All
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Vendor Summary */}
        <Card className="bg-white border border-stone-200 rounded-lg shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-semibold text-stone-900 flex items-center gap-2">
              <Building2 size={20} className="text-[#134E4A]" />
              Vendor Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#F0FDFA] rounded-lg">
                <div>
                  <p className="text-2xl font-bold text-stone-900">{stats?.total_vendors || 0}</p>
                  <p className="text-sm text-stone-600 mt-1">Total Vendors</p>
                </div>
                <Building2 size={32} className="text-[#134E4A]" strokeWidth={2} />
              </div>
              <Link to="/vendors">
                <Button
                  className="w-full bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 h-10 rounded-md font-medium transition-all"
                  data-testid="manage-vendors-button"
                >
                  Manage Vendors
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card className="bg-gradient-to-br from-[#134E4A] to-[#115E59] border-0 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-2">System Health</p>
              <p className="text-2xl font-bold">All Systems Operational</p>
            </div>
            <TrendingUp size={40} strokeWidth={2} className="opacity-90" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}