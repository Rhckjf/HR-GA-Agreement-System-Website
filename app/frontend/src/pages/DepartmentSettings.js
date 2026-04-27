import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Save,
    ArrowLeft,
    Mail,
    Plus,
    X,
    Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { API } from '../config';
import { getAllDepartments, getDepartmentConfig } from '@/departmentConfig';

export default function DepartmentSettings() {
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const [departments] = useState(getAllDepartments());
    const [selectedDept, setSelectedDept] = useState(null);
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (currentUser.role !== 'admin') {
            navigate('/');
            return;
        }
        if (departments.length > 0) {
            handleSelectDept(departments[0].name);
        }
    }, []);

    const handleSelectDept = async (deptName) => {
        setSelectedDept(deptName);
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API}/department-settings/${deptName}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Limit to 1 for Admin, 5 for other departments
            const limit = deptName === 'Admin' ? 1 : 5;
            const savedEmails = res.data?.emails || [];
            const paddedEmails = [...savedEmails];
            while (paddedEmails.length < limit) {
                paddedEmails.push('');
            }
            setEmails(paddedEmails.slice(0, limit));
        } catch (error) {
            toast.error('Failed to load department settings');
        } finally {
            setLoading(false);
        }
    };

    const handleEmailChange = (index, value) => {
        const newEmails = [...emails];
        newEmails[index] = value;
        setEmails(newEmails);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            // send only valid emails to backend
            const validEmails = emails.filter(e => e.trim() !== '');
            await axios.put(`${API}/department-settings/${selectedDept}`, 
                { emails: validEmails },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`${selectedDept} email settings saved successfully`);
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

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
                        <h1 className="text-3xl font-bold tracking-tight text-stone-900">Department Settings</h1>
                        <p className="text-sm text-stone-500 mt-1">Configure automated email recipients for each department.</p>
                    </div>
                </div>
            </div>

            <div className="flex gap-6 flex-col lg:flex-row">
                {/* Department List */}
                <div className="w-full lg:w-1/3 flex-shrink-0">
                    <Card className="bg-white border-stone-200">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Building2 size={18} /> Departments
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ul className="divide-y divide-stone-100">
                                {departments.map(dept => {
                                    const DeptIcon = dept.icon;
                                    const isSelected = selectedDept === dept.name;
                                    return (
                                        <li 
                                            key={dept.name}
                                            onClick={() => handleSelectDept(dept.name)}
                                            className={`p-4 flex items-center gap-3 cursor-pointer transition-colors hover:bg-stone-50 border-l-4 ${isSelected ? 'border-primary bg-primary/5' : 'border-transparent'}`}
                                            style={{ borderLeftColor: isSelected ? dept.color : 'transparent' }}
                                        >
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: dept.color }}>
                                                <DeptIcon size={16} />
                                            </div>
                                            <span className={`font-medium ${isSelected ? 'text-stone-900' : 'text-stone-600'}`}>{dept.name}</span>
                                        </li>
                                    )
                                })}
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                {/* Email Inputs */}
                <div className="w-full lg:w-2/3">
                    <Card className="bg-white border-stone-200">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Mail size={18} className="text-stone-500" />
                                Notification Recipients
                            </CardTitle>
                            <CardDescription>
                                Set up to {selectedDept === 'Admin' ? '1' : '5'} Outlook accounts or email addresses that will receive agreement expiration notices for {selectedDept}.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {loading ? (
                                <div className="text-center p-6 text-stone-500 animate-pulse">Loading settings...</div>
                            ) : (
                                <>
                                    {emails.map((email, i) => (
                                        <div key={i} className="flex flex-col gap-1.5">
                                            <label className="text-sm font-medium text-stone-700">Recipient Email {i + 1}</label>
                                            <Input 
                                                type="email"
                                                placeholder={`e.g. staff${i+1}@company.com`}
                                                value={email}
                                                onChange={(e) => handleEmailChange(i, e.target.value)}
                                                className="w-full"
                                            />
                                        </div>
                                    ))}
                                    
                                    <div className="pt-4 flex justify-end">
                                        <Button 
                                            onClick={handleSave} 
                                            disabled={saving}
                                            className="px-6 flex items-center gap-2"
                                        >
                                            <Save size={16} />
                                            {saving ? 'Saving...' : 'Save Configuration'}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
