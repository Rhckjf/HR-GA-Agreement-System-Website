import { useState, useEffect } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Upload } from 'lucide-react';

import { API } from '../config';

export default function AgreementForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    vendor_id: '',
    category: '',
    start_date: '',
    expiry_date: '',
    description: ''
  });

  const categories = ['Service Agreement', 'Vendor Contract', 'NDA', 'Partnership', 'Lease Agreement', 'Other'];

  useEffect(() => {
    fetchVendors();
    if (isEdit) {
      fetchAgreement();
    }
  }, [id]);

  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/vendors`, {
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
      setFormData({
        title: agreement.title,
        vendor_id: agreement.vendor_id,
        category: agreement.category,
        start_date: agreement.start_date.split('T')[0],
        expiry_date: agreement.expiry_date.split('T')[0],
        description: agreement.description || ''
      });
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
                <Label htmlFor="vendor" className="text-sm font-medium text-stone-700">Vendor *</Label>
                <Select
                  value={formData.vendor_id}
                  onValueChange={(value) => setFormData({ ...formData, vendor_id: value })}
                  required
                >
                  <SelectTrigger className="h-10" data-testid="vendor-select">
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {vendors.map(vendor => (
                      <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium text-stone-700">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  required
                >
                  <SelectTrigger className="h-10" data-testid="category-select">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
    </div>
  );
}