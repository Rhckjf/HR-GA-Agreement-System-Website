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
    Plus,
    Edit,
    Mail,
    UserCog,
    Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getDepartmentConfig, getAllDepartments } from '@/departmentConfig';
import { API } from '../config';

export default function UserManagement() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        email: '',
        password: '',
        role: 'staff',
        department: 'none',
    });

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const departments = getAllDepartments().filter(d => d.name !== 'Admin');

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

    const handleOpenDialog = (user = null) => {
        if (user) {
            // Edit mode
            setIsEditing(true);
            setFormData({
                id: user.id,
                name: user.name,
                email: user.email,
                password: '',
                role: user.role,
                department: user.department || 'none',
            });
        } else {
            // Create mode
            setIsEditing(false);
            setFormData({
                id: '',
                name: '',
                email: '',
                password: '',
                role: 'staff',
                department: 'none',
            });
        }
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setFormData({
            id: '',
            name: '',
            email: '',
            password: '',
            role: 'staff',
            department: 'none',
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!formData.name || !formData.email) {
            toast.error('Name and email are required');
            return;
        }

        if (!isEditing && !formData.password) {
            toast.error('Password is required for new users');
            return;
        }

        if (formData.password && formData.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const payload = {
                name: formData.name,
                email: formData.email,
                role: formData.role,
                department: formData.department === 'none' ? null : formData.department,
            };

            if (formData.password) {
                payload.password = formData.password;
            }

            if (isEditing) {
                // Update user
                const res = await axios.put(
                    `${API}/admin/users/${formData.id}`,
                    payload,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                toast.success('User updated successfully');
                setUsers(users.map(u => u.id === formData.id ? res.data.user : u));
            } else {
                // Create user
                const res = await axios.post(
                    `${API}/admin/users`,
                    payload,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                toast.success('User created successfully');
                setUsers([...users, res.data.user]);
            }

            handleCloseDialog();
        } catch (error) {
            toast.error(error.response?.data?.detail || `Failed to ${isEditing ? 'update' : 'create'} user`);
        } finally {
            setSubmitting(false);
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
                <Button
                    onClick={() => handleOpenDialog()}
                    className="gap-2 bg-[#134E4A] hover:bg-[#0F766E] text-white"
                >
                    <Plus size={18} />
                    Add New User
                </Button>
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
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenDialog(u)}
                                                    className="text-stone-400 hover:text-blue-600 hover:bg-blue-50"
                                                >
                                                    <Edit size={16} />
                                                </Button>
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
                                            </div>
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

            {/* Create/Edit User Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold">
                            {isEditing ? 'Edit User' : 'Create New User'}
                        </DialogTitle>
                        <DialogDescription>
                            {isEditing 
                                ? 'Update user information and assign to department' 
                                : 'Add a new user to the system and assign to department'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4 py-4">
                            {/* Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name" className="flex items-center gap-2">
                                    <UserCircle size={16} className="text-stone-500" />
                                    Full Name *
                                </Label>
                                <Input
                                    id="name"
                                    placeholder="Enter full name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="h-10"
                                />
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="flex items-center gap-2">
                                    <Mail size={16} className="text-stone-500" />
                                    Email *
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="user@company.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    className="h-10"
                                />
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password" className="flex items-center gap-2">
                                    <Shield size={16} className="text-stone-500" />
                                    Password {isEditing && '(leave blank to keep current)'}
                                    {!isEditing && ' *'}
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Minimum 6 characters"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required={!isEditing}
                                    className="h-10"
                                />
                            </div>

                            {/* Role */}
                            <div className="space-y-2">
                                <Label htmlFor="role" className="flex items-center gap-2">
                                    <UserCog size={16} className="text-stone-500" />
                                    Role *
                                </Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                                >
                                    <SelectTrigger className="h-10">
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="staff">Staff</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Department */}
                            <div className="space-y-2">
                                <Label htmlFor="department" className="flex items-center gap-2">
                                    <Building2 size={16} className="text-stone-500" />
                                    Department
                                </Label>
                                <Select
                                    value={formData.department || "none"}
                                    onValueChange={(value) => setFormData({ ...formData, department: value === "none" ? "" : value })}
                                >
                                    <SelectTrigger className="h-10">
                                        <SelectValue placeholder="Select department (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No Department</SelectItem>
                                        {departments.map((dept) => (
                                            <SelectItem key={dept.name} value={dept.name}>
                                                {dept.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-stone-500">
                                    Assign user to a specific department or leave blank for admin access
                                </p>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCloseDialog}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="bg-[#134E4A] hover:bg-[#0F766E] text-white"
                            >
                                {submitting ? 'Saving...' : isEditing ? 'Update User' : 'Create User'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
