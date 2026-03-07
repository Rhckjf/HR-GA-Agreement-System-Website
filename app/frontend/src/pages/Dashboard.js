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
  TrendingUp,
  PieChart as PieChartIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { API } from '../config';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [expiringAgreements, setExpiringAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('1m');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user?.role === 'admin';

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

  // Calculate Pie Data based on selected timeframe
  const getPieData = () => {
    if (!stats?.expiry_distribution) return [];
    const dist = stats.expiry_distribution;
    const expired = dist.expired;
    let expiringSoon = 0;

    if (timeframe === '1m') {
      expiringSoon = dist.expiring_soon_1_month;
    } else if (timeframe === '3m') {
      expiringSoon = dist.expiring_soon_1_month + dist.expiring_1_3_months;
    } else if (timeframe === '6m') {
      expiringSoon = dist.expiring_soon_1_month + dist.expiring_1_3_months + dist.expiring_3_6_months;
    } else if (timeframe === '1y') {
      expiringSoon = dist.expiring_soon_1_month + dist.expiring_1_3_months + dist.expiring_3_6_months + dist.expiring_6_12_months;
    }

    const active = Math.max(0, stats.total_agreements - expired - expiringSoon);

    return [
      { name: 'Active', value: active, color: '#059669' },
      { name: 'Expiring Soon', value: expiringSoon, color: '#EAB308' },
      { name: 'Expired', value: expired, color: '#DC2626' },
    ].filter(item => item.value > 0);
  };

  const pieData = getPieData();

  return (
    <div className="space-y-8" data-testid="dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-stone-900">Dashboard</h1>
          <p className="text-base text-stone-600 mt-2">Overview of your agreement management system</p>
        </div>
        {!isAdmin && (
          <Link to="/agreements/new">
            <Button
              className="bg-[#134E4A] hover:bg-[#115E59] text-white gap-2 h-11 px-6 rounded-md font-medium transition-all active:scale-95"
              data-testid="add-agreement-button"
            >
              <Plus size={18} />
              New Agreement
            </Button>
          </Link>
        )}
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

      {/* Charts and Lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Pie Chart Card - Takes up 1 column */}
        <Card className="bg-white border border-stone-200 rounded-lg shadow-sm col-span-1 lg:col-span-1">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg font-semibold text-stone-900 flex items-center gap-2">
              <PieChartIcon size={20} className="text-[#134E4A]" />
              Status Overview
            </CardTitle>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-[110px] h-8 text-xs">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">1 Month</SelectItem>
                <SelectItem value="3m">3 Months</SelectItem>
                <SelectItem value="6m">6 Months</SelectItem>
                <SelectItem value="1y">1 Year</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="h-[300px]">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    formatter={(value, entry) => (
                      <span className="text-xs text-stone-600 font-medium ml-1">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-stone-400 text-sm">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expiring Soon - Takes up 2 columns */}
        <Card className="bg-white border border-stone-200 rounded-lg shadow-sm col-span-1 lg:col-span-2">
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
                    key={agreement._id || agreement.id}
                    to={`/agreements/${agreement._id || agreement.id}`}
                    className="block p-3 rounded-md border border-stone-200 hover:border-[#D97706] hover:bg-amber-50 transition-all"
                    data-testid={`expiring-agreement-${agreement._id || agreement.id}`}
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
      </div>

      {/* Vendor Summary & System Health - Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
    </div>
  );
}