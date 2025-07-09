export interface Job {
  id: string;
  slug: string;
  title: string;
  content: string;
  company_name: string;
  kategori_pekerjaan: string;
  lokasi_provinsi: string;
  lokasi_kota: string;
  tipe_pekerjaan: string;
  pendidikan: string;
  industry: string;
  pengalaman: string;
  tag: string;
  gender: string;
  gaji: string;
  kebijakan_kerja: string;
  link: string;
  sumber_lowongan: string;
  created_at?: string;
  seo_title?: string;
  seo_description?: string;
  _id: {
    $oid: string;
  };
  id_obj: {
    $numberInt: string;
  };
}

export interface JobFilters {
  search: string;
  location: string;
  jobType: string;
  experience: string;
  salary: string;
  education: string;
  industry: string;
}

export interface AdminSettings {
  apiUrl: string;
  filtersApiUrl: string;
  authToken: string;
  siteTitle: string;
  siteDescription: string;
  homeTitle: string;
  homeDescription: string;
  jobsTitle: string;
  jobsDescription: string;
  articlesTitle: string;
  articlesDescription: string;
  // Sitemap settings
  sitemapUpdateInterval: number; // in minutes
  autoGenerateSitemap: boolean;
  lastSitemapUpdate: string;
  // Robots.txt settings
  robotsTxt: string;
}

export interface SitemapSettings {
  updateInterval: number; // in minutes
  autoGenerate: boolean;
  lastUpdate: string;
  itemsPerPage: number;
}