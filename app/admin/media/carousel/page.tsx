'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { getMedia } from '@/lib/api';
import { Media } from '@/types';

export default function CarouselImages() {
  const [carouselItems, setCarouselItems] = useState([
    { id: 1, title: 'Express Wash', image: 'https://placehold.co/800x400', active: true, order: 1 },
    { id: 2, title: 'Premium Detailing', image: 'https://placehold.co/800x400', active: true, order: 2 },
    { id: 3, title: 'Full Service', image: 'https://placehold.co/800x400', active: false, order: 3 },
  ]);

  const [newItem, setNewItem] = useState({
    title: '',
    image: '',
    active: true,
    order: 0
  });

  const addCarouselItem = () => {
    if (!newItem.title.trim()) return;

    const item = {
      id: carouselItems.length + 1,
      title: newItem.title,
      image: newItem.image || 'https://placehold.co/800x400',
      active: newItem.active,
      order: newItem.order || carouselItems.length + 1
    };

    setCarouselItems([...carouselItems, item]);
    setNewItem({ title: '', image: '', active: true, order: 0 });
  };

  const toggleCarouselItem = (id: number) => {
    setCarouselItems(carouselItems.map(item =>
      item.id === id ? { ...item, active: !item.active } : item
    ));
  };

  const deleteCarouselItem = (id: number) => {
    setCarouselItems(carouselItems.filter(item => item.id !== id));
  };

  const updateOrder = (id: number, newOrder: number) => {
    setCarouselItems(carouselItems.map(item =>
      item.id === id ? { ...item, order: newOrder } : item
    ));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Carousel Images</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Carousel Item</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input
                value={newItem.title}
                onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                placeholder="Enter carousel item title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Image URL</label>
              <Input
                value={newItem.image}
                onChange={(e) => setNewItem({...newItem, image: e.target.value})}
                placeholder="Enter image URL"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Order</label>
                <Input
                  type="number"
                  value={newItem.order}
                  onChange={(e) => setNewItem({...newItem, order: parseInt(e.target.value) || 0})}
                  placeholder="Order in carousel"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium mb-1">Active Status</label>
                  <p className="text-sm text-gray-500">Toggle to show/hide in carousel</p>
                </div>
                <Switch
                  checked={newItem.active}
                  onCheckedChange={(checked) => setNewItem({...newItem, active: checked})}
                />
              </div>
            </div>

            <Button onClick={addCarouselItem}>Add Carousel Item</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Carousel Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {carouselItems.map((item) => (
              <div key={item.id} className="border rounded-lg p-4">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-32 object-cover rounded mb-2"
                />
                <h3 className="font-medium">{item.title}</h3>
                <div className="flex items-center justify-between mt-2">
                  <div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      item.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">Order: {item.order}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleCarouselItem(item.id)}
                    >
                      {item.active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteCarouselItem(item.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}