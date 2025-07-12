
import React, { useState, useCallback, useEffect } from 'react';
import { supabaseAdminService } from '@/services/supabaseAdminService';
import { useToast } from '@/components/ui/ToastProvider';
import { Save, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface AdvertisementSettingsState {
  popup_ad_code: string;
  sidebar_archive_ad_code: string;
  sidebar_single_ad_code: string;
  single_top_ad_code: string;
  single_bottom_ad_code: string;
  single_middle_ad_code: string;
}

const AdvertisementSettings: React.FC = () => {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<AdvertisementSettingsState>({
    popup_ad_code: '',
    sidebar_archive_ad_code: '',
    sidebar_single_ad_code: '',
    single_top_ad_code: '',
    single_bottom_ad_code: '',
    single_middle_ad_code: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<{ [key: string]: boolean }>({});

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const adminSettings = await supabaseAdminService.getSettings();
      if (adminSettings) {
        setSettings({
          popup_ad_code: adminSettings.popup_ad_code || '',
          sidebar_archive_ad_code: adminSettings.sidebar_archive_ad_code || '',
          sidebar_single_ad_code: adminSettings.sidebar_single_ad_code || '',
          single_top_ad_code: adminSettings.single_top_ad_code || '',
          single_bottom_ad_code: adminSettings.single_bottom_ad_code || '',
          single_middle_ad_code: adminSettings.single_middle_ad_code || ''
        });
      }
    } catch (error) {
      console.error('Error loading advertisement settings:', error);
      showToast('error', 'Failed to load advertisement settings');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const result = await supabaseAdminService.saveSettings(settings);
      
      if (result.success) {
        showToast('success', 'Advertisement settings saved successfully');
      } else {
        showToast('error', result.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('error', 'Failed to save advertisement settings');
    } finally {
      setSaving(false);
    }
  };

  const togglePreview = (field: string) => {
    setPreviewMode(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const adFields = [
    {
      key: 'popup_ad_code',
      label: 'Popup Advertisement (All Pages)',
      description: 'JavaScript/HTML code for popup advertisements that appear on all pages'
    },
    {
      key: 'sidebar_archive_ad_code',
      label: 'Sidebar Archive Articles',
      description: 'Advertisement code for the sidebar in article archive pages'
    },
    {
      key: 'sidebar_single_ad_code',
      label: 'Sidebar Single Article',
      description: 'Advertisement code for the sidebar in single article pages'
    },
    {
      key: 'single_top_ad_code',
      label: 'Single Article Top',
      description: 'Advertisement code displayed at the top of single article content'
    },
    {
      key: 'single_bottom_ad_code',
      label: 'Single Article Bottom',
      description: 'Advertisement code displayed at the bottom of single article content'
    },
    {
      key: 'single_middle_ad_code',
      label: 'Single Article Middle',
      description: 'Advertisement code displayed in the middle of single article content (before H2 tags)'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Advertisement Settings</h2>
            <p className="text-gray-600 mt-1">
              Configure advertisement codes for different positions on your website
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-amber-700">
              <p className="font-medium mb-1">Important Notes:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>You can use HTML, CSS, and JavaScript code in these fields</li>
                <li>Make sure your ad codes are from trusted sources</li>
                <li>Test your ads on different devices and screen sizes</li>
                <li>Empty fields will not display any advertisements</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {adFields.map((field) => (
            <div key={field.key} className="border-b border-gray-200 pb-8 last:border-b-0">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    {field.label}
                  </label>
                  <p className="text-sm text-gray-500">{field.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => togglePreview(field.key)}
                  className="inline-flex items-center px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  {previewMode[field.key] ? (
                    <>
                      <EyeOff className="h-3 w-3 mr-1" />
                      Hide Preview
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3 mr-1" />
                      Show Preview
                    </>
                  )}
                </button>
              </div>

              <textarea
                value={settings[field.key as keyof AdvertisementSettingsState]}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  [field.key]: e.target.value
                }))}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                placeholder={`Enter ${field.label.toLowerCase()} code here...`}
              />

              {previewMode[field.key] && settings[field.key as keyof AdvertisementSettingsState] && (
                <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-md">
                  <p className="text-xs text-gray-600 mb-2 font-medium">Preview:</p>
                  <div 
                    className="bg-white p-3 border rounded"
                    dangerouslySetInnerHTML={{ 
                      __html: settings[field.key as keyof AdvertisementSettingsState] 
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdvertisementSettings;
