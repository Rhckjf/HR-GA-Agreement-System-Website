import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  ArrowLeft,
  FileText,
  Building2,
  Calendar,
  Tag,
  User,
  Edit,
  Download,
  AlertCircle
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

import { API } from '../config';

export default function AgreementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agreement, setAgreement] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchAgreement(), fetchCurrentUser()]);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user');
    }
  };

  const fetchAgreement = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/agreements/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAgreement(response.data);
      if (response.data.file_path) {
        fetchPreview(response.data.id);
      }
    } catch (error) {
      toast.error('Failed to fetch agreement details');
    }
  };

  const fetchPreview = async (agreementId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/agreements/${agreementId}/preview`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = URL.createObjectURL(response.data);
      setPreviewUrl(url);
    } catch (error) {
      console.error('Failed to load preview');
    }
  };

  const handleDownload = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/agreements/${id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', agreement.file_path.split(/[/\\]/).pop()); // Extract filename (handle both / and \\)
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  const handleApprove = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/agreements/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Agreement approved');
      fetchAgreement();
    } catch (error) {
      toast.error('Failed to approve agreement');
    }
  };

  const handleReject = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/agreements/${id}/reject`, { reason: rejectReason }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Agreement rejected');
      setRejectDialogOpen(false);
      fetchAgreement();
    } catch (error) {
      toast.error('Failed to reject agreement');
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
        <div className="text-stone-500">Loading agreement details...</div>
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-stone-500">Agreement not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl" data-testid="agreement-detail">
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-stone-900">{agreement.title}</h1>
            <div className="flex items-center gap-3 mt-3">
              {getStatusBadge(agreement.status)}
              <span className="text-sm text-stone-500">
                Created {new Date(agreement.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          {currentUser?.role !== 'admin' && (
            <Button
              onClick={() => navigate(`/agreements/edit/${id}`)}
              className="bg-[#134E4A] hover:bg-[#115E59] text-white gap-2 h-11 px-6 rounded-md font-medium transition-all active:scale-95"
              data-testid="edit-agreement-button"
            >
              <Edit size={18} />
              Edit Agreement
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <Card className="lg:col-span-2 bg-white border border-stone-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-stone-900">Agreement Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 text-sm text-stone-500 mb-2">
                  <Building2 size={16} />
                  <span>Vendor</span>
                </div>
                <p className="text-base font-medium text-stone-900">{agreement.vendor_name || 'N/A'}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-stone-500 mb-2">
                  <Tag size={16} />
                  <span>Category</span>
                </div>
                <p className="text-base font-medium text-stone-900">{agreement.category}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-stone-500 mb-2">
                  <Building2 size={16} />
                  <span>Origin Department</span>
                </div>
                <p className="text-base font-medium text-stone-900">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-800">
                    {agreement.origin_department || 'Unknown'}
                  </span>
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-stone-500 mb-2">
                  <Calendar size={16} />
                  <span>Start Date</span>
                </div>
                <p className="text-base font-medium text-stone-900">
                  {new Date(agreement.start_date).toLocaleDateString()}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-stone-500 mb-2">
                  <Calendar size={16} />
                  <span>Expiry Date</span>
                </div>
                <p className="text-base font-medium text-stone-900">
                  {new Date(agreement.expiry_date).toLocaleDateString()}
                </p>
              </div>
            </div>

            {agreement.description && (
              <div>
                <div className="flex items-center gap-2 text-sm text-stone-500 mb-2">
                  <FileText size={16} />
                  <span>Description</span>
                </div>
                <p className="text-base text-stone-700 leading-relaxed">{agreement.description}</p>
              </div>
            )}

            {agreement.file_path && (
              <div className="pt-4 border-t border-stone-200">
                <Button
                  onClick={handleDownload}
                  className="bg-stone-100 text-stone-700 hover:bg-stone-200 gap-2 h-10 px-4 rounded-md font-medium transition-all"
                  data-testid="download-file-button"
                >
                  <Download size={16} />
                  Download Contract
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card className="bg-white border border-stone-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-stone-900">Status Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-stone-500 mb-2">Current Status</p>
                {getStatusBadge(agreement.status)}
              </div>

              {agreement.status === 'expiring_soon' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={18} className="text-[#D97706] mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-900">Expiring Soon</p>
                      <p className="text-xs text-amber-700 mt-1">
                        This agreement will expire within 30 days. Please take necessary action.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {agreement.status === 'expired' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={18} className="text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-900">Expired</p>
                      <p className="text-xs text-red-700 mt-1">
                        This agreement has expired. Renewal required.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

          </Card>

          {/* Approval Workflow */}
          <Card className="bg-white border border-stone-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-stone-900">Approval Workflow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-stone-500 mb-1">Approval Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${agreement.approval_status === 'approved' ? 'bg-green-100 text-green-800' :
                  agreement.approval_status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                  {agreement.approval_status ? agreement.approval_status.toUpperCase() : 'PENDING'}
                </span>
              </div>

              {agreement.approval_status === 'approved' && agreement.approved_by && (
                <div>
                  <p className="text-sm text-stone-500 mb-1">Approved By</p>
                  <p className="text-sm font-medium text-stone-900">{agreement.approved_by}</p>
                  <p className="text-xs text-stone-500">{new Date(agreement.approved_at).toLocaleString()}</p>
                </div>
              )}

              {agreement.approval_status === 'rejected' && (
                <div>
                  <p className="text-sm text-stone-500 mb-1">Rejection Reason</p>
                  <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{agreement.rejection_reason}</p>
                </div>
              )}

              {currentUser?.role === 'admin' && agreement.approval_status === 'pending' && (
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleApprove}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={() => setRejectDialogOpen(true)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    Reject
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metadata Card */}
          <Card className="bg-white border border-stone-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-stone-900">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Agreement ID</p>
                <p className="text-sm font-mono text-stone-700">{(agreement._id || agreement.id || '').slice(0, 8)}...</p>
              </div>
              <div>
                <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Created At</p>
                <p className="text-sm text-stone-700">
                  {new Date(agreement.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Last Updated</p>
                <p className="text-sm text-stone-700">
                  {new Date(agreement.updated_at).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <AlertDialogContent className="bg-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Reject Agreement</AlertDialogTitle>
              <AlertDialogDescription>
                Please provide a reason for rejecting this agreement.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="reason" className="mb-2 block">Reason</Label>
              <Textarea
                id="reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="resize-none"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-stone-200">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleReject}
                disabled={!rejectReason}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Reject Agreement
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
