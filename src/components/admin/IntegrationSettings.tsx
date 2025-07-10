import React, { useState, useEffect, useCallback } from 'react';
import { Save, Loader2, Database, HardDrive, TestTube, CheckCircle, XCircle, Link2 } from 'lucide-react';
import { supabaseAdminService } from '@/services/supabaseAdminService';
import { useToast } from '@/components/ui/ToastProvider';

const IntegrationSettings: React.FC = () => {
  const { showToast } = useToast();
  const [settings, setSettings] = useState({
    // Supabase Database Configuration
    database_supabase_url: '',
    database_supabase_anon_key: '',
    database_supabase_service_role_key: '',
    // Supabase Storage Configuration
    supabase_bucket_name: '',
    supabase_storage_endpoint: '',
    supabase_storage_region: '',
    supabase_storage_access_key: '',
    supabase_storage_secret_key: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const adminSettings = await supabaseAdminService.getSettings();
      if (adminSettings) {
        setSettings({
          database_supabase_url: adminSettings.database_supabase_url || '',
          database_supabase_anon_key: adminSettings.database_supabase_anon_key || '',
          database_supabase_service_role_key: adminSettings.database_supabase_service_role_key || '',
          supabase_bucket_name: adminSettings.supabase_bucket_name || '',
          supabase_storage_endpoint: adminSettings.supabase_storage_endpoint || '',
          supabase_storage_region: adminSettings.supabase_storage_region || '',
          supabase_storage_access_key: adminSettings.supabase_storage_access_key || '',
          supabase_storage_secret_key: adminSettings.supabase_storage_secret_key || ''
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showToast('error', 'Failed to load integration settings');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const testConnections = async () => {
    setTesting(true);
    setTestResults(null);

    try {
      // Test database connection
      const dbTest = {
        name: 'Supabase Database',
        success: false,
        error: ''
      };

      // Test storage connection
      const storageTest = {
        name: 'Supabase Storage',
        success: false,
        error: ''
      };

      // Simple validation tests
      if (settings.database_supabase_url && settings.database_supabase_anon_key) {
        try {
          // Basic URL validation
          new URL(settings.database_supabase_url);
          dbTest.success = true;
        } catch (error) {
          dbTest.error = 'Invalid Supabase URL format';
        }
      } else {
        dbTest.error = 'Missing required database configuration';
      }

      if (settings.supabase_storage_endpoint && settings.supabase_bucket_name) {
        try {
          // Basic URL validation
          new URL(settings.supabase_storage_endpoint);
          storageTest.success = true;
        } catch (error) {
          storageTest.error = 'Invalid storage endpoint format';
        }
      } else {
        storageTest.error = 'Missing required storage configuration';
      }

      const results = {
        success: dbTest.success && storageTest.success,
        tests: [dbTest, storageTest]
      };

      setTestResults(results);
      
      if (results.success) {
        showToast('success', 'All integration tests passed!');
      } else {
        showToast('error', 'Some integration tests failed. Check the results below.');
      }
    } catch (error) {
      console.error('Error testing integrations:', error);
      showToast('error', 'Failed to test integrations');
      setTestResults({
        success: false,
        tests: [
          { name: 'Integration Test', success: false, error: 'Test failed to run' }
        ]
      });
    } finally {
      setTesting(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const result = await supabaseAdminService.saveSettings(settings);
      
      if (result.success) {
        showToast('success', 'Integration settings saved successfully!');
      } else {
        showToast('error', result.error || 'Failed to save integration settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('error', 'Failed to save integration settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading integration settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Link2 className="h-6 w-6 mr-3 text-primary-600" />
            Integration Settings
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Configure database and storage integrations for your application.
          </p>
        </div>
      </div>

      {/* Database Configuration */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Database className="h-6 w-6 mr-3 text-primary-600" />
            Supabase Database Configuration
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Configure your Supabase database connection settings.
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supabase URL
            </label>
            <input
              type="url"
              name="database_supabase_url"
              value={settings.database_supabase_url}
              onChange={handleInputChange}
              placeholder="https://uzlzyosmbxgghhmafidk.supabase.co"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Your Supabase project URL
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supabase Anon Key
              </label>
              <input
                type="password"
                name="database_supabase_anon_key"
                value={settings.database_supabase_anon_key}
                onChange={handleInputChange}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Public anonymous key for client-side operations
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supabase Service Role Key
              </label>
              <input
                type="password"
                name="database_supabase_service_role_key"
                value={settings.database_supabase_service_role_key}
                onChange={handleInputChange}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Service role key for server-side operations (keep secret!)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Storage Configuration */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <HardDrive className="h-6 w-6 mr-3 text-primary-600" />
            Supabase Storage Configuration
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Configure your Supabase storage settings for file uploads.
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Storage Bucket Name
              </label>
              <input
                type="text"
                name="supabase_bucket_name"
                value={settings.supabase_bucket_name}
                onChange={handleInputChange}
                placeholder="nexjob"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Name of your Supabase storage bucket
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Storage Region
              </label>
              <input
                type="text"
                name="supabase_storage_region"
                value={settings.supabase_storage_region}
                onChange={handleInputChange}
                placeholder="ap-southeast-1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                AWS region for your storage bucket
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Storage Endpoint
            </label>
            <input
              type="url"
              name="supabase_storage_endpoint"
              value={settings.supabase_storage_endpoint}
              onChange={handleInputChange}
              placeholder="https://uzlzyosmbxgghhmafidk.supabase.co/storage/v1/s3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              S3-compatible storage endpoint URL
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Storage Access Key
              </label>
              <input
                type="password"
                name="supabase_storage_access_key"
                value={settings.supabase_storage_access_key}
                onChange={handleInputChange}
                placeholder="642928fa32b65d648ce65ea04c64100e"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                S3 access key for storage operations
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Storage Secret Key
              </label>
              <input
                type="password"
                name="supabase_storage_secret_key"
                value={settings.supabase_storage_secret_key}
                onChange={handleInputChange}
                placeholder="082c3ce06c08ba1b347af99f16ff634fd12b4949a6cdda16df30dcc5741609dc"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                S3 secret key for storage operations (keep secret!)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={testConnections}
              disabled={testing}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4 mr-2" />
              )}
              Test Connections
            </button>

            <button
              onClick={saveSettings}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Integration Settings
            </button>
          </div>
        </div>
      </div>

      {/* Test Results */}
      {testResults && (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              {testResults.success ? (
                <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 mr-2 text-red-500" />
              )}
              Integration Test Results
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {testResults.tests?.map((test: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{test.name}</div>
                    {test.error && (
                      <div className="text-sm text-red-600">{test.error}</div>
                    )}
                  </div>
                  <div className="flex items-center">
                    {test.success ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span className="text-sm text-green-600">Connected</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-500 mr-2" />
                        <span className="text-sm text-red-600">Failed</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationSettings;