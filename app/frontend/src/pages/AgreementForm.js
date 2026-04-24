import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Plus } from 'lucide-react';

import { API } from '../config';

export default function AgreementForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const department = user?.department || '';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (user?.role === 'admin') {
      toast.error('Admin users cannot create or edit agreements');
      navigate('/agreements');
    }
  }, [user, navigate]);

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    vendor_id: '',
    category: '',
    start_date: '',
    expiry_date: '',
    cycle_year: new Date().getFullYear(),
    description: ''
  });

  // Quick Add state
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [quickAddData, setQuickAddData] = useState({
    name: '', contact_person: '', email: '', phone: '', address: '',
    type: department === 'Sales' ? 'customer' : department === 'Purchasing' ? 'vendor' : 'barang'
  });

  const DEFAULT_CATEGORIES = ['Service Agreement', 'Vendor Contract', 'NDA', 'Partnership', 'Lease Agreement', 'Other'];
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [categoryInput, setCategoryInput] = useState('');
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const categoryRef = useRef(null);

  // Get the default type for quick-adding based on department
  const getDefaultType = () => {
    switch (department) {
      case 'Sales': return 'customer';
      case 'Purchasing': return 'vendor';
      case 'PPIC': return 'barang';
      default: return 'vendor';
    }
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    setQuickAddLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/vendors`, {
        ...quickAddData,
        // type is already embedded in quickAddData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const newVendor = response.data;
      // Refresh vendor list & auto-select the new one
      await fetchVendors();
      setFormData(prev => ({ ...prev, vendor_id: newVendor.id }));
      setQuickAddData({
        name: '', contact_person: '', email: '', phone: '', address: '',
        type: department === 'Sales' ? 'customer' : department === 'Purchasing' ? 'vendor' : 'barang'
      });
      setQuickAddOpen(false);
      toast.success(`${quickAddData.name} berhasil ditambahkan dan dipilih!`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menambahkan data');
    } finally {
      setQuickAddLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
    fetchCategories();
    if (isEdit) {
      fetchAgreement();
    }
  }, [id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setShowCategorySuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/agreements/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data);
    } catch {
      // fallback to default categories already set
    }
  };

  // department and isAdmin are declared above

  // Determine allowed types based on department (same as VendorsList)
  const getAllowedTypes = () => {
    if (isAdmin) return null; // null means fetch all
    switch (department) {
      case 'Sales': return ['customer'];
      case 'Purchasing': return ['vendor'];
      case 'PPIC': return ['barang', 'jasa', 'forwarder'];
      default: return null;
    }
  };

  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem('token');
      const allowedTypes = getAllowedTypes();
      let url = `${API}/vendors`;
      if (allowedTypes) {
        url += `?type=${allowedTypes.join(',')}`;
      }
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVendors(response.data);
    } catch (error) {
      toast.error('Failed to fetch vendors');
    }
  };

  const fetchAgreement = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/agreements/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const agreement = response.data;
      const catValue = agreement.category || '';
      setFormData({
        title: agreement.title,
        vendor_id: agreement.vendor_id,
        category: catValue,
        start_date: agreement.start_date.split('T')[0],
        expiry_date: agreement.expiry_date.split('T')[0],
        cycle_year: agreement.cycle_year || new Date(agreement.start_date).getFullYear(),
        description: agreement.description || ''
      });
      setCategoryInput(catValue);
    } catch (error) {
      toast.error('Failed to fetch agreement details');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const payload = {
        ...formData,
        start_date: new Date(formData.start_date).toISOString(),
        expiry_date: new Date(formData.expiry_date).toISOString()
      };

      let agreementId = id;

      if (isEdit) {
        await axios.put(`${API}/agreements/${id}`, payload, { headers });
        toast.success('Agreement updated successfully');
      } else {
        const response = await axios.post(`${API}/agreements`, payload, { headers });
        agreementId = response.data.id;
        toast.success('Agreement created successfully');
      }

      // Upload file if present
      if (file) {
        const formDataFile = new FormData();
        formDataFile.append('file', file);
        await axios.post(`${API}/agreements/${agreementId}/upload`, formDataFile, {
          headers: {
            ...headers,
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success('File uploaded successfully');
      }

      navigate('/agreements');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save agreement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl" data-testid="agreement-form">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/agreements')}
          className="gap-2 text-stone-600 hover:text-stone-900 mb-4"
          data-testid="back-button"
        >
          <ArrowLeft size={18} />
          Back to Agreements
        </Button>
        <h1 className="text-4xl font-bold tracking-tight text-stone-900">
          {isEdit ? 'Edit Agreement' : 'New Agreement'}
        </h1>
        <p className="text-base text-stone-600 mt-2">
          {isEdit ? 'Update agreement details' : 'Fill in the details to create a new agreement'}
        </p>
      </div>

      <Card className="bg-white border border-stone-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-stone-900">Agreement Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="title" className="text-sm font-medium text-stone-700">Agreement Title *</Label>
                <Input
                  id="title"
                  data-testid="agreement-title-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter agreement title"
                  required
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor" className="text-sm font-medium text-stone-700">
                  {department === 'Sales' ? 'Customer' :
                    department === 'PPIC' ? 'Barang / Jasa / Forwarder' : 'Vendor'} *
                </Label>
                <Select
                  value={formData.vendor_id}
                  onValueChange={(value) => {
                    if (value === '__quick_add__') {
                      setQuickAddOpen(true);
                    } else {
                      setFormData({ ...formData, vendor_id: value });
                    }
                  }}
                  required
                >
                  <SelectTrigger className="h-10" data-testid="vendor-select">
                    <SelectValue placeholder={`Pilih ${department === 'Sales' ? 'customer' : 'vendor'}`} />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {vendors.map(vendor => (
                      <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>
                    ))}
                    <div className="border-t border-stone-100 mt-1 pt-1">
                      <button
                        type="button"
                        className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-[#134E4A] font-medium hover:bg-stone-50 rounded-sm cursor-pointer"
                        onMouseDown={(e) => { e.preventDefault(); setQuickAddOpen(true); }}
                        data-testid="quick-add-vendor-button"
                      >
                        <Plus size={14} />
                        Tambah {department === 'Sales' ? 'Customer' : department === 'PPIC' ? 'Data' : 'Vendor'} Baru...
                      </button>
                    </div>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2" ref={categoryRef}>
                <Label htmlFor="category" className="text-sm font-medium text-stone-700">Category *</Label>
                <div className="relative">
                  <Input
                    id="category"
                    data-testid="category-select"
                    value={categoryInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCategoryInput(val);
                      setFormData(prev => ({ ...prev, category: val }));
                      const filtered = categories.filter(c =>
                        c.toLowerCase().includes(val.toLowerCase())
                      );
                      setFilteredCategories(filtered);
                      setShowCategorySuggestions(true);
                    }}
                    onFocus={() => {
                      const filtered = categoryInput
                        ? categories.filter(c => c.toLowerCase().includes(categoryInput.toLowerCase()))
                        : categories;
                      setFilteredCategories(filtered);
                      setShowCategorySuggestions(true);
                    }}
                    placeholder="Ketik atau pilih kategori..."
                    required
                    autoComplete="off"
                    className="h-10 pr-8"
                  />
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
                  />
                  {showCategorySuggestions && filteredCategories.length > 0 && (
                    <ul className="absolute z-50 w-full mt-1 bg-white border border-stone-200 rounded-md shadow-lg max-h-52 overflow-y-auto">
                      {filteredCategories.map(cat => (
                        <li key={cat}
                          className="px-3 py-2 text-sm cursor-pointer hover:bg-stone-50 text-stone-800"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setCategoryInput(cat);
                            setFormData(prev => ({ ...prev, category: cat }));
                            setShowCategorySuggestions(false);
                          }}
                        >{cat}</li>
                      ))}
                      {/* If typed value not in list, show option to use it as-is */}
                      {categoryInput.trim() !== '' &&
                        !categories.some(c => c.toLowerCase() === categoryInput.toLowerCase()) && (
                          <li
                            className="px-3 py-2 text-sm cursor-pointer hover:bg-teal-50 text-[#134E4A] font-medium border-t border-stone-100"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setCategoryInput(categoryInput.trim());
                              setFormData(prev => ({ ...prev, category: categoryInput.trim() }));
                              setShowCategorySuggestions(false);
                            }}
                          >
                            + Gunakan "{categoryInput.trim()}"
                          </li>
                        )}
                    </ul>
                  )}
                </div>
              </div>



              <div className="space-y-2">
                <Label htmlFor="cycle_year" className="text-sm font-medium text-stone-700">Cycle Year *</Label>
                <Input
                  id="cycle_year"
                  data-testid="cycle-year-input"
                  type="number"
                  value={formData.cycle_year}
                  onChange={(e) => setFormData({ ...formData, cycle_year: parseInt(e.target.value) || '' })}
                  required
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date" className="text-sm font-medium text-stone-700">Start Date *</Label>
                <Input
                  id="start_date"
                  data-testid="start-date-input"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiry_date" className="text-sm font-medium text-stone-700">Expiry Date *</Label>
                <Input
                  id="expiry_date"
                  data-testid="expiry-date-input"
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  required
                  className="h-10"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-stone-700">Description</Label>
                <Textarea
                  id="description"
                  data-testid="description-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter agreement description (optional)"
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="file" className="text-sm font-medium text-stone-700">
                  Upload Contract File (PDF/DOC)
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="file"
                    data-testid="file-input"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="h-10"
                  />
                  {file && (
                    <span className="text-sm text-stone-600">{file.name}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#134E4A] hover:bg-[#115E59] text-white h-11 px-8 rounded-md font-medium transition-all active:scale-95"
                data-testid="submit-agreement-button"
              >
                {loading ? 'Saving...' : (isEdit ? 'Update Agreement' : 'Create Agreement')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/agreements')}
                className="h-11 px-8 border-stone-200 text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Quick Add Dialog */}
      <Dialog open={quickAddOpen} onOpenChange={setQuickAddOpen}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle>
              Tambah {department === 'Sales' ? 'Customer' : department === 'PPIC' ? 'Barang/Jasa/Forwarder' : 'Vendor'} Baru
            </DialogTitle>
            <DialogDescription>
              Data yang dibuat akan langsung dipilih di form Agreement ini.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleQuickAdd}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-stone-700">Nama *</Label>
                <Input
                  value={quickAddData.name}
                  onChange={(e) => setQuickAddData({ ...quickAddData, name: e.target.value })}
                  placeholder="Masukkan nama"
                  required
                  className="h-10"
                />
              </div>
              {/* Tipe selector - only shown for PPIC since they have 3 types */}
              {department === 'PPIC' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-stone-700">Tipe *</Label>
                  <Select
                    value={quickAddData.type}
                    onValueChange={(val) => setQuickAddData({ ...quickAddData, type: val })}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Pilih tipe" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="barang">Barang</SelectItem>
                      <SelectItem value="jasa">Jasa</SelectItem>
                      <SelectItem value="forwarder">Forwarder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-stone-700">Contact Person</Label>
                <Input
                  value={quickAddData.contact_person}
                  onChange={(e) => setQuickAddData({ ...quickAddData, contact_person: e.target.value })}
                  placeholder="Nama contact person"
                  className="h-10"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-stone-700">Email</Label>
                  <Input
                    type="email"
                    value={quickAddData.email}
                    onChange={(e) => setQuickAddData({ ...quickAddData, email: e.target.value })}
                    placeholder="email@contoh.com"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-stone-700">No. Telepon</Label>
                  <Input
                    value={quickAddData.phone}
                    onChange={(e) => setQuickAddData({ ...quickAddData, phone: e.target.value })}
                    placeholder="08xxxxxxxxx"
                    className="h-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-stone-700">Alamat</Label>
                <Input
                  value={quickAddData.address}
                  onChange={(e) => setQuickAddData({ ...quickAddData, address: e.target.value })}
                  placeholder="Masukkan alamat"
                  className="h-10"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setQuickAddOpen(false)}
                className="border-stone-200"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={quickAddLoading}
                className="bg-[#134E4A] hover:bg-[#115E59] text-white"
              >
                {quickAddLoading ? 'Menyimpan...' : 'Simpan & Pilih'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}