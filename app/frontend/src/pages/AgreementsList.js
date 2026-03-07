import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  Plus,
  Search,
  Filter,
  FileText,
  Edit,
  Trash2,
  Eye,
  Calendar,
  ChevronDown,
  X,
  Check,
  Clock,
  Download as DownloadIcon
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

import { API } from '../config';

export default function AgreementsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [agreements, setAgreements] = useState([]);
  const [filteredAgreements, setFilteredAgreements] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [approvalFilter, setApprovalFilter] = useState(searchParams.get('approval_status') || 'all');
  const [departmentFilter, setDepartmentFilter] = useState(searchParams.get('department') || 'all');
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [vendorDropdownOpen, setVendorDropdownOpen] = useState(false);
  const vendorDropdownRef = useRef(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user?.role === 'admin';

  const categories = ['Service Agreement', 'Vendor Contract', 'NDA', 'Partnership', 'Lease Agreement', 'Other'];

  useEffect(() => {
    fetchAgreements();
    fetchVendors();
  }, []);


  useEffect(() => {
    filterAgreements();
  }, [agreements, searchTerm, categoryFilter, statusFilter, approvalFilter, selectedVendors]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(event.target)) {
        setVendorDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAgreements = async () => {
    try {
      const token = localStorage.getItem('token');
      let url = `${API}/agreements`;

      // If a department filter was passed in the URL, send it to the backend
      if (departmentFilter && departmentFilter !== 'all') {
        url += `?department=${departmentFilter}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAgreements(response.data);
    } catch (error) {
      toast.error('Failed to fetch agreements');
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/vendors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVendors(response.data);
    } catch (error) {
      console.error('Failed to fetch vendors');
    }
  };

  const filterAgreements = () => {
    let filtered = [...agreements];

    if (searchTerm) {
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(a => a.category === categoryFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(a => a.status === statusFilter);
    }

    if (approvalFilter !== 'all') {
      filtered = filtered.filter(a => a.approval_status === approvalFilter);
    }

    if (selectedVendors.length > 0) {
      filtered = filtered.filter(a => selectedVendors.includes(a.vendor_name));
    }

    setFilteredAgreements(filtered);
  };

  const exportToExcel = () => {
    if (filteredAgreements.length === 0) {
      toast.error('No data to export');
      return;
    }

    const exportData = filteredAgreements.map(a => ({
      'Title / Description': a.title,
      'Vendor / Customer Name': a.vendor_name || 'N/A',
      'Category': a.category,
      'Origin Department': a.origin_department || 'N/A',
      'Cycle Year': a.cycle_year || 'N/A',
      'Start Date': new Date(a.start_date).toLocaleDateString(),
      'Expiry Date': new Date(a.expiry_date).toLocaleDateString(),
      'Status': a.status.replace('_', ' ').toUpperCase(),
      'Approval Status': a.approval_status ? a.approval_status.toUpperCase() : 'PENDING'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Agreements');

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, `Agreements_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Data exported successfully');
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/agreements/${deleteDialog.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Agreement deleted successfully');
      setDeleteDialog({ open: false, id: null });
      fetchAgreements();
    } catch (error) {
      toast.error('Failed to delete agreement');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      active: { label: 'Active', class: 'status-badge status-active' },
      expiring_soon: { label: 'Expiring Soon', class: 'status-badge status-expiring_soon' },
      expired: { label: 'Expired', class: 'status-badge status-expired' }
    };
    const config = statusMap[status] || statusMap.active;
    return <span className={config.class}>{config.label}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-stone-500">Loading agreements...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="agreements-list">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-stone-900">Agreements</h1>
          <p className="text-base text-stone-600 mt-2">Manage all your agreements in one place</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={exportToExcel}
            variant="outline"
            className="gap-2 h-11 px-4 rounded-md font-medium text-stone-700 bg-white hover:bg-stone-50 transition-all border-stone-200"
            title="Export filtered data to Excel"
          >
            <DownloadIcon size={18} />
            Export to Excel
          </Button>

          {!isAdmin && (
            <Link to="/agreements/new">
              <Button
                className="bg-[#134E4A] hover:bg-[#115E59] text-white gap-2 h-11 px-6 rounded-md font-medium transition-all active:scale-95"
                data-testid="add-new-agreement-button"
              >
                <Plus size={18} />
                Add Agreement
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-stone-200 p-6 shadow-sm">
        <div className={`grid grid-cols-1 gap-4 ${isAdmin ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <Input
              placeholder="Search by title or vendor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
              data-testid="search-input"
            />
          </div>

          <div className="relative" ref={vendorDropdownRef}>
            <button
              type="button"
              onClick={() => setVendorDropdownOpen(!vendorDropdownOpen)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-stone-200 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2"
              data-testid="vendor-filter"
            >
              <span className="truncate text-stone-700">
                {selectedVendors.length === 0
                  ? 'All Vendors'
                  : selectedVendors.length === 1
                    ? selectedVendors[0]
                    : `${selectedVendors.length} vendors selected`}
              </span>
              <div className="flex items-center gap-1">
                {selectedVendors.length > 0 && (
                  <span
                    onClick={(e) => { e.stopPropagation(); setSelectedVendors([]); }}
                    className="rounded-full p-0.5 hover:bg-stone-100 cursor-pointer"
                  >
                    <X size={14} className="text-stone-400" />
                  </span>
                )}
                <ChevronDown size={16} className="text-stone-400" />
              </div>
            </button>
            {vendorDropdownOpen && (
              <div className="absolute z-50 mt-1 w-full rounded-md border border-stone-200 bg-white shadow-lg">
                <div className="max-h-60 overflow-auto p-1">
                  {(() => {
                    const vendorNames = new Set(vendors.map(v => v.name));
                    agreements.forEach(a => { if (a.vendor_name) vendorNames.add(a.vendor_name); });
                    const sortedNames = Array.from(vendorNames).sort();
                    if (sortedNames.length === 0) {
                      return <div className="px-3 py-2 text-sm text-stone-400">No vendors available</div>;
                    }
                    return sortedNames.map(name => {
                      const isSelected = selectedVendors.includes(name);
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => {
                            setSelectedVendors(prev =>
                              isSelected
                                ? prev.filter(v => v !== name)
                                : [...prev, name]
                            );
                          }}
                          className={`flex w-full items-center gap-2 rounded px-3 py-2 text-sm transition-colors ${isSelected ? 'bg-[#F0FDFA] text-[#134E4A]' : 'text-stone-700 hover:bg-stone-50'
                            }`}
                        >
                          <div className={`flex h-4 w-4 items-center justify-center rounded border ${isSelected ? 'border-[#134E4A] bg-[#134E4A]' : 'border-stone-300'
                            }`}>
                            {isSelected && <Check size={12} className="text-white" />}
                          </div>
                          {name}
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-10" data-testid="category-filter">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10" data-testid="status-filter">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>

          {/* Approval Status Filter — admin only */}
          {isAdmin && (
            <Select value={approvalFilter} onValueChange={setApprovalFilter}>
              <SelectTrigger className="h-10" data-testid="approval-filter">
                <SelectValue placeholder="All Approval" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All Approval</SelectItem>
                <SelectItem value="pending">
                  <span className="flex items-center gap-2">
                    <Clock size={13} className="text-amber-500" /> Pending
                  </span>
                </SelectItem>
                <SelectItem value="approved">
                  <span className="flex items-center gap-2">
                    <Check size={13} className="text-green-600" /> Approved
                  </span>
                </SelectItem>
                <SelectItem value="rejected">
                  <span className="flex items-center gap-2">
                    <X size={13} className="text-red-500" /> Rejected
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-stone-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-stone-50">
              <TableHead className="text-xs uppercase font-semibold text-stone-500">Title</TableHead>
              <TableHead className="text-xs uppercase font-semibold text-stone-500">Vendor</TableHead>
              <TableHead className="text-xs uppercase font-semibold text-stone-500">Category</TableHead>
              <TableHead className="text-xs uppercase font-semibold text-stone-500">Origin</TableHead>
              <TableHead className="text-xs uppercase font-semibold text-stone-500">Cycle Year</TableHead>
              <TableHead className="text-xs uppercase font-semibold text-stone-500">Start Date</TableHead>
              <TableHead className="text-xs uppercase font-semibold text-stone-500">Expiry Date</TableHead>
              <TableHead className="text-xs uppercase font-semibold text-stone-500">Status</TableHead>
              {isAdmin && (
                <TableHead className="text-xs uppercase font-semibold text-stone-500">Approval</TableHead>
              )}
              <TableHead className="text-xs uppercase font-semibold text-stone-500 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAgreements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-stone-500">
                  No agreements found
                </TableCell>
              </TableRow>
            ) : (
              filteredAgreements.map((agreement) => (
                <TableRow
                  key={agreement._id || agreement.id}
                  className="hover:bg-stone-50 cursor-pointer transition-colors"
                  data-testid={`agreement-row-${agreement._id || agreement.id}`}
                >
                  <TableCell className="font-medium text-stone-900">{agreement.title}</TableCell>
                  <TableCell className="text-stone-600">{agreement.vendor_name || 'N/A'}</TableCell>
                  <TableCell className="text-stone-600">{agreement.category}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-stone-100 text-stone-800">
                      {agreement.origin_department || 'Unknown'}
                    </span>
                  </TableCell>
                  <TableCell className="text-stone-600">
                    {agreement.cycle_year || new Date(agreement.start_date).getFullYear()}
                  </TableCell>
                  <TableCell className="text-stone-600">
                    {new Date(agreement.start_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-stone-600">
                    {new Date(agreement.expiry_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{getStatusBadge(agreement.status)}</TableCell>
                  {isAdmin && (
                    <TableCell>
                      {agreement.approval_status === 'approved' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          <Check size={11} /> Approved
                        </span>
                      )}
                      {agreement.approval_status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                          <Clock size={11} /> Pending
                        </span>
                      )}
                      {agreement.approval_status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                          <X size={11} /> Rejected
                        </span>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/agreements/${agreement._id || agreement.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-stone-600 hover:text-[#134E4A]"
                          data-testid={`view-agreement-${agreement._id || agreement.id}`}
                        >
                          <Eye size={16} />
                        </Button>
                      </Link>
                      {!isAdmin && (
                        <>
                          <Link to={`/agreements/edit/${agreement._id || agreement.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-stone-600 hover:text-[#134E4A]"
                              data-testid={`edit-agreement-${agreement._id || agreement.id}`}
                            >
                              <Edit size={16} />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                            onClick={() => setDeleteDialog({ open: true, id: agreement._id || agreement.id })}
                            data-testid={`delete-agreement-${agreement._id || agreement.id}`}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, id: null })}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agreement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this agreement? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-stone-200">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}