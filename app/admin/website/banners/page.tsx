'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

export default function Banners() {
  const [banners, setBanners] = useState([
    { id: 1, title: 'Summer Special', image: 'https://placehold.co/1200x200', text: '20% off all services this summer', url: '/book', active: true },
    { id: 2, title: 'New Location', image: 'https://placehold.co/1200x200', text: 'Visit our new location', url: '/location', active: true },
    { id: 3, title: 'Free Detailing', image: 'https://placehold.co/1200x200', text: 'Free interior detailing with premium wash', url: '/services', active: false },
  ]);

  const [newBanner, setNewBanner] = useState({
    title: '',
    image: '',
    text: '',
    url: '',
    active: true
  });

  const addBanner = () => {
    if (!newBanner.title.trim()) return;

    const banner = {
      id: banners.length + 1,
      title: newBanner.title,
      image: newBanner.image || 'https://placehold.co/1200x200',
      text: newBanner.text,
      url: newBanner.url,
      active: newBanner.active
    };

    setBanners([...banners, banner]);
    setNewBanner({ title: '', image: '', text: '', url: '', active: true });
  };

  const toggleBanner = (id: number) => {
    setBanners(banners.map(banner =>
      banner.id === id ? { ...banner, active: !banner.active } : banner
    ));
  };

  const deleteBanner = (id: number) => {
    setBanners(banners.filter(banner => banner.id !== id));
  };

  const updateBanner = (id: number, field: string, value: string | boolean) => {
    setBanners(banners.map(banner =>
      banner.id === id ? { ...banner, [field]: value } : banner
    ));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Banners Management</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Banner</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input
                value={newBanner.title}
                onChange={(e) => setNewBanner({...newBanner, title: e.target.value})}
                placeholder="Enter banner title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Image URL</label>
              <Input
                value={newBanner.image}
                onChange={(e) => setNewBanner({...newBanner, image: e.target.value})}
                placeholder="Enter image URL"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Text Content</label>
              <Textarea
                value={newBanner.text}
                onChange={(e) => setNewBanner({...newBanner, text: e.target.value})}
                placeholder="Enter banner text"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Link URL</label>
              <Input
                value={newBanner.url}
                onChange={(e) => setNewBanner({...newBanner, url: e.target.value})}
                placeholder="Enter link URL (optional)"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium mb-1">Active Status</label>
                <p className="text-sm text-gray-500">Toggle to show/hide banner</p>
              </div>
              <Switch
                checked={newBanner.active}
                onCheckedChange={(checked) => setNewBanner({...newBanner, active: checked})}
              />
            </div>

            <Button onClick={addBanner}>Add Banner</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Banners</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {banners.map((banner) => (
              <div key={banner.id} className="border rounded-lg p-4">
                <div className="flex justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <img
                        src={banner.image}
                        alt={banner.title}
                        className="w-32 h-12 object-cover rounded"
                      />
                      <div>
                        <h3 className="font-medium">{banner.title}</h3>
                        <p className="text-sm text-gray-600">{banner.text}</p>
                        <p className="text-xs text-blue-600">{banner.url}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      banner.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {banner.active ? 'Active' : 'Inactive'}
                    </span>
                    <Switch
                      checked={banner.active}
                      onCheckedChange={() => toggleBanner(banner.id)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateBanner(banner.id, 'active', !banner.active)}
                    >
                      {banner.active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteBanner(banner.id)}
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