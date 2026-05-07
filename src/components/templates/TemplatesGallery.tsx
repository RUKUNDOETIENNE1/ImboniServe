import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useSession } from 'next-auth/react';
import { Download } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  category: 'menu' | 'coaster' | 'poster' | 'table_tent' | 'sticker' | 'aframe' | 'business_card' | 'gift_card';
  imageUrl: string;
  downloadUrl: string;
  description?: string;
}

interface BusinessData {
  name: string;
  phone?: string;
  address?: string;
}

const TemplatesGallery: React.FC = () => {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        const response = await fetch('/api/business/current');
        if (response.ok) {
          const data = await response.json();
          setBusinessData({
            name: data.name || 'Your Business',
            phone: data.phone,
            address: data.address,
          });
        }
      } catch (error) {
        console.error('Failed to fetch business data:', error);
      }
    };

    if (status === 'authenticated' && session?.user) {
      fetchBusinessData();
    }
  }, [status, session]);

  const templates: Template[] = [
    {
      id: '1',
      name: 'Classic Menu',
      category: 'menu',
      imageUrl: '/templates/menu-template-1.svg',
      downloadUrl: '/templates/menu-template-1.svg',
      description: 'Professional menu template with categories and pricing',
    },
    {
      id: '2',
      name: 'Round Coaster',
      category: 'coaster',
      imageUrl: '/templates/coaster-template-1.svg',
      downloadUrl: '/templates/coaster-template-1.svg',
      description: 'Circular coaster design with your branding',
    },
    {
      id: '3',
      name: 'Promotional Poster',
      category: 'poster',
      imageUrl: '/templates/poster-template-1.svg',
      downloadUrl: '/templates/poster-template-1.svg',
      description: 'Eye-catching poster for special offers',
    },
    {
      id: '4',
      name: 'Table Tent',
      category: 'table_tent',
      imageUrl: '/templates/table-tent-template-1.svg',
      downloadUrl: '/templates/table-tent-template-1.svg',
      description: 'QR code table tent for contactless ordering',
    },
    {
      id: '5',
      name: 'Brand Sticker',
      category: 'sticker',
      imageUrl: '/templates/sticker-template-1.svg',
      downloadUrl: '/templates/sticker-template-1.svg',
      description: 'Custom sticker with your business logo',
    },
    {
      id: '6',
      name: 'A-Frame Sign',
      category: 'aframe',
      imageUrl: '/templates/aframe-template-1.svg',
      downloadUrl: '/templates/aframe-template-1.svg',
      description: 'Outdoor A-frame sign for visibility',
    },
    {
      id: '7',
      name: 'Business Card',
      category: 'business_card',
      imageUrl: '/templates/business-card-template-1.svg',
      downloadUrl: '/templates/business-card-template-1.svg',
      description: 'Professional business card design',
    },
    {
      id: '8',
      name: 'Gift Card',
      category: 'gift_card',
      imageUrl: '/templates/gift-card-template-1.svg',
      downloadUrl: '/templates/gift-card-template-1.svg',
      description: 'Customizable gift card template',
    },
  ];

  const filteredTemplates =
    selectedCategory === 'all'
      ? templates
      : templates.filter((template) => template.category === selectedCategory);

  const handleDownload = async (template: Template) => {
    setIsDownloading(template.id);
    try {
      const response = await fetch(template.downloadUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name.toLowerCase().replace(/\s+/g, '-')}.svg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download template. Please try again.');
    } finally {
      setIsDownloading(null);
    }
  };

  const templateTypes = [
    { value: 'all', label: t('common.all') || 'All' },
    { value: 'menu', label: t('templates.menu_template') },
    { value: 'coaster', label: t('templates.coaster_template') },
    { value: 'poster', label: t('templates.poster_template') },
    { value: 'table_tent', label: t('templates.table_tent_template') },
    { value: 'sticker', label: t('templates.sticker_template') },
    { value: 'aframe', label: t('templates.aframe_template') },
    { value: 'business_card', label: t('templates.business_card_template') },
    { value: 'gift_card', label: t('templates.gift_card_template') }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('templates.title')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t('templates.subtitle')}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 justify-center mb-8">
        {templateTypes.map((type) => (
          <button
            key={type.value}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selectedCategory === type.value
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            onClick={() => setSelectedCategory(type.value)}
          >
            {type.label}
            <span className="ml-2 text-xs opacity-75">
              ({type.value === 'all' ? templates.length : templates.filter(t => t.category === type.value).length})
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition group"
          >
            <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
              <img 
                src={template.imageUrl} 
                alt={template.name}
                className="w-full h-full object-contain p-4"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-4">
                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => handleDownload(template)}
                    disabled={isDownloading === template.id}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download size={16} />
                    {isDownloading === template.id ? 'Downloading...' : t('qr.download')}
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                {template.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {template.category.replace('_', ' ')}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-gray-700 dark:text-gray-300">
          {t('templates.save_time')}
        </p>
        <button className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition">
          {t('templates.view_more')}
        </button>
      </div>
    </div>
  );
};

export default TemplatesGallery;
