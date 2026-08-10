import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Search,
  History,
  RotateCcw,
  FileText,
  Upload,
  Download,
  Trash2,
  CheckCircle2,
  XCircle,
  Edit,
  Plus,
  ChevronDown,
  ChevronUp,
  Calendar,
  Filter,
  RefreshCw,
} from 'lucide-react';

import { API } from '../config';

const ACTION_CONFIG = {
  create: { label: 'Dibuat', icon: Plus, color: 'bg-emerald-100 text-emerald-700', iconColor: 'text-emerald-600' },
  update: { label: 'Diperbarui', icon: Edit, color: 'bg-blue-100 text-blue-700', iconColor: 'text-blue-600' },
  delete: { label: 'Dihapus', icon: Trash2, color: 'bg-red-100 text-red-700', iconColor: 'text-red-600' },
  upload: { label: 'Upload File', icon: Upload, color: 'bg-violet-100 text-violet-700', iconColor: 'text-violet-600' },
  download: { label: 'Download', icon: Download, color: 'bg-stone-100 text-stone-700', iconColor: 'text-stone-600' },
  approve: { label: 'Disetujui', icon: CheckCircle2, color: 'bg-green-100 text-green-700', iconColor: 'text-green-600' },
  reject: { label: 'Ditolak', icon: XCircle, color: 'bg-rose-100 text-rose-700', iconColor: 'text-rose-600' },
  restore: { label: 'Dipulihkan', icon: RotateCcw, color: 'bg-amber-100 text-amber-700', iconColor: 'text-amber-600' },
};

