import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Layers } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { BackButton, PageBackground } from '../../shared';
import bg6 from '../../assets/images/bg6_hd.jpg';
import api, { getImageUrl } from '../../services/api';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import { getLocalizedCategoryName } from '../../utils/productLocalization';

const CategoriesPage = () => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    api.get('/api/categories').then(res => {
      setCategories(res.data.categories || []);
    }).finally(() => {
      if (!silent) setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchCategories(false);
  }, [fetchCategories]);

  useAutoRefresh(fetchCategories, 15000);

  return (
    <div className="relative max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6 pb-24 md:pb-8">
      <PageBackground image={bg6} />
      <div>
        <BackButton fallbackPath="/buyer" label="Back to Marketplace" className="mb-4" />
      </div>
      <div>
        <h1 className="text-2xl font-extrabold text-kisan-dark">{t('categories')}</h1>
        <p className="text-xs text-kisan-muted">Browse fresh farm produce by category</p>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-kisan-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((c) => (
            <div
              key={c.id}
              onClick={() => navigate(`/buyer?category_id=${c.id}`)}
              className="group cursor-pointer bg-white rounded-3xl border border-kisan-border shadow-card overflow-hidden hover:shadow-float transition-all duration-300 flex flex-col justify-between"
            >
              <div className="h-44 overflow-hidden bg-kisan-bg relative flex items-center justify-center">
                {c.image ? (
                  <img
                    src={getImageUrl(c.image)}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    alt={c.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <Layers className="w-12 h-12 text-kisan-primary/30" />
                )}
                <span className="absolute bottom-2.5 right-2.5 bg-black/60 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">
                  {c.product_count} items
                </span>
              </div>

              <div className="p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-kisan-dark group-hover:text-kisan-primary transition-colors">
                    {getLocalizedCategoryName(c.name, language)}
                  </h3>
                  <p className="text-xs text-kisan-muted mt-0.5 line-clamp-1">{c.description}</p>
                </div>

                <div className="w-8 h-8 rounded-full bg-kisan-light text-kisan-primary flex items-center justify-center group-hover:bg-kisan-primary group-hover:text-white transition-colors flex-shrink-0 ml-3">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;
