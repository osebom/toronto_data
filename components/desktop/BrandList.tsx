'use client';

import { FiClock } from 'react-icons/fi';
import { useStore } from '@/store/useStore';
import { formatDistance } from '@/lib/utils';
import { Brand } from '@/types';

export default function BrandList() {
  const { filteredBrands, setSelectedBrand, selectedBrand } = useStore();
  const brands = filteredBrands();

  const getBrandLogo = (brand: Brand) => {
    // Simple logo representation - in real app, you'd use actual logos
    const logos: Record<string, string> = {
      'Adidas': '⚡',
      'Nike': '✓',
      'Puma': '🐆',
      'Under Armour': 'U',
      'Timberland': '🌲',
      'EA7 Emporio Armani': 'A',
      'Converse': '★',
    };
    return logos[brand.name] || brand.name.charAt(0);
  };

  return (
    <div className="p-4 space-y-3">
      {brands.map((brand) => (
        <div
          key={brand.id}
          onClick={() => setSelectedBrand(brand)}
          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
            selectedBrand?.id === brand.id
              ? 'bg-green-500/20 border border-green-500'
              : 'bg-dark-card hover:bg-gray-700'
          }`}
        >
          {/* Brand Logo */}
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center flex-shrink-0">
            <span className="text-dark-bg font-bold text-lg">
              {getBrandLogo(brand)}
            </span>
          </div>

          {/* Brand Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium truncate">{brand.name}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>{formatDistance(brand.distance)}</span>
              <span>•</span>
              <span className={brand.isOpen ? 'text-green-400' : 'text-gray-500'}>
                {brand.openingHours}
              </span>
            </div>
          </div>

          {/* Icons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="text-gray-400 hover:text-white">
              <FiClock size={18} />
            </button>
            <button className="text-gray-400 hover:text-white">
              <span className="text-lg">😞</span>
            </button>
          </div>
        </div>
      ))}

      {brands.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          No brands found
        </div>
      )}
    </div>
  );
}

