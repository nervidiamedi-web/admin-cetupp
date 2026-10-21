import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Package,
  Layers,
  Sparkles,
  Info,
  X,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { getProducts } from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/supabase';
import type { Product } from '../../types/database';

// Generated high-fidelity clinical skincare photography assets
import cleanserImg from '../../assets/images/skincare_gentle_cleanser_1792580296740.jpg';
import creamImg from '../../assets/images/skincare_moisturizing_cream_1792580296792.jpg';
import babyImg from '../../assets/images/skincare_baby_lotion_1792580297823.jpg';
import sunImg from '../../assets/images/skincare_sun_gel_1792580297395.jpg';

interface ProductsListProps {
  onOpenRlsGuide: () => void;
}

export const ProductsList: React.FC<ProductsListProps> = ({ onOpenRlsGuide }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const loadProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getProducts({
        category: categoryFilter,
        search: searchQuery,
      });

      if (res.error) {
        setError(res.error);
      } else {
        setProducts(res.data || []);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load products';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [categoryFilter, searchQuery]);

  const getProductImage = (product: Product): string => {
    if (product.image_url) return product.image_url;
    const cat = (product.category || '').toLowerCase();
    const name = (product.name || '').toLowerCase();

    if (cat.includes('baby') || name.includes('baby')) {
      return babyImg;
    }
    if (cat.includes('sun') || name.includes('sun') || name.includes('spf')) {
      return sunImg;
    }
    if (cat.includes('cleanser') || name.includes('cleanser') || name.includes('wash')) {
      return cleanserImg;
    }
    return creamImg;
  };

  const categories = [
    { id: 'all', label: 'All Products' },
    { id: 'Face Cleanser', label: 'Face Cleansers' },
    { id: 'Moisturizer', label: 'Moisturizers' },
    { id: 'Baby Care', label: 'Baby Care' },
    { id: 'Sunscreen', label: 'Sun Protection' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Skincare Product Catalog
          </h1>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <span>Dermatological Formulas</span>
            <span aria-hidden="true">·</span>
            <span>Read-Only Inventory Synchronization</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{products.length} products listed</span>
          </div>
        </div>

        <button
          onClick={loadProducts}
          disabled={isLoading}
          className="p-2 self-start sm:self-auto text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          title="Refresh Catalog"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#0b4d8c]' : ''}`} />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3.5">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                categoryFilter === cat.id
                  ? 'bg-[#0b4d8c] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by title, size, badge, or description..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0b4d8c] text-slate-900 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 animate-pulse">
              <div className="h-44 bg-slate-100 rounded-lg" />
              <div className="h-4 bg-slate-100 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center space-y-3">
          <Package className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-base font-semibold text-slate-900">No Products Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No items matched your current filter criteria.
          </p>
          <button
            onClick={() => {
              setCategoryFilter('all');
              setSearchQuery('');
            }}
            className="px-3.5 py-1.5 text-xs font-medium text-[#0b4d8c] bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => {
            const imgSrc = getProductImage(product);
            return (
              <div
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col group"
              >
                {/* Product Image Box */}
                <div className="relative aspect-[4/3] bg-slate-50 overflow-hidden border-b border-slate-100">
                  <img
                    src={imgSrc}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.badge && (
                    <span className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-white/95 backdrop-blur-xs text-[10px] font-semibold text-[#0b4d8c] rounded-md border border-slate-200 shadow-2xs">
                      {product.badge}
                    </span>
                  )}
                  {product.stock <= 10 && (
                    <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 bg-amber-500/90 text-white text-[10px] font-semibold rounded-md shadow-2xs">
                      Low Stock: {product.stock}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-1 justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
                      <span>{product.category}</span>
                      {product.size && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{product.size}</span>
                        </>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug group-hover:text-[#0b4d8c] transition-colors">
                      {product.name}
                    </h3>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">RETAIL PRICE</span>
                      <span className="text-base font-bold font-mono text-[#0b4d8c] tabular-nums">
                        {formatCurrency(product.price)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">IN STOCK</span>
                      <span className="text-xs font-mono font-semibold text-slate-700 tabular-nums">
                        {product.stock} units
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="relative aspect-video bg-slate-50 overflow-hidden">
              <img
                src={getProductImage(selectedProduct)}
                alt={selectedProduct.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 right-3 p-1.5 bg-white/90 hover:bg-white text-slate-700 rounded-full shadow-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                  <span className="font-medium text-[#0b4d8c]">{selectedProduct.category}</span>
                  {selectedProduct.size && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>Volume: {selectedProduct.size}</span>
                    </>
                  )}
                  {selectedProduct.badge && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-700 font-semibold">{selectedProduct.badge}</span>
                    </>
                  )}
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  {selectedProduct.name}
                </h2>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  {selectedProduct.description || 'Clinical skincare formula designed for sensitive skin.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[11px] text-slate-400 block font-semibold uppercase tracking-wider">
                    Price (LKR)
                  </span>
                  <span className="text-base font-bold text-[#0b4d8c] font-mono tabular-nums">
                    {formatCurrency(selectedProduct.price)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-semibold uppercase tracking-wider">
                    Current Inventory
                  </span>
                  <span className="text-base font-bold text-slate-800 font-mono tabular-nums">
                    {selectedProduct.stock} units
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-semibold uppercase tracking-wider">
                    Catalog Status
                  </span>
                  <span className="font-semibold text-emerald-700 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {selectedProduct.is_active ? 'Active for Sale' : 'Archived'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-semibold uppercase tracking-wider">
                    Database Slug
                  </span>
                  <span className="font-mono text-[11px] text-slate-700 truncate block mt-0.5">
                    {selectedProduct.slug}
                  </span>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Created: {formatDate(selectedProduct.created_at)}</span>
                <span>Updated: {formatDate(selectedProduct.updated_at)}</span>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex justify-end">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0b4d8c] hover:bg-[#083866] rounded-lg transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