export default function AuditLogs() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user?.role === 'admin';

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, totalPages: 0 });
  const [expandedRow, setExpandedRow] = useState(null);
  const [restoreDialog, setRestoreDialog] = useState({ open: false, logId: null, title: '' });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, actionFilter, dateFrom, dateTo]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page === 1) {
        fetchLogs();
      } else {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      params.set('page', pagination.page);
      params.set('limit', pagination.limit);
      if (searchTerm) params.set('search', searchTerm);
      if (actionFilter !== 'all') params.set('action', actionFilter);
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);

      const response = await axios.get(`${API}/audit-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(response.data.logs);
      setPagination(prev => ({ ...prev, ...response.data.pagination }));
    } catch (error) {
      toast.error('Gagal memuat audit log');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/audit-logs/${restoreDialog.logId}/restore`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Agreement "${restoreDialog.title}" berhasil dipulihkan`);
      setRestoreDialog({ open: false, logId: null, title: '' });
      fetchLogs();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal memulihkan agreement');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setActionFilter('all');
    setDateFrom('');
    setDateTo('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getActionBadge = (action) => {
    const config = ACTION_CONFIG[action] || ACTION_CONFIG.create;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6" data-testid="audit-logs-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-stone-900 flex items-center gap-3">
            <History size={36} className="text-[#134E4A]" />
            Audit Log
          </h1>
          <p className="text-base text-stone-600 mt-2">
            Riwayat semua aktivitas pada sistem agreement
          </p>
        </div>
        <Button
          onClick={fetchLogs}
          variant="outline"
          className="gap-2 h-10 px-4 text-stone-600 border-stone-200 hover:bg-stone-50"
          data-testid="refresh-logs-button"
        >
          <RefreshCw size={16} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-white border border-stone-200 shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <Input
                placeholder="Cari judul, nama user, departemen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10"
                data-testid="audit-search-input"
              />
            </div>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="h-10" data-testid="action-filter">
                <SelectValue placeholder="Semua Aksi" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">Semua Aksi</SelectItem>
                <SelectItem value="create">Dibuat</SelectItem>
                <SelectItem value="update">Diperbarui</SelectItem>
                <SelectItem value="delete">Dihapus</SelectItem>
                <SelectItem value="upload">Upload File</SelectItem>
                <SelectItem value="approve">Disetujui</SelectItem>
                <SelectItem value="reject">Ditolak</SelectItem>
                <SelectItem value="restore">Dipulihkan</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-10"
              placeholder="Dari tanggal"
              data-testid="date-from-filter"
            />

            <div className="flex gap-2">
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-10 flex-1"
                placeholder="Sampai tanggal"
                data-testid="date-to-filter"
              />
              {(searchTerm || actionFilter !== 'all' || dateFrom || dateTo) && (
                <Button
                  onClick={clearFilters}
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-stone-400 hover:text-stone-600 shrink-0"
                  title="Reset filter"
                >
                  <XCircle size={18} />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info bar */}
      <div className="flex items-center justify-between text-sm text-stone-500">
        <span>
          Menampilkan {logs.length} dari {pagination.total} log
        </span>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg border border-stone-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-stone-50">
              <TableHead className="text-xs uppercase font-semibold text-stone-500 w-10"></TableHead>
              <TableHead className="text-xs uppercase font-semibold text-stone-500">Waktu</TableHead>
              <TableHead className="text-xs uppercase font-semibold text-stone-500">Aksi</TableHead>
              <TableHead className="text-xs uppercase font-semibold text-stone-500">Agreement</TableHead>
              <TableHead className="text-xs uppercase font-semibold text-stone-500">Dilakukan Oleh</TableHead>
              <TableHead className="text-xs uppercase font-semibold text-stone-500">Departemen</TableHead>
              <TableHead className="text-xs uppercase font-semibold text-stone-500 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex items-center justify-center gap-2 text-stone-500">
                    <RefreshCw size={18} className="animate-spin" />
                    Memuat audit log...
                  </div>
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-stone-500">
                  <History size={32} className="mx-auto mb-2 text-stone-300" />
                  Tidak ada log ditemukan
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <>
                  <TableRow
                    key={log.id || log._id}
                    className="hover:bg-stone-50 transition-colors cursor-pointer"
                    onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                    data-testid={`audit-row-${log.id}`}
                  >
                    <TableCell className="w-10">
                      {expandedRow === log.id ? (
                        <ChevronUp size={16} className="text-stone-400" />
                      ) : (
                        <ChevronDown size={16} className="text-stone-400" />
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-stone-600 whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell className="font-medium text-stone-900 max-w-[200px] truncate">
                      {log.entity_title || '-'}
                    </TableCell>
                    <TableCell className="text-stone-600">
                      {log.performed_by_name || '-'}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-stone-100 text-stone-700">
                        {log.department || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {isAdmin && log.action === 'delete' && log.snapshot && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRestoreDialog({ open: true, logId: log.id, title: log.entity_title });
                          }}
                          size="sm"
                          className="h-8 px-3 bg-amber-500 hover:bg-amber-600 text-white gap-1.5 text-xs font-medium"
                          data-testid={`restore-btn-${log.id}`}
                        >
                          <RotateCcw size={13} />
                          Pulihkan
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  {/* Expanded detail row */}
                  {expandedRow === log.id && (
                    <TableRow key={`${log.id}-detail`} className="bg-stone-50/50">
                      <TableCell colSpan={7} className="py-4 px-8">
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Detail</p>
                            <p className="text-sm text-stone-700">{log.details || 'Tidak ada detail'}</p>
                          </div>
                          <div className="flex gap-6 text-xs text-stone-500">
                            <span><strong>Entity ID:</strong> {log.entity_id?.slice(0, 8)}...</span>
                            <span><strong>Tipe:</strong> {log.entity_type}</span>
                            <span><strong>Log ID:</strong> {(log.id || log._id)?.slice(0, 8)}...</span>
                          </div>
                          {log.snapshot && (
                            <div>
                              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Snapshot Data</p>
                              <div className="bg-white border border-stone-200 rounded p-3 text-xs font-mono text-stone-600 max-h-40 overflow-y-auto">
                                <pre className="whitespace-pre-wrap">{JSON.stringify(log.snapshot, null, 2)}</pre>
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-stone-500">
            Halaman {pagination.page} dari {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page <= 1}
              className="h-9 px-4 border-stone-200"
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= pagination.totalPages}
              className="h-9 px-4 border-stone-200"
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreDialog.open} onOpenChange={(open) => setRestoreDialog({ open, logId: null, title: '' })}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Pulihkan Agreement</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin memulihkan agreement <strong>"{restoreDialog.title}"</strong>?
              Agreement akan kembali muncul di daftar agreement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-stone-200">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              <RotateCcw size={16} className="mr-2" />
              Pulihkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
