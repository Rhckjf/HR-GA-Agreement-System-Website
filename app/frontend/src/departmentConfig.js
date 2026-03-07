import {
    ShoppingCart,
    TrendingUp,
    ClipboardList,
    Cog,
    Calculator,
    ShieldCheck,
    Factory,
    Users,
    Shield
} from 'lucide-react';

const DEPARTMENTS = {
    Purchasing: {
        name: 'Purchasing',
        label: 'Purchasing Department',
        icon: ShoppingCart,
        color: '#2563EB',
        bgColor: '#EFF6FF',
        gradient: 'from-blue-600 to-blue-800',
        description: 'Manage purchase orders, vendor contracts, and procurement agreements',
        vendorLabel: 'Vendor',
    },
    Sales: {
        name: 'Sales',
        label: 'Sales Department',
        icon: TrendingUp,
        color: '#059669',
        bgColor: '#ECFDF5',
        gradient: 'from-emerald-600 to-emerald-800',
        description: 'Track sales agreements, customer contracts, and revenue targets',
        vendorLabel: 'Customer',
    },
    PPIC: {
        name: 'PPIC',
        label: 'PPIC Department',
        icon: ClipboardList,
        color: '#7C3AED',
        bgColor: '#F5F3FF',
        gradient: 'from-violet-600 to-violet-800',
        description: 'Production planning, inventory control, and supply chain management',
        vendorLabel: 'Barang, Jasa & Forwarder',
    },
    Engineering: {
        name: 'Engineering',
        label: 'Engineering Department',
        icon: Cog,
        color: '#EA580C',
        bgColor: '#FFF7ED',
        gradient: 'from-orange-600 to-orange-800',
        description: 'Technical agreements, engineering contracts, and service level agreements',
        vendorLabel: 'Vendor',
    },
    Accounting: {
        name: 'Accounting',
        label: 'Accounting Department',
        icon: Calculator,
        color: '#0891B2',
        bgColor: '#ECFEFF',
        gradient: 'from-cyan-600 to-cyan-800',
        description: 'Financial agreements, audit contracts, and accounting services',
        vendorLabel: 'Vendor',
    },
    Quality: {
        name: 'Quality',
        label: 'Quality Department',
        icon: ShieldCheck,
        color: '#DC2626',
        bgColor: '#FEF2F2',
        gradient: 'from-red-600 to-red-800',
        description: 'Quality assurance agreements, certification contracts, and compliance',
        vendorLabel: 'Vendor',
    },
    Produksi: {
        name: 'Produksi',
        label: 'Production Department',
        icon: Factory,
        color: '#CA8A04',
        bgColor: '#FEFCE8',
        gradient: 'from-yellow-600 to-yellow-800',
        description: 'Production service agreements, equipment maintenance, and operations',
        vendorLabel: 'Vendor',
    },
    HR: {
        name: 'HR',
        label: 'Human Resources',
        icon: Users,
        color: '#DB2777',
        bgColor: '#FDF2F8',
        gradient: 'from-pink-600 to-pink-800',
        description: 'HR contracts, outsourcing agreements, and employee services',
        vendorLabel: 'Vendor',
    },
};

export const ADMIN_CONFIG = {
    name: 'Admin',
    label: 'Administrator',
    icon: Shield,
    color: '#134E4A',
    bgColor: '#F0FDFA',
    gradient: 'from-teal-700 to-teal-900',
    description: 'Full access to all departments and system management',
};

export const getDepartmentConfig = (dept) => {
    return DEPARTMENTS[dept] || null;
};

export const getAllDepartments = () => {
    return Object.values(DEPARTMENTS);
};

export default DEPARTMENTS;
