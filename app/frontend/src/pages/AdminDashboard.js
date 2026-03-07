import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    FileText,
    CheckCircle,
    AlertCircle,
    XCircle,
    Building2,
    Plus,
    TrendingUp,
    PieChart as PieChartIcon,
    Users as UsersIcon,
    ArrowRight,
    Clock,
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
import { getAllDepartments, ADMIN_CONFIG } from '@/departmentConfig';
import { API } from '../config';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [expiringAgreements, setExpiringAgreements] = useState([]);
    const [pendingAgreements, setPendingAgreements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState('1m');
    const [userCount, setUserCount] = useState(0);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        if (user.role !== 'admin') {
            navigate(`/department/${user.department}`);
            return;
        }
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const [statsRes, agreementsRes, usersRes, pendingRes] = await Promise.all([
                axios.get(`${API}/dashboard/stats`, { headers }),
                axios.get(`${API}/agreements?status=expiring_soon`, { headers }),
                axios.get(`${API}/admin/users`, { headers }),
                axios.get(`${API}/agreements?approval_status=pending`, { headers }),
            ]);

            setStats(statsRes.data);
            setExpiringAgreements(agreementsRes.data.slice(0, 5));
            setUserCount(usersRes.data.length);
            setPendingAgreements(pendingRes.data.filter(a => a.approval_status === 'pending'));
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-pulse flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-200"></div>
                    <div className="text-stone-500">Loading Admin Dashboard...</div>
                </div>
            </div>
        );
    }

    const departments = getAllDepartments();

    const statCards = [
        {
            title: 'Total Agreements',
            value: stats?.total_agreements || 0,
            icon: FileText,
            color: '#134E4A',
            bgColor: '#F0FDFA',
        },
        {
            title: 'Active',
            value: stats?.active_agreements || 0,
            icon: CheckCircle,
            color: '#059669',
            bgColor: '#ECFDF5',
        },
        {
            title: 'Expiring Soon',
            value: stats?.expiring_soon || 0,
            icon: AlertCircle,
            color: '#D97706',
            bgColor: '#FFFBEB',
        },
        {
            title: 'Expired',
            value: stats?.expired_agreements || 0,
            icon: XCircle,
            color: '#DC2626',
            bgColor: '#FEF2F2',
        },
    ];

    const getPieData = () => {
        if (!stats?.expiry_distribution) return [];
        const dist = stats.expiry_distribution;
        const expired = dist.expired;
        let expiringSoon = 0;

        if (timeframe === '1m') expiringSoon = dist.expiring_soon_1_month;
        else if (timeframe === '3m') expiringSoon = dist.expiring_soon_1_month + dist.expiring_1_3_months;
        else if (timeframe === '6m') expiringSoon = dist.expiring_soon_1_month + dist.expiring_1_3_months + dist.expiring_3_6_months;
        else if (timeframe === '1y') expiringSoon = dist.expiring_soon_1_month + dist.expiring_1_3_months + dist.expiring_3_6_months + dist.expiring_6_12_months;

        const active = Math.max(0, stats.total_agreements - expired - expiringSoon);

        return [
            { name: 'Active', value: active, color: '#059669' },
            { name: 'Expiring Soon', value: expiringSoon, color: '#EAB308' },
            { name: 'Expired', value: expired, color: '#DC2626' },
        ].filter(item => item.value > 0);
    };

    const pieData = getPieData();

    return (
        <div className="space-y-8">
            {/* Admin Header */}
            <div className="relative overflow-hidden rounded-xl p-8 text-white"
                style={{ background: 'linear-gradient(135deg, #134E4A, #0F766E)' }}
            >
                <div className="absolute top-0 right-0 w-64 h-64 opacity-5">
                    <ADMIN_CONFIG.icon size={256} />
                </div>
                <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                        <p className="text-white/80 mt-1">Complete overview of all departments and system management</p>
                    </div>
                    <div className="flex gap-3">

                        <Link to="/admin/users">
                            <Button className="gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm">
                                <UsersIcon size={18} />
                                Manage Users
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={index} className="bg-white border border-stone-200 rounded-lg shadow-sm hover:shadow-md transition-all">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-stone-500 mb-1">{stat.title}</p>
                                        <p className="text-2xl font-bold text-stone-900">{stat.value}</p>
                                    </div>
                                    <div className="p-2.5 rounded-lg" style={{ backgroundColor: stat.bgColor, color: stat.color }}>
                                        <Icon size={20} strokeWidth={2} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Department Grid */}
            <div>
                <h2 className="text-xl font-semibold text-stone-900 mb-4">Departments</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {departments.map((dept) => {
                        const DeptIcon = dept.icon;
                        return (
                            <Link
                                key={dept.name}
                                to={`/department/${dept.name}`}
                                className="group block"
                            >
                                <Card className="bg-white border border-stone-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group-hover:-translate-y-1">
                                    <div className="h-2" style={{ backgroundColor: dept.color }}></div>
                                    <CardContent className="p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="p-2.5 rounded-lg" style={{ backgroundColor: dept.bgColor, color: dept.color }}>
                                                <DeptIcon size={22} strokeWidth={2} />
                                            </div>
                                            <ArrowRight size={16} className="text-stone-300 group-hover:text-stone-500 transition-colors" />
                                        </div>
                                        <h3 className="text-base font-semibold text-stone-900 mb-1">{dept.name}</h3>
                                        <p className="text-xs text-stone-500 line-clamp-2">{dept.description}</p>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Pending Approval Section */}
            <Card className="bg-white border border-stone-200 rounded-lg shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-semibold text-stone-900 flex items-center gap-2">
                            <Clock size={20} className="text-amber-500" />
                            Menunggu Persetujuan
                            {pendingAgreements.length > 0 && (
                                <span className="ml-2 inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                                    {pendingAgreements.length}
                                </span>
                            )}
                        </CardTitle>
                        <Link to="/agreements">
                            <Button variant="ghost" size="sm" className="text-stone-500 hover:text-stone-900 gap-1 text-xs">
                                Lihat Semua <ArrowRight size={14} />
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    {pendingAgreements.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-stone-400">
                            <CheckCircle size={36} className="mb-2 text-green-400" />
                            <p className="text-sm font-medium">Tidak ada agreement yang menunggu persetujuan</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {pendingAgreements.map((agreement) => (
                                <Link
                                    key={agreement._id || agreement.id}
                                    to={`/agreements/${agreement._id || agreement.id}`}
                                    className="block p-4 rounded-lg border border-amber-200 bg-amber-50 hover:border-amber-400 hover:bg-amber-100 transition-all"
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm text-stone-900 truncate">{agreement.title}</p>
                                            <p className="text-xs text-stone-500 mt-0.5">{agreement.vendor_name || '-'}</p>
                                            <p className="text-xs text-stone-400 mt-1">
                                                Dibuat: {new Date(agreement.created_at).toLocaleDateString('id-ID')}
                                            </p>
                                        </div>
                                        <span className="shrink-0 text-xs font-semibold text-amber-700 bg-amber-200 px-2 py-1 rounded-full flex items-center gap-1">
                                            <Clock size={10} /> Pending
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Charts and Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pie Chart */}
                <Card className="bg-white border border-stone-200 rounded-lg shadow-sm">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-lg font-semibold text-stone-900 flex items-center gap-2">
                            <PieChartIcon size={20} className="text-[#134E4A]" />
                            Global Status
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
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle"
                                        formatter={(value) => <span className="text-xs text-stone-600 font-medium ml-1">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-stone-400 text-sm">No data available</div>
                        )}
                    </CardContent>
                </Card>

                {/* Expiring Soon */}
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
                                        className="block p-3 rounded-md border border-stone-200 hover:border-amber-400 hover:bg-amber-50 transition-all"
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
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="bg-white border border-stone-200 rounded-lg shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold text-stone-900 flex items-center gap-2">
                            <Building2 size={20} className="text-[#134E4A]" />
                            Vendors
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-4 bg-[#F0FDFA] rounded-lg mb-4">
                            <div>
                                <p className="text-2xl font-bold text-stone-900">{stats?.total_vendors || 0}</p>
                                <p className="text-sm text-stone-600">Total Vendors</p>
                            </div>
                            <Building2 size={32} className="text-[#134E4A]" strokeWidth={2} />
                        </div>
                        <Link to="/vendors">
                            <Button className="w-full bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 h-10 rounded-md font-medium">
                                Manage Vendors
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card className="bg-white border border-stone-200 rounded-lg shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold text-stone-900 flex items-center gap-2">
                            <UsersIcon size={20} className="text-[#134E4A]" />
                            Users
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-4 bg-[#F0FDFA] rounded-lg mb-4">
                            <div>
                                <p className="text-2xl font-bold text-stone-900">{userCount}</p>
                                <p className="text-sm text-stone-600">Total Users</p>
                            </div>
                            <UsersIcon size={32} className="text-[#134E4A]" strokeWidth={2} />
                        </div>
                        <Link to="/admin/users">
                            <Button className="w-full bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 h-10 rounded-md font-medium">
                                Manage Users
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card className="border-0 text-white" style={{ background: 'linear-gradient(135deg, #134E4A, #0F766E)' }}>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm opacity-90 mb-2">System Health</p>
                                <p className="text-2xl font-bold">All Systems Operational</p>
                                <p className="text-sm opacity-75 mt-2">{departments.length} departments active</p>
                            </div>
                            <TrendingUp size={40} strokeWidth={2} className="opacity-90" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
