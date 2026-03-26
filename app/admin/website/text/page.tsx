'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

export default function PromotionalText() {
  const [texts, setTexts] = useState([
    { id: 1, title: 'Welcome Message', content: 'Welcome to our premium car wash service. We provide the highest quality care for your vehicle.', location: 'Homepage', active: true },
    { id: 2, title: 'About Us', content: 'With over 10 years of experience, we are the trusted choice for car care in the city.', location: 'About Page', active: true },
    { id: 3, title: 'Special Offer', content: 'Book now and get 20% off your first service. Limited time offer!', location: 'Promotional', active: false },
  ]);

  const [newText, setNewText] = useState({
    title: '',
    content: '',
    location: '',
    active: true
  });

  const addText = () => {
    if (!newText.title.trim() || !newText.content.trim()) return;

    const text = {
      id: texts.length + 1,
      title: newText.title,
      content: newText.content,
      location: newText.location || 'General',
      active: newText.active
    };

    setTexts([...texts, text]);
    setNewText({ title: '', content: '', location: '', active: true });
  };

  const toggleText = (id: number) => {
    setTexts(texts.map(text =>
      text.id === id ? { ...text, active: !text.active } : text
    ));
  };

  const deleteText = (id: number) => {
    setTexts(texts.filter(text => text.id !== id));
  };

  const updateText = (id: number, field: string, value: string | boolean) => {
    setTexts(texts.map(text =>
      text.id === id ? { ...text, [field]: value } : text
    ));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Promotional Text Management</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Text</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input
                value={newText.title}
                onChange={(e) => setNewText({...newText, title: e.target.value})}
                placeholder="Enter text title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Content</label>
              <Textarea
                value={newText.content}
                onChange={(e) => setNewText({...newText, content: e.target.value})}
                placeholder="Enter promotional text content"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <Input
                value={newText.location}
                onChange={(e) => setNewText({...newText, location: e.target.value})}
                placeholder="Enter where this text will be displayed (e.g., Homepage, About Page, etc.)"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium mb-1">Active Status</label>
                <p className="text-sm text-gray-500">Toggle to show/hide text</p>
              </div>
              <Switch
                checked={newText.active}
                onCheckedChange={(checked) => setNewText({...newText, active: checked})}
              />
            </div>

            <Button onClick={addText}>Add Text</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Promotional Texts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {texts.map((text) => (
              <div key={text.id} className="border rounded-lg p-4">
                <div className="flex justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{text.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">Location: {text.location}</p>
                    <p className="text-sm">{text.content}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      text.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {text.active ? 'Active' : 'Inactive'}
                    </span>
                    <Switch
                      checked={text.active}
                      onCheckedChange={() => toggleText(text.id)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateText(text.id, 'active', !text.active)}
                    >
                      {text.active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteText(text.id)}
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