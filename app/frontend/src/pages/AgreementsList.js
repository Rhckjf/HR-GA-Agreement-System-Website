import { useState, useEffect } from 'react';
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
  Calendar
} from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

  const categories = ['Service Agreement', 'Vendor Contract', 'NDA', 'Partnership', 'Lease Agreement', 'Other'];

  useEffect(() => {
    fetchAgreements();
  }, []);

  useEffect(() => {
    filterAgreements();
  }, [agreements, searchTerm, categoryFilter, statusFilter]);

  const fetchAgreements = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/agreements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAgreements(response.data);
    } catch (error) {
      toast.error('Failed to fetch agreements');
    } finally {
      setLoading(false);
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

    setFilteredAgreements(filtered);
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
        <Link to="/agreements/new">
          <Button
            className="bg-[#134E4A] hover:bg-[#115E59] text-white gap-2 h-11 px-6 rounded-md font-medium transition-all active:scale-95"
            data-testid="add-new-agreement-button"
          >
            <Plus size={18} />
            Add Agreement
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-stone-200 p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <Input
              placeholder="Search agreements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
              data-testid="search-input"
            />
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
              <TableHead className="text-xs uppercase font-semibold text-stone-500">Start Date</TableHead>
              <TableHead className="text-xs uppercase font-semibold text-stone-500">Expiry Date</TableHead>
              <TableHead className="text-xs uppercase font-semibold text-stone-500">Status</TableHead>
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
                  key={agreement.id}
                  className="border-b border-stone-100 hover:bg-stone-50 transition-colors"
                  data-testid={`agreement-row-${agreement.id}`}
                >
                  <TableCell className="font-medium text-stone-900">{agreement.title}</TableCell>
                  <TableCell className="text-stone-600">{agreement.vendor_name || 'N/A'}</TableCell>
                  <TableCell className="text-stone-600">{agreement.category}</TableCell>
                  <TableCell className="text-stone-600">
                    {new Date(agreement.start_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-stone-600">
                    {new Date(agreement.expiry_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{getStatusBadge(agreement.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/agreements/${agreement.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-stone-600 hover:text-[#134E4A]"
                          data-testid={`view-agreement-${agreement.id}`}
                        >
                          <Eye size={16} />
                        </Button>
                      </Link>
                      <Link to={`/agreements/edit/${agreement.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-stone-600 hover:text-[#134E4A]"
                          data-testid={`edit-agreement-${agreement.id}`}
                        >
                          <Edit size={16} />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                        onClick={() => setDeleteDialog({ open: true, id: agreement.id })}
                        data-testid={`delete-agreement-${agreement.id}`}
                      >
                        <Trash2 size={16} />
                      </Button>
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