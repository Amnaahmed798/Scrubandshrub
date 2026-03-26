'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

export default function ManageBenefits() {
  const [benefits, setBenefits] = useState([
    { id: 1, name: '20% Discount', description: '20% off all services', active: true },
    { id: 2, name: 'Priority Booking', description: 'Priority booking for premium members', active: true },
    { id: 3, name: 'Free Wash', description: 'One free basic wash per month', active: true },
    { id: 4, name: 'VIP Parking', description: 'Reserved parking space', active: false },
  ]);

  const [newBenefit, setNewBenefit] = useState({
    name: '',
    description: '',
    active: true
  });

  const addBenefit = () => {
    if (!newBenefit.name.trim()) return;

    const benefit = {
      id: benefits.length + 1,
      name: newBenefit.name,
      description: newBenefit.description,
      active: newBenefit.active
    };

    setBenefits([...benefits, benefit]);
    setNewBenefit({ name: '', description: '', active: true });
  };

  const toggleBenefit = (id: number) => {
    setBenefits(benefits.map(benefit =>
      benefit.id === id ? { ...benefit, active: !benefit.active } : benefit
    ));
  };

  const deleteBenefit = (id: number) => {
    setBenefits(benefits.filter(benefit => benefit.id !== id));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manage Membership Benefits</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Benefit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Benefit Name</label>
              <Input
                value={newBenefit.name}
                onChange={(e) => setNewBenefit({...newBenefit, name: e.target.value})}
                placeholder="Enter benefit name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea
                value={newBenefit.description}
                onChange={(e) => setNewBenefit({...newBenefit, description: e.target.value})}
                placeholder="Enter benefit description"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium mb-1">Active Status</label>
                <p className="text-sm text-gray-500">Toggle to enable/disable benefit</p>
              </div>
              <input
                type="checkbox"
                checked={newBenefit.active}
                onChange={(e) => setNewBenefit({...newBenefit, active: e.target.checked})}
              />
            </div>

            <Button onClick={addBenefit}>Add Benefit</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {benefits.map((benefit) => (
                <TableRow key={benefit.id}>
                  <TableCell className="font-medium">{benefit.name}</TableCell>
                  <TableCell>{benefit.description}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      benefit.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {benefit.active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleBenefit(benefit.id)}
                      >
                        {benefit.active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteBenefit(benefit.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}