'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

export default function HomePageContent() {
  const [homeContent, setHomeContent] = useState({
    title: 'Premium Car Wash Services',
    subtitle: 'Book your car wash service online with our easy-to-use platform',
    bannerImage: 'https://placehold.co/1200x400',
    promoText: 'Special 20% off for new customers',
    active: true
  });

  const [sections, setSections] = useState([
    { id: 1, title: 'Why Choose Us?', content: 'We provide the highest quality car wash services with attention to detail.', active: true },
    { id: 2, title: 'Our Services', content: 'From basic wash to full detailing, we have everything your car needs.', active: true },
    { id: 3, title: 'Customer Satisfaction', content: 'Our customers love the quality and convenience of our services.', active: false },
  ]);

  const handleSave = () => {
    // In a real implementation, this would save to the backend
    console.log('Saving home page content:', homeContent);
    alert('Home page content updated successfully!');
  };

  const addSection = () => {
    const newSection = {
      id: sections.length + 1,
      title: 'New Section',
      content: 'Add your content here...',
      active: true
    };
    setSections([...sections, newSection]);
  };

  const updateSection = (id: number, field: string, value: string | boolean) => {
    setSections(sections.map(section =>
      section.id === id ? { ...section, [field]: value } : section
    ));
  };

  const deleteSection = (id: number) => {
    setSections(sections.filter(section => section.id !== id));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Home Page Content</h1>
        <Button onClick={handleSave}>Save Changes</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hero Section</CardTitle>
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
          <div>
            <label className="block text-sm font-medium mb-1">Banner Image URL</label>
            <Input
              value={homeContent.bannerImage}
              onChange={(e) => setHomeContent({...homeContent, bannerImage: e.target.value})}
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
          <CardTitle>Page Sections</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={addSection} className="mb-4">Add New Section</Button>
          <div className="space-y-4">
            {sections.map((section) => (
              <Card key={section.id}>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Title</label>
                      <Input
                        value={section.title}
                        onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Content</label>
                      <Textarea
                        value={section.content}
                        onChange={(e) => updateSection(section.id, 'content', e.target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={section.active}
                          onCheckedChange={(checked) => updateSection(section.id, 'active', checked)}
                        />
                        <label className="text-sm">Active</label>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteSection(section.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}