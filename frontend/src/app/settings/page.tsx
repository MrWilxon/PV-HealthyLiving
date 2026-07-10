'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Save, Upload, Download, Building2, Trash2, AlertCircle, Database, Plus, X,
  Calculator, Percent, FileDown, FileUp, RotateCcw,
} from 'lucide-react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const settingsSchema = z.object({
  defaultVatPercent: z.number().min(0).max(100),
  currency: z.string().min(1),
  decimalPlaces: z.number().min(0).max(4),
  defaultQuantity: z.number().min(1).max(999),
  autoSave: z.boolean(),
  companyName: z.string(),
  companyAddress: z.string(),
  companyPhone: z.string(),
  companyEmail: z.string(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

const SECTIONS = [
  { id: 'company', label: 'Company Profile', icon: Building2 },
  { id: 'calculation', label: 'Calculation', icon: Calculator },
  { id: 'data', label: 'Data Management', icon: Database },
] as const;

export default function SettingsPage() {
  const { settings, isLoading, fetchSettings, updateSettings } = useSettingsStore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [pendingRestoreData, setPendingRestoreData] = useState<any>(null);
  const [vatPresets, setVatPresets] = useState<number[]>([]);
  const [newVatPreset, setNewVatPreset] = useState('');
  const [activeSection, setActiveSection] = useState('company');
  const [hasChanges, setHasChanges] = useState(false);
  useUnsavedChanges(hasChanges);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
  });

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      reset({
        defaultVatPercent: settings.defaultVatPercent,
        currency: settings.currency,
        decimalPlaces: settings.decimalPlaces,
        defaultQuantity: settings.defaultQuantity,
        autoSave: settings.autoSave,
        companyName: settings.companyName || '',
        companyAddress: settings.companyAddress || '',
        companyPhone: settings.companyPhone || '',
        companyEmail: settings.companyEmail || '',
      });
      setVatPresets(settings.vatPresets || [0, 10, 13, 15]);
    }
  }, [settings, reset]);

  useEffect(() => {
    const subscription = watch(() => setHasChanges(true));
    return () => subscription.unsubscribe();
  }, [watch]);

  const onSubmit = async (data: SettingsFormData) => {
    try {
      await updateSettings({ ...data, vatPresets });
      setHasChanges(false);
      toast('Settings saved', 'success');
    } catch {
      toast('Failed to save settings', 'error');
    }
  };

  const handleAddVatPreset = () => {
    const val = parseFloat(newVatPreset);
    if (isNaN(val) || val < 0 || val > 100 || vatPresets.includes(val)) return;
    setVatPresets([...vatPresets, val].sort((a, b) => a - b));
    setNewVatPreset('');
    setHasChanges(true);
  };

  const handleRemoveVatPreset = (val: number) => {
    setVatPresets(vatPresets.filter((v) => v !== val));
    setHasChanges(true);
  };

  const handleExportProducts = async () => {
    try {
      const result = await api.products.list({ limit: '9999' });
      downloadJson(result.products, `products-${today()}.json`);
      toast('Products exported', 'success');
    } catch {
      toast('Failed to export products', 'error');
    }
  };

  const handleImportProducts = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const products = JSON.parse(text);
      if (!Array.isArray(products)) {
        toast('Invalid format — expected a JSON array', 'error');
        return;
      }
      let imported = 0;
      for (const p of products) {
        try {
          await api.products.create({
            code: p.code || p.P?.code,
            name: p.name || p['Product Description'],
            size: p.size || p['P.Size'],
            pv: p.pv || p.PV || null,
            dp: p.dp || p['DP NPR'],
          });
          imported++;
        } catch { /* skip duplicates */ }
      }
      toast(`Imported ${imported} of ${products.length} products`, 'success');
    } catch {
      toast('Failed to parse file', 'error');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportBackup = async () => {
    try {
      const backup = await api.settings.backup();
      downloadJson(backup, `backup-${today()}.json`);
      toast('Full backup exported', 'success');
    } catch {
      toast('Failed to export backup', 'error');
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.products || !data.portfolios || !data.portfolioItems) {
        toast('Invalid backup file', 'error');
        return;
      }
      setPendingRestoreData(data);
      setShowRestoreDialog(true);
    } catch {
      toast('Failed to parse backup file', 'error');
    }
    if (backupInputRef.current) backupInputRef.current.value = '';
  };

  const confirmRestore = async () => {
    if (!pendingRestoreData) return;
    setIsRestoring(true);
    try {
      await api.settings.restore(pendingRestoreData);
      await fetchSettings();
      toast('Data restored — reloading...', 'success');
      setShowRestoreDialog(false);
      setPendingRestoreData(null);
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      toast('Failed to restore data', 'error');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await api.settings.reset();
      await fetchSettings();
      toast('All data reset — reloading...', 'success');
      setShowResetDialog(false);
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      toast('Failed to reset data', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border bg-white p-6 space-y-4">
                  <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="space-y-3">
                    <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border bg-white p-6 space-y-4">
                <div className="h-5 w-28 bg-gray-200 rounded animate-pulse" />
                <div className="space-y-3">
                  <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-500">Configure your application</p>
            </div>
            <Button type="submit" disabled={isSubmitting || !hasChanges}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar nav */}
            <nav className="lg:w-48 shrink-0">
              <div className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
                {SECTIONS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setActiveSection(s.id);
                      document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors min-h-[40px]',
                      activeSection === s.id
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    )}
                  >
                    <s.icon className="h-4 w-4" />
                    {s.label}
                  </button>
                ))}
              </div>
            </nav>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-6">
              {/* Company Profile */}
              <section id="company">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Building2 className="h-5 w-5 text-gray-400" />
                      Company Profile
                    </CardTitle>
                    <CardDescription>Business details for invoices and print headers</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input id="companyName" {...register('companyName')} placeholder="PV HealthyLiving Nepal" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyAddress">Address</Label>
                      <Textarea id="companyAddress" {...register('companyAddress')} placeholder="Kathmandu, Nepal" rows={2} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyPhone">Phone</Label>
                        <Input id="companyPhone" {...register('companyPhone')} placeholder="+977-9800000000" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="companyEmail">Email</Label>
                        <Input id="companyEmail" type="email" {...register('companyEmail')} placeholder="info@example.com" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Calculation Settings */}
              <section id="calculation">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Calculator className="h-5 w-5 text-gray-400" />
                      Calculation Defaults
                    </CardTitle>
                    <CardDescription>Default values applied to new portfolios</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="defaultVatPercent">Default VAT %</Label>
                        <Input
                          id="defaultVatPercent"
                          type="number"
                          step="0.5"
                          {...register('defaultVatPercent', { valueAsNumber: true })}
                        />
                        {errors.defaultVatPercent && (
                          <p className="text-xs text-red-500">{errors.defaultVatPercent.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Input id="currency" {...register('currency')} />
                        {errors.currency && (
                          <p className="text-xs text-red-500">{errors.currency.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="decimalPlaces">Decimal Places</Label>
                        <Input
                          id="decimalPlaces"
                          type="number"
                          min="0"
                          max="4"
                          {...register('decimalPlaces', { valueAsNumber: true })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="defaultQuantity">Default Quantity</Label>
                        <Input
                          id="defaultQuantity"
                          type="number"
                          min="1"
                          max="999"
                          {...register('defaultQuantity', { valueAsNumber: true })}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="autoSave"
                        {...register('autoSave')}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="autoSave" className="cursor-pointer text-sm">
                        Auto-save portfolios on edit
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                <div className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Percent className="h-5 w-5 text-gray-400" />
                        VAT Presets
                      </CardTitle>
                      <CardDescription>Quick-select options shown in portfolio summary</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {vatPresets.map((val) => (
                          <div
                            key={val}
                            className="flex items-center gap-1.5 bg-gray-100 rounded-full pl-3 pr-1.5 py-1.5"
                          >
                            <span className="text-sm font-medium">{val}%</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveVatPreset(val)}
                              className="p-0.5 hover:bg-gray-200 rounded-full transition-colors"
                            >
                              <X className="h-3 w-3 text-gray-400" />
                            </button>
                          </div>
                        ))}
                        {vatPresets.length === 0 && (
                          <span className="text-sm text-gray-400">No presets — add one below</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          placeholder="e.g. 13"
                          value={newVatPreset}
                          onChange={(e) => setNewVatPreset(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddVatPreset())}
                          className="w-28"
                        />
                        <Button type="button" variant="outline" size="sm" onClick={handleAddVatPreset}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* Data Management */}
              <section id="data">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Database className="h-5 w-5 text-gray-400" />
                      Data Management
                    </CardTitle>
                    <CardDescription>Import, export, backup, and restore</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Products */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Products</h4>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                          <FileUp className="h-4 w-4 mr-1.5" />
                          Import
                        </Button>
                        <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportProducts} className="hidden" />
                        <Button type="button" variant="outline" size="sm" onClick={handleExportProducts}>
                          <FileDown className="h-4 w-4 mr-1.5" />
                          Export
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5">Import/export product catalog as JSON</p>
                    </div>

                    <div className="border-t" />

                    {/* Seed Data */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Seed Sample Products</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (!confirm('This will add 31 sample products. Continue?')) return;
                          try {
                            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/settings/seed`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ confirm: true }),
                            });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error?.message || 'Seed failed');
                            toast(data.message, 'success');
                          } catch (err) {
                            toast((err as Error).message, 'error');
                          }
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1.5" />
                        Seed Products
                      </Button>
                      <p className="text-xs text-gray-400 mt-1.5">Add 31 sample PV HealthyLiving products</p>
                    </div>

                    <div className="border-t" />

                    {/* Full Backup */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Full Backup & Restore</h4>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={handleExportBackup}>
                          <Download className="h-4 w-4 mr-1.5" />
                          Download Backup
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => backupInputRef.current?.click()}>
                          <Upload className="h-4 w-4 mr-1.5" />
                          Restore Backup
                        </Button>
                        <input ref={backupInputRef} type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5">Backup includes products, portfolios, and settings. Restore overwrites everything.</p>
                    </div>

                    <div className="border-t" />

                    {/* Danger Zone */}
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-medium text-red-800">Reset All Data</h4>
                          <p className="text-xs text-red-600 mt-0.5">Permanently delete all products, portfolios, and settings</p>
                        </div>
                        <Button type="button" variant="destructive" size="sm" onClick={() => setShowResetDialog(true)}>
                          <Trash2 className="h-4 w-4 mr-1.5" />
                          Reset
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>
            </div>
          </div>
        </div>
      </form>

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Reset All Data
            </DialogTitle>
            <DialogDescription>
              This will permanently delete all products, portfolios, and reset settings to defaults.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)} disabled={isResetting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReset} disabled={isResetting}>
              {isResetting ? 'Resetting...' : 'Yes, Reset Everything'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRestoreDialog} onOpenChange={() => !isRestoring && setShowRestoreDialog(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Restore Backup
            </DialogTitle>
            <DialogDescription>
              This will overwrite all existing products, portfolios, and settings with the backup data.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestoreDialog(false)} disabled={isRestoring}>
              Cancel
            </Button>
            <Button onClick={confirmRestore} disabled={isRestoring} className="bg-gray-900 hover:bg-gray-800">
              {isRestoring ? 'Restoring...' : 'Yes, Restore Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
