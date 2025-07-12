
import { GetServerSideProps } from 'next';
import AdminLayout from '@/components/admin/AdminLayout';
import AdvertisementSettings from '@/components/admin/AdvertisementSettings';
import { supabaseAdminService } from '@/services/supabaseAdminService';

export default function AdvertisementPage() {
  return (
    <AdminLayout currentPage="advertisement">
      <AdvertisementSettings />
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const profile = await supabaseAdminService.getCurrentProfileServerSide(context);
    
    if (!profile || profile.role !== 'super_admin') {
      return {
        redirect: {
          destination: '/login/',
          permanent: false,
        },
      };
    }

    return {
      props: {},
    };
  } catch (error) {
    console.error('Error in advertisement page getServerSideProps:', error);
    return {
      redirect: {
        destination: '/login/',
        permanent: false,
      },
    };
  }
};
