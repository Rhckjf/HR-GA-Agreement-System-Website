import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Users,
    Search,
    Trash2,
    Shield,
    ArrowLeft,
    UserCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getDepartmentConfig } from '@/departmentConfig';
import { API } from '../config';

export default function UserManagement() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        if (currentUser.role !== 'admin') {
            navigate('/');
            return;
        }
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API}/admin/users`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsers(res.data);
        } catch (error) {
            toast.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (userId, userName) => {
        if (!window.confirm(`Are you sure you want to delete "${userName}"?`)) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API}/admin/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success('User deleted successfully');
            setUsers(users.filter((u) => u.id !== userId));
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to delete user');
        }
    };

    const filteredUsers = users.filter(
        (u) =>
            u.name?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase()) ||
            u.department?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-stone-500">Loading users...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/admin')}
                        className="text-stone-500 hover:text-stone-900"
                    >
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-stone-900">User Management</h1>
                        <p className="text-sm text-stone-500 mt-1">{users.length} users registered</p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <Input
                    placeholder="Search by name, email, or department..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-10"
                />
            </div>

            {/* Users Table */}
            <Card className="bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-stone-200 bg-stone-50">
                                <th className="text-left p-4 text-xs font-semibold text-stone-600 uppercase tracking-wider">User</th>
                                <th className="text-left p-4 text-xs font-semibold text-stone-600 uppercase tracking-wider">Email</th>
                                <th className="text-left p-4 text-xs font-semibold text-stone-600 uppercase tracking-wider">Department</th>
                                <th className="text-left p-4 text-xs font-semibold text-stone-600 uppercase tracking-wider">Role</th>
                                <th className="text-left p-4 text-xs font-semibold text-stone-600 uppercase tracking-wider">Created</th>
                                <th className="text-right p-4 text-xs font-semibold text-stone-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((u) => {
                                const deptConf = u.department ? getDepartmentConfig(u.department) : null;
                                return (
                                    <tr key={u.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                                                    style={{ backgroundColor: deptConf?.color || '#134E4A' }}
                                                >
                                                    {u.name?.charAt(0)?.toUpperCase() || 'U'}
                                                </div>
                                                <span className="text-sm font-medium text-stone-900">{u.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-stone-600">{u.email}</td>
                                        <td className="p-4">
                                            {u.department ? (
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs font-medium px-2.5 py-0.5"
                                                    style={{
                                                        color: deptConf?.color || '#134E4A',
                                                        borderColor: deptConf?.color || '#134E4A',
                                                        backgroundColor: deptConf?.bgColor || '#F0FDFA',
                                                    }}
                                                >
                                                    {u.department}
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-stone-400">—</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {u.role === 'admin' ? (
                                                <Badge className="bg-[#134E4A] text-white text-xs gap-1">
                                                    <Shield size={12} /> Admin
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-xs">Staff</Badge>
                                            )}
                                        </td>
                                        <td className="p-4 text-xs text-stone-500">
                                            {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="p-4 text-right">
                                            {u.id !== currentUser.id && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(u.id, u.name)}
                                                    className="text-stone-400 hover:text-red-600 hover:bg-red-50"
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-sm text-stone-500">
                                        No users found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
