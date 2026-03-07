import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
    ArrowLeft,
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
import { getDepartmentConfig } from '@/departmentConfig';
import { API } from '../config';

export default function DepartmentDashboard() {
    const { dept } = useParams();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [expiringAgreements, setExpiringAgreements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState('1m');

    const deptConfig = getDepartmentConfig(dept);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        // Access control: staff can only access their own department
        if (user.role !== 'admin' && user.department !== dept) {
            navigate(`/department/${user.department}`);
            return;
        }
        fetchData();
    }, [dept]);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const [statsRes, agreementsRes] = await Promise.all([
                axios.get(`${API}/dashboard/stats?department=${dept}`, { headers }),
                axios.get(`${API}/agreements?status=expiring_soon&department=${dept}`, { headers })
            ]);

            setStats(statsRes.data);
            setExpiringAgreements(agreementsRes.data.slice(0, 5));
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!deptConfig) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-stone-500">Department not found</div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-pulse flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full" style={{ backgroundColor: deptConfig.color, opacity: 0.3 }}></div>
                    <div className="text-stone-500">Loading {deptConfig.label}...</div>
                </div>
            </div>
        );
    }

    const DeptIcon = deptConfig.icon;
    const vendorLabel = deptConfig.vendorLabel || 'Vendor';

    const statCards = [
        {
            title: 'Total Agreements',
            value: stats?.total_agreements || 0,
            icon: FileText,
            color: deptConfig.color,
            bgColor: deptConfig.bgColor,
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
            {/* Department Header */}
            <div className="relative overflow-hidden rounded-xl p-8 text-white"
                style={{
                    background: `linear-gradient(135deg, ${deptConfig.color}, ${deptConfig.color}dd)`,
                }}
            >
                <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
                    <DeptIcon size={256} />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        {user.role === 'admin' && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate('/admin')}
                                className="text-white/80 hover:text-white hover:bg-white/10 -ml-2"
                            >
                                <ArrowLeft size={20} />
                            </Button>
                        )}
                        <DeptIcon size={32} strokeWidth={2} />
                        <h1 className="text-3xl font-bold tracking-tight">{deptConfig.label}</h1>
                    </div>
                    <p className="text-white/80 mt-1 max-w-lg">{deptConfig.description}</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3">
                <Link to="/agreements/new">
                    <Button
                        className="gap-2 h-11 px-6 rounded-md font-medium transition-all active:scale-95 text-white"
                        style={{ backgroundColor: deptConfig.color }}
                    >
                        <Plus size={18} />
                        New Agreement
                    </Button>
                </Link>
                <Link to={user.role === 'admin' ? `/agreements?department=${dept}` : '/agreements'}>
                    <Button variant="outline" className="gap-2 h-11 px-6 rounded-md font-medium">
                        <FileText size={18} />
                        View All Agreements
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
                        >
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-stone-500 mb-2">{stat.title}</p>
                                        <p className="text-3xl font-bold text-stone-900">{stat.value}</p>
                                    </div>
                                    <div className="p-3 rounded-lg" style={{ backgroundColor: stat.bgColor, color: stat.color }}>
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
                {/* Pie Chart */}
                <Card className="bg-white border border-stone-200 rounded-lg shadow-sm">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-lg font-semibold text-stone-900 flex items-center gap-2">
                            <PieChartIcon size={20} style={{ color: deptConfig.color }} />
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
                            <div className="flex items-center justify-center h-full text-stone-400 text-sm">
                                No data available
                            </div>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white border border-stone-200 rounded-lg shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-xl font-semibold text-stone-900 flex items-center gap-2">
                            <Building2 size={20} style={{ color: deptConfig.color }} />
                            {vendorLabel} Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: deptConfig.bgColor }}>
                                <div>
                                    <p className="text-2xl font-bold text-stone-900">{stats?.total_vendors || 0}</p>
                                    <p className="text-sm text-stone-600 mt-1">Total {vendorLabel}s</p>
                                </div>
                                <Building2 size={32} style={{ color: deptConfig.color }} strokeWidth={2} />
                            </div>
                            <Link to="/vendors">
                                <Button className="w-full bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 h-10 rounded-md font-medium transition-all">
                                    Manage {vendorLabel}s
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 text-white" style={{
                    background: `linear-gradient(135deg, ${deptConfig.color}, ${deptConfig.color}cc)`,
                }}>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm opacity-90 mb-2">Department Status</p>
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
