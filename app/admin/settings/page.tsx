'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

export default function Settings() {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    notifications: true,
    autoAssign: true,
    pricingUpdates: true,
    emailNotifications: true,
    smsNotifications: false,
  });

  const handleSave = () => {
    // In a real implementation, this would save to the backend
    console.log('Saving settings:', settings);
    alert('Settings updated successfully!');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Button onClick={handleSave}>Save Settings</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Maintenance Mode</h3>
              <p className="text-sm text-gray-500">Temporarily disable public access to the application</p>
            </div>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) => setSettings({...settings, maintenanceMode: checked})}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Booking Notifications</h3>
              <p className="text-sm text-gray-500">Send notifications for new bookings</p>
            </div>
            <Switch
              checked={settings.notifications}
              onCheckedChange={(checked) => setSettings({...settings, notifications: checked})}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Auto-Assign Bookings</h3>
              <p className="text-sm text-gray-500">Automatically assign bookings to available washers</p>
            </div>
            <Switch
              checked={settings.autoAssign}
              onCheckedChange={(checked) => setSettings({...settings, autoAssign: checked})}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Email Notifications</h3>
              <p className="text-sm text-gray-500">Send email notifications</p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">SMS Notifications</h3>
              <p className="text-sm text-gray-500">Send SMS notifications</p>
            </div>
            <Switch
              checked={settings.smsNotifications}
              onCheckedChange={(checked) => setSettings({...settings, smsNotifications: checked})}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Pricing Updates</h3>
              <p className="text-sm text-gray-500">Notify users of pricing changes</p>
            </div>
            <Switch
              checked={settings.pricingUpdates}
              onCheckedChange={(checked) => setSettings({...settings, pricingUpdates: checked})}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}