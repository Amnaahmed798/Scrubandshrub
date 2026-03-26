'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

export default function PromotionalVideos() {
  const [videos, setVideos] = useState([
    { id: 1, title: 'How to Book a Service', url: 'https://www.youtube.com/watch?v=example1', description: 'Video showing how to book a car wash service', active: true },
    { id: 2, title: 'Our Process', url: 'https://www.youtube.com/watch?v=example2', description: 'Overview of our car wash process', active: true },
    { id: 3, title: 'Customer Testimonials', url: 'https://www.youtube.com/watch?v=example3', description: 'What our customers say about us', active: false },
  ]);

  const [newVideo, setNewVideo] = useState({
    title: '',
    url: '',
    description: '',
    active: true
  });

  const addVideo = () => {
    if (!newVideo.title.trim() || !newVideo.url.trim()) return;

    const video = {
      id: videos.length + 1,
      title: newVideo.title,
      url: newVideo.url,
      description: newVideo.description,
      active: newVideo.active
    };

    setVideos([...videos, video]);
    setNewVideo({ title: '', url: '', description: '', active: true });
  };

  const toggleVideo = (id: number) => {
    setVideos(videos.map(video =>
      video.id === id ? { ...video, active: !video.active } : video
    ));
  };

  const deleteVideo = (id: number) => {
    setVideos(videos.filter(video => video.id !== id));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Promotional Videos</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Video</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Video Title</label>
              <Input
                value={newVideo.title}
                onChange={(e) => setNewVideo({...newVideo, title: e.target.value})}
                placeholder="Enter video title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Video URL</label>
              <Input
                value={newVideo.url}
                onChange={(e) => setNewVideo({...newVideo, url: e.target.value})}
                placeholder="Enter video URL (YouTube, Vimeo, etc.)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea
                value={newVideo.description}
                onChange={(e) => setNewVideo({...newVideo, description: e.target.value})}
                placeholder="Enter video description"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium mb-1">Active Status</label>
                <p className="text-sm text-gray-500">Toggle to show/hide video</p>
              </div>
              <Switch
                checked={newVideo.active}
                onCheckedChange={(checked) => setNewVideo({...newVideo, active: checked})}
              />
            </div>

            <Button onClick={addVideo}>Add Video</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Videos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {videos.map((video) => (
              <div key={video.id} className="border rounded-lg p-4">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-medium">{video.title}</h3>
                    <p className="text-sm text-gray-600">{video.description}</p>
                    <p className="text-sm text-blue-600 truncate">{video.url}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      video.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {video.active ? 'Active' : 'Inactive'}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleVideo(video.id)}
                    >
                      {video.active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteVideo(video.id)}
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