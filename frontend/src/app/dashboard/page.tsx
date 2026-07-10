'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Briefcase, TrendingUp, Eye, Edit, Trash2 } from 'lucide-react';
import { DashboardStats } from '@/types';
import { api } from '@/lib/api';
import { formatCurrency, formatPV } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.dashboard.stats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleDeletePortfolio = async (id: string) => {
    if (confirm('Are you sure you want to delete this portfolio?')) {
      try {
        await api.portfolios.delete(id);
        setStats((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            totalPortfolios: prev.totalPortfolios - 1,
            recentPortfolios: prev.recentPortfolios.filter((p) => p.id !== id),
          };
        });
      } catch (error) {
        console.error('Failed to delete portfolio:', error);
        alert('Failed to delete portfolio. Please try again.');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const statCards = [
    {
      title: 'Total Products',
      value: stats?.totalProducts || 0,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Portfolios',
      value: stats?.totalPortfolios || 0,
      icon: Briefcase,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total PV',
      value: formatPV(stats?.totalPV || 0),
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome to PV HealthyLiving Calculator</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-600" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {statCards.map((card) => (
                <Card key={card.title}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {card.title}
                    </CardTitle>
                    <div className={`${card.bgColor} p-2 rounded-lg`}>
                      <card.icon className={`h-4 w-4 ${card.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{card.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Portfolios</CardTitle>
              </CardHeader>
              <CardContent>
                {!stats?.recentPortfolios || stats.recentPortfolios.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No portfolios yet</p>
                ) : (
                  <div className="space-y-3">
                    {stats.recentPortfolios.map((portfolio) => (
                      <div
                        key={portfolio.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{portfolio.name}</span>
                            <Badge className={getStatusColor(portfolio.status)}>
                              {portfolio.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {portfolio._count?.items || 0} items
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(portfolio.grandTotal)}</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/portfolios/${portfolio.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/portfolios/${portfolio.id}/edit`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeletePortfolio(portfolio.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  );
}
