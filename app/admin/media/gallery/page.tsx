'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

export default function Gallery() {
  const [galleryItems, setGalleryItems] = useState([
    { id: 1, title: 'Before & After', image: 'https://placehold.co/400x300', description: 'Example of our car wash results', active: true },
    { id: 2, title: 'Interior Detailing', image: 'https://placehold.co/400x300', description: 'Interior cleaning service', active: true },
    { id: 3, title: 'Wash Process', image: 'https://placehold.co/400x300', description: 'Our professional wash process', active: false },
  ]);

  const [newItem, setNewItem] = useState({
    title: '',
    image: '',
    description: '',
    active: true
  });

  const addGalleryItem = () => {
    if (!newItem.title.trim()) return;

    const item = {
      id: galleryItems.length + 1,
      title: newItem.title,
      image: newItem.image || 'https://placehold.co/400x300',
      description: newItem.description,
      active: newItem.active
    };

    setGalleryItems([...galleryItems, item]);
    setNewItem({ title: '', image: '', description: '', active: true });
  };

  const toggleGalleryItem = (id: number) => {
    setGalleryItems(galleryItems.map(item =>
      item.id === id ? { ...item, active: !item.active } : item
    ));
  };

  const deleteGalleryItem = (id: number) => {
    setGalleryItems(galleryItems.filter(item => item.id !== id));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gallery</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Gallery Item</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input
                value={newItem.title}
                onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                placeholder="Enter image title"
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

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea
                value={newItem.description}
                onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                placeholder="Enter image description"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium mb-1">Active Status</label>
                <p className="text-sm text-gray-500">Toggle to show/hide in gallery</p>
              </div>
              <Switch
                checked={newItem.active}
                onCheckedChange={(checked) => setNewItem({...newItem, active: checked})}
              />
            </div>

            <Button onClick={addGalleryItem}>Add Gallery Item</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gallery Images</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {galleryItems.map((item) => (
              <div key={item.id} className="border rounded-lg overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-40 object-cover"
                />
                <div className="p-3">
                  <h3 className="font-medium text-sm">{item.title}</h3>
                  <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      item.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.active ? 'Active' : 'Inactive'}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleGalleryItem(item.id)}
                      >
                        {item.active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteGalleryItem(item.id)}
                      >
                        Delete
                      </Button>
                    </div>
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