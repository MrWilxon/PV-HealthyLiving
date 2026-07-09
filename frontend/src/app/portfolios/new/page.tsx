'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MainLayout } from '@/components/layout/MainLayout';
import { PortfolioTable } from '@/components/portfolio/PortfolioTable';
import { PortfolioSummary } from '@/components/portfolio/PortfolioSummary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { usePortfolioStore } from '@/stores/usePortfolioStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useToast } from '@/components/ui/toast';

const portfolioSchema = z.object({
  name: z.string().min(1, 'Portfolio name is required'),
  date: z.string().min(1, 'Date is required'),
});

type PortfolioFormData = z.infer<typeof portfolioSchema>;

export default function NewPortfolioPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const {
    currentPortfolio,
    createPortfolio,
    fetchPortfolio,
    clearCurrentPortfolio,
  } = usePortfolioStore();
  const { settings, fetchSettings } = useSettingsStore();
  const { toast } = useToast();

  useEffect(() => {
    clearCurrentPortfolio();
    fetchSettings();
  }, [clearCurrentPortfolio, fetchSettings]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PortfolioFormData>({
    resolver: zodResolver(portfolioSchema),
    defaultValues: {
      name: '',
      date: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data: PortfolioFormData) => {
    setIsSaving(true);
    try {
      const portfolio = await createPortfolio({
        ...data,
        vatPercent: settings?.defaultVatPercent || 13,
      });
      await fetchPortfolio(portfolio.id);
      toast('Portfolio created successfully', 'success');
    } catch {
      toast('Failed to create portfolio', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">New Portfolio</h1>
            <p className="text-gray-500">Create a new product portfolio</p>
          </div>
        </div>

        {!currentPortfolio ? (
          <form onSubmit={handleSubmit(onSubmit)} className="w-full sm:max-w-md space-y-4 bg-white p-4 sm:p-6 rounded-lg border">
            <div className="space-y-2">
              <Label htmlFor="name">Portfolio Name</Label>
              <Input id="name" {...register('name')} placeholder="Ram Sharma Portfolio" />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" {...register('date')} />
              {errors.date && <p className="text-sm text-red-500">{errors.date.message}</p>}
            </div>

            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Creating...' : 'Create Portfolio'}
            </Button>
          </form>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <PortfolioTable
                items={currentPortfolio.items}
                currency={settings?.currency || 'NPR'}
                editable={true}
              />
            </div>
            <div>
              <PortfolioSummary currency={settings?.currency || 'NPR'} />
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push('/portfolios')}
                >
                  View All Portfolios
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => router.push(`/portfolios/${currentPortfolio.id}/edit`)}
                >
                  Edit Portfolio
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
