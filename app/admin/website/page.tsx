'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

export default function WebsiteContent() {
  const [homeContent, setHomeContent] = useState({
    title: 'Premium Car Wash Services',
    subtitle: 'Book your car wash service online with our easy-to-use platform',
    bannerImage: 'https://placehold.co/1200x400',
    promoText: 'Special 20% off for new customers',
    active: true
  });

  const [carousels, setCarousels] = useState([
    { id: 1, image: 'https://placehold.co/800x400', title: 'Express Wash', active: true },
    { id: 2, image: 'https://placehold.co/800x400', title: 'Premium Detailing', active: true },
    { id: 3, image: 'https://placehold.co/800x400', title: 'Full Service', active: false },
  ]);

  const handleSave = () => {
    // In a real implementation, this would save to the backend
    console.log('Saving website content:', homeContent);
    alert('Website content updated successfully!');
  };

  const toggleCarouselActive = (id: number) => {
    setCarousels(carousels.map(carousel =>
      carousel.id === id ? { ...carousel, active: !carousel.active } : carousel
    ));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Website Content Management</h1>
        <Button onClick={handleSave}>Save Changes</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Home Page Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <Input
              value={homeContent.title}
              onChange={(e) => setHomeContent({...homeContent, title: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Subtitle</label>
            <Textarea
              value={homeContent.subtitle}
              onChange={(e) => setHomeContent({...homeContent, subtitle: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Promotional Text</label>
            <Input
              value={homeContent.promoText}
              onChange={(e) => setHomeContent({...homeContent, promoText: e.target.value})}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium mb-1">Active Status</label>
              <p className="text-sm text-gray-500">Toggle to show/hide on website</p>
            </div>
            <Switch
              checked={homeContent.active}
              onCheckedChange={(checked) => setHomeContent({...homeContent, active: checked})}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Carousel Images</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {carousels.map((carousel) => (
              <div key={carousel.id} className="border rounded-lg p-4">
                <img
                  src={carousel.image}
                  alt={carousel.title}
                  className="w-full h-32 object-cover rounded mb-2"
                />
                <h3 className="font-medium">{carousel.title}</h3>
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    carousel.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {carousel.active ? 'Active' : 'Inactive'}
                  </span>
                  <Switch
                    checked={carousel.active}
                    onCheckedChange={() => toggleCarouselActive(carousel.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}