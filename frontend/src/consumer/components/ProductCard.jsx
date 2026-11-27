import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Plus, Minus, ShieldCheck, Leaf, Star } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getLocalizedProductName, getLocalizedUnit } from '../../utils/productLocalization';

const ProductCard = ({ product, onQuickAdd, shoppingMode = 'community' }) => {
  const { addToCart, updateQuantity, removeFromCart, cart } = useCart();
  const { language, t } = useLanguage();

  const cartItem = cart?.items?.find(item => item.product_id === product.id);
  const isInCart = !!cartItem;
  const cartQty = cartItem?.quantity || 0;

  const individualPrice = parseFloat(product.price) || 0;
  const bulkPrice = product.bulk_price ? parseFloat(product.bulk_price) : Math.round(individualPrice * 0.75);
  const savings = Math.max(0, individualPrice - bulkPrice);
  const savingsPercent = individualPrice > 0 ? Math.round((savings / individualPrice) * 100) : 25;

  const handleAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickAdd) {
      onQuickAdd(product);
    } else {
      await addToCart(product.id, 1);
    }
  };

  const handleIncrement = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartItem) {
      await updateQuantity(cartItem.id, cartQty + 1);
    }
  };

  const handleDecrement = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartItem) {
      if (cartQty <= 1) {
        await removeFromCart(cartItem.id);
      } else {
        await updateQuantity(cartItem.id, cartQty - 1);
      }
    }
  };

  return (
    <div className="w-full min-w-0 max-w-full bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      {/* Product Image & Badges */}
      <Link to={`/buyer/product/${product.id}`} className="relative h-32 sm:h-36 overflow-hidden bg-gray-50 block">
        <img
          src={product.image_url || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Minimalist Organic Badge */}
        {product.is_organic ? (
          <span className="absolute top-2 left-2 bg-emerald-800/90 backdrop-blur-xs text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md flex items-center shadow-xs">
            <Leaf className="w-2.5 h-2.5 mr-0.5 text-emerald-300" />
            {t('organic') || 'Organic'}
          </span>
        ) : null}

        {/* Crisp Unit Pill */}
        <span className="absolute top-2 right-2 bg-black/50 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
          {getLocalizedUnit(product.unit, language)}
        </span>
      </Link>

      {/* Product Details */}
      <div className="p-2.5 sm:p-3 flex flex-col flex-1 justify-between">
        <div>
          {/* Location Line */}
          <div className="flex items-center text-[10px] text-gray-500 mb-0.5 truncate">
            <MapPin className="w-2.5 h-2.5 mr-0.5 text-emerald-600 flex-shrink-0" />
            <span className="truncate">{product.location || 'Local Farm'}</span>
          </div>

          {/* Title with uniform 2-line height */}
          <Link to={`/buyer/product/${product.id}`} className="block">
            <h3 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-tight h-8 flex items-center">
              {getLocalizedProductName(product.name, language)}
            </h3>
          </Link>

          {/* Farmer Attribution + Star Rating */}
          <div className="flex items-center justify-between gap-1 mt-0.5">
            <div className="flex items-center space-x-1 text-[10px] text-gray-500 truncate min-w-0">
              <span className="truncate">{product.farm_name || 'Verified Farmer'}</span>
              <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 flex-shrink-0" />
            </div>
            {product.review_count > 0 && (
              <span className="inline-flex items-center space-x-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200/70 text-[9px] font-black px-1.5 py-0.5 rounded-md flex-shrink-0">
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                <span>{product.average_rating}</span>
                <span className="text-emerald-600/80 font-bold">({product.review_count})</span>
              </span>
            )}
          </div>
        </div>

        {/* Pricing & Add to Cart */}
        <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between gap-1">
          <div className="min-w-0 flex-1">
            {shoppingMode === 'community' ? (
              <div>
                <div className="flex items-baseline space-x-1 flex-wrap">
                  <span className="text-sm sm:text-base font-black text-emerald-800 leading-none">
                    ₹{bulkPrice.toFixed(0)}
                  </span>
                  {savings > 0 && (
                    <span className="text-[10px] text-gray-400 line-through">
                      ₹{individualPrice.toFixed(0)}
                    </span>
                  )}
                </div>
                {savingsPercent > 0 && (
                  <div className="mt-0.5">
                    <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded-md inline-block leading-none border border-emerald-100 max-w-full truncate">
                      {t('savePercent')} {savingsPercent}%
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <span className="text-sm sm:text-base font-black text-gray-900 leading-none">
                  ₹{individualPrice.toFixed(0)}
                </span>
                <span className="text-[10px] text-gray-400 ml-0.5">
                  /{getLocalizedUnit(product.unit, language)}
                </span>
              </div>
            )}
          </div>

          {/* Stepper or ADD Button */}
          {isInCart ? (
            <div className="flex items-center bg-emerald-700 text-white rounded-xl overflow-hidden shadow-xs flex-shrink-0 border border-emerald-800">
              <button
                type="button"
                onClick={handleDecrement}
                className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-white hover:bg-emerald-800 active:bg-emerald-900 transition-colors"
                title="Decrease quantity"
              >
                <Minus className="w-3 h-3 stroke-[2.5]" />
              </button>
              <span className="px-1.5 text-xs font-black text-white select-none min-w-[16px] text-center">
                {cartQty}
              </span>
              <button
                type="button"
                onClick={handleIncrement}
                className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-white hover:bg-emerald-800 active:bg-emerald-900 transition-colors"
                title="Increase quantity"
              >
                <Plus className="w-3 h-3 stroke-[2.5]" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              disabled={!product.is_available}
              className={`
                flex items-center justify-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-black transition-all shadow-xs flex-shrink-0 active:scale-95
                ${!product.is_available 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                }
              `}
              title="Add to Cart"
            >
              <span>{shoppingMode === 'community' ? `+ ${t('pool')}` : t('addToCart')}</span>
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
