'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getMemberships, deleteMembership } from '@/lib/api';
import { Membership } from '@/types';

export default function MembershipsManagement() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMemberships();
  }, []);

  const fetchMemberships = async () => {
    try {
      setLoading(true);
      const response = await getMemberships();
      setMemberships(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch memberships');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this membership plan?')) {
      try {
        await deleteMembership(id);
        fetchMemberships(); // Refresh the list
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete membership');
      }
    }
  };

  if (loading) return <div className="p-6">Loading memberships...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Memberships Management</h1>
        <Button onClick={() => window.location.href = '/admin/memberships/add'}>
          Add Membership Plan
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membership Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(memberships) && memberships.map((plan) => (
              <Card key={plan.id} className="p-4">
                <h3 className="font-bold text-lg">{plan.name}</h3>
                <p className="text-sm mt-1">{plan.description}</p>
                <p className="text-2xl font-bold mt-2">{plan.discount_percentage}% discount</p>
                <p className="text-gray-600 text-sm">{plan.duration_months} month{plan.duration_months !== 1 ? 's' : ''}</p>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => window.location.href = `/admin/memberships/edit/${plan.id}`}>
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(plan.id)}>
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}