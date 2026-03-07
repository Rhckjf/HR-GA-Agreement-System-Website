import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Building2, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

import { API } from '../config';

export default function VendorsList() {
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [editingVendor, setEditingVendor] = useState(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user?.role === 'admin';
  const department = user?.department || '';

  // Determine allowed types based on department
  const getAllowedTypes = () => {
    if (isAdmin) return ['barang', 'jasa', 'customer', 'vendor', 'forwarder'];
    switch (department) {
      case 'Sales': return ['customer'];
      case 'Purchasing': return ['vendor'];
      case 'PPIC': return ['barang', 'jasa', 'forwarder'];
      default: return []; // Or default types if they shouldn't see anything
    }
  };
  const allowedTypes = getAllowedTypes();

  const [typeFilter, setTypeFilter] = useState('all');

  const getInitialFormState = () => ({
    name: '',
    type: allowedTypes.length > 0 ? allowedTypes[0] : 'barang',
    contact_person: '',
    email: '',
    phone: '',
    address: ''
  });

  const [formData, setFormData] = useState(getInitialFormState());

  useEffect(() => {
    filterVendors();
  }, [vendors, typeFilter]);

  const filterVendors = () => {
    if (typeFilter === 'all') {
      setFilteredVendors(vendors);
    } else {
      setFilteredVendors(vendors.filter(v => v.type === typeFilter));
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem('token');
      // If not admin and has allowed types, fetch only those types
      let url = `${API}/vendors`;
      if (!isAdmin && allowedTypes.length > 0) {
        url += `?type=${allowedTypes.join(',')}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVendors(response.data);
      setFilteredVendors(response.data);
    } catch (error) {
      toast.error('Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (vendor = null) => {
    if (vendor) {
      setEditingVendor(vendor);
      setFormData({
        name: vendor.name,
        type: vendor.type || allowedTypes[0] || 'barang',
        contact_person: vendor.contact_person || '',
        email: vendor.email || '',
        phone: vendor.phone || '',
        address: vendor.address || ''
      });
    } else {
      setEditingVendor(null);
      setFormData(getInitialFormState());
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (editingVendor) {
        await axios.put(`${API}/vendors/${editingVendor.id}`, formData, { headers });
        toast.success('Vendor updated successfully');
      } else {
        await axios.post(`${API}/vendors`, formData, { headers });
        toast.success('Vendor created successfully');
      }

      setDialogOpen(false);
      fetchVendors();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save vendor');
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/vendors/${deleteDialog.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Vendor deleted successfully');
      setDeleteDialog({ open: false, id: null });
      fetchVendors();
    } catch (error) {
      toast.error('Failed to delete vendor');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-stone-500">Loading master data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="vendors-list">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-stone-900">
            {isAdmin ? 'Master Data' :
              department === 'Sales' ? 'Customers' :
                department === 'Purchasing' ? 'Vendors' :
                  department === 'PPIC' ? 'Barang, Jasa & Forwarder' : 'Master Data'}
          </h1>
          <p className="text-base text-stone-600 mt-2">
            {isAdmin
              ? 'Kelola semua master data: Customer, Vendor, Barang, Jasa & Forwarder'
              : `Manage your ${department === 'Sales' ? 'customer' : 'vendor'} contacts and information`
            }
          </p>
        </div>
        <div className="flex gap-4">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px] h-11 bg-white" data-testid="vendor-type-filter">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {allowedTypes.includes('barang') && <SelectItem value="barang">Barang</SelectItem>}
              {allowedTypes.includes('jasa') && <SelectItem value="jasa">Jasa</SelectItem>}
              {allowedTypes.includes('customer') && <SelectItem value="customer">Customer</SelectItem>}
              {allowedTypes.includes('vendor') && <SelectItem value="vendor">Vendor</SelectItem>}
              {allowedTypes.includes('forwarder') && <SelectItem value="forwarder">Forwarder</SelectItem>}
            </SelectContent>
          </Select>
          {!isAdmin && allowedTypes.length > 0 && (
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-[#134E4A] hover:bg-[#115E59] text-white gap-2 h-11 px-6 rounded-md font-medium transition-all active:scale-95"
              data-testid="add-vendor-button"
            >
              <Plus size={18} />
              Add {department === 'Sales' ? 'Customer' : 'Vendor'}
            </Button>
          )}
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVendors.length === 0 ? (
          <div className="col-span-full text-center py-12 text-stone-500">
            No records found. Create your first entry to get started.
          </div>
        ) : (
          filteredVendors.map((vendor) => (
            <Card
              key={vendor.id}
              className="bg-white border border-stone-200 shadow-sm hover:shadow-md transition-all"
              data-testid={`vendor-card-${vendor.id}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#F0FDFA] p-2 rounded-lg">
                      <Building2 size={20} className="text-[#134E4A]" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-stone-900">{vendor.name}</CardTitle>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${vendor.type === 'barang' ? 'bg-blue-100 text-blue-700' :
                        vendor.type === 'jasa' ? 'bg-purple-100 text-purple-700' :
                          vendor.type === 'customer' ? 'bg-green-100 text-green-700' :
                            vendor.type === 'vendor' ? 'bg-orange-100 text-orange-700' :
                              'bg-teal-100 text-teal-700' // forwarder
                        }`}>
                        {vendor.type ? vendor.type.charAt(0).toUpperCase() + vendor.type.slice(1) : 'Barang'}
                      </span>
                    </div>
                  </div>
                  {!isAdmin && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-stone-600 hover:text-[#134E4A]"
                        onClick={() => handleOpenDialog(vendor)}
                        data-testid={`edit-vendor-${vendor.id}`}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                        onClick={() => setDeleteDialog({ open: true, id: vendor.id })}
                        data-testid={`delete-vendor-${vendor.id}`}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {vendor.contact_person && (
                  <div className="flex items-center gap-2 text-sm text-stone-600">
                    <span className="font-medium">Contact:</span>
                    <span>{vendor.contact_person}</span>
                  </div>
                )}
                {vendor.email && (
                  <div className="flex items-center gap-2 text-sm text-stone-600">
                    <Mail size={14} />
                    <span>{vendor.email}</span>
                  </div>
                )}
                {vendor.phone && (
                  <div className="flex items-center gap-2 text-sm text-stone-600">
                    <Phone size={14} />
                    <span>{vendor.phone}</span>
                  </div>
                )}
                {vendor.address && (
                  <div className="text-sm text-stone-500 pt-2 border-t border-stone-100">
                    {vendor.address}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingVendor
                ? `Edit ${department === 'Sales' ? 'Customer' : department === 'PPIC' ? 'Data' : 'Vendor'}`
                : `Add New ${department === 'Sales' ? 'Customer' : department === 'PPIC' ? 'Barang / Jasa / Forwarder' : 'Vendor'}`
              }
            </DialogTitle>
            <DialogDescription>
              {editingVendor
                ? `Update ${department === 'Sales' ? 'customer' : 'vendor'} information`
                : `Create a new ${department === 'Sales' ? 'customer' : 'vendor'} entry`
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {/* Name field - label changes per department */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-stone-700">
                  {department === 'Sales' ? 'Customer Name' :
                    department === 'PPIC' ? 'Nama' : 'Vendor Name'} *
                </Label>
                <Input
                  id="name"
                  data-testid="vendor-name-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={`Enter ${department === 'Sales' ? 'customer' : 'vendor'} name`}
                  required
                  className="h-10"
                />
              </div>

              {/* Vendor Type - only shown for PPIC (multiple types) */}
              {department === 'PPIC' && (
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-medium text-stone-700">Tipe *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(val) => setFormData({ ...formData, type: val })}
                  >
                    <SelectTrigger id="type" className="h-10">
                      <SelectValue placeholder="Pilih tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="barang">Barang</SelectItem>
                      <SelectItem value="jasa">Jasa</SelectItem>
                      <SelectItem value="forwarder">Forwarder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Contact Person - hidden for Sales (customers don't have this) */}
              {department !== 'Sales' && (
                <div className="space-y-2">
                  <Label htmlFor="contact_person" className="text-sm font-medium text-stone-700">Contact Person</Label>
                  <Input
                    id="contact_person"
                    data-testid="contact-person-input"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    placeholder="Enter contact person name"
                    className="h-10"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-stone-700">Email</Label>
                <Input
                  id="email"
                  data-testid="vendor-email-input"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={`${department === 'Sales' ? 'customer' : 'vendor'}@example.com`}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-stone-700">Phone</Label>
                <Input
                  id="phone"
                  data-testid="vendor-phone-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+62 8xx-xxxx-xxxx"
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium text-stone-700">Address</Label>
                <Input
                  id="address"
                  data-testid="vendor-address-input"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder={`Enter ${department === 'Sales' ? 'customer' : 'vendor'} address`}
                  className="h-10"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="border-stone-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#134E4A] hover:bg-[#115E59] text-white"
                data-testid="submit-vendor-button"
              >
                {editingVendor ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, id: null })}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this vendor? This action cannot be undone.
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
    </div >
  );
}