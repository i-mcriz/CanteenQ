'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  Clock,
  Star,
  Plus,
  Minus,
  CheckCircle2,
  X,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { fetchGraphQL } from '@/lib/graphql';
import { getSocket } from '@/lib/socket';
import { FALLBACK_CATEGORIES, FALLBACK_FOODS } from '@/lib/mockMenu';

interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  categoryId: string;
  category?: { id: string; name: string };
  preparationTime: number;
  stockQuantity: number;
  isAvailable: boolean;
  isVeg: boolean;
  rating: number;
}

interface Category {
  id: string;
  name: string;
}

export default function MenuPage() {
  const { addItem } = useCart();
  const [foods, setFoods] = useState<FoodItem[]>(FALLBACK_FOODS);
  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState('DEFAULT');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [specialNote, setSpecialNote] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadMenu = async () => {
    try {
      const res = await fetchGraphQL(`
        query GetFullMenu {
          getCategories {
            id
            name
          }
          getMenu {
            id
            name
            description
            price
            image
            categoryId
            category {
              id
              name
            }
            preparationTime
            stockQuantity
            isAvailable
            isVeg
            rating
          }
        }
      `);

      if (res?.getCategories && res.getCategories.length > 0) {
        setCategories(res.getCategories);
      }
      if (res?.getMenu && res.getMenu.length > 0) {
        setFoods(res.getMenu);
      }
    } catch (e) {
      console.warn('Backend/Database not yet reachable, showing default menu catalog:', e);
      setCategories(FALLBACK_CATEGORIES);
      setFoods(FALLBACK_FOODS);
    }
  };

  useEffect(() => {
    loadMenu();

    // Listen for real-time food availability and stock updates
    const socket = getSocket();
    const handleAvailabilityChange = (update: any) => {
      setFoods((prev) =>
        prev.map((f) =>
          f.id === update.foodItemId
            ? {
                ...f,
                isAvailable: update.isAvailable,
                stockQuantity: update.stockQuantity ?? f.stockQuantity,
                preparationTime: update.preparationTime ?? f.preparationTime,
              }
            : f,
        ),
      );
    };

    socket.on('FOOD_AVAILABILITY_CHANGED', handleAvailabilityChange);
    return () => {
      socket.off('FOOD_AVAILABILITY_CHANGED', handleAvailabilityChange);
    };
  }, []);

  // Filter and Sort Logic
  const filteredFoods = foods
    .filter((item) => {
      if (selectedCategory !== 'ALL' && item.categoryId !== selectedCategory) return false;
      if (vegOnly && !item.isVeg) return false;
      if (availableOnly && (!item.isAvailable || item.stockQuantity <= 0)) return false;
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        return item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query);
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'PRICE_LOW') return a.price - b.price;
      if (sortBy === 'PRICE_HIGH') return b.price - a.price;
      if (sortBy === 'RATING') return b.rating - a.rating;
      if (sortBy === 'PREP_TIME') return a.preparationTime - b.preparationTime;
      return 0;
    });

  const handleQuickAdd = (e: React.MouseEvent, item: FoodItem) => {
    e.stopPropagation();
    if (!item.isAvailable || item.stockQuantity <= 0) return;
    addItem(item, 1);
    showToast(`Added ${item.name} to cart`);
  };

  const handleModalAdd = () => {
    if (!selectedFood) return;
    addItem(selectedFood, modalQuantity);
    showToast(`Added ${modalQuantity}x ${selectedFood.name} to cart`);
    setSelectedFood(null);
    setModalQuantity(1);
    setSpecialNote('');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-8 right-8 z-50 bg-[#161b27] border border-[#1f2937] text-white px-5 py-3 rounded-2xl shadow-float flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-blue-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-white">Campus Canteen Menu</h1>
          <p className="text-slate-400 text-sm mt-1">
            Order fresh meals, snacks & beverages. Track real-time preparation time and queue slot.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search biryani, dosa, coffee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#1f2937] bg-[#161b27] text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-subtle"
          />
        </div>
      </div>

      {/* Categories & Filter Bar */}
      <div className="space-y-4">
        {/* Category Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-primary text-white shadow-md shadow-primary/25'
                : 'bg-[#161b27] text-slate-300 hover:bg-white/5 border border-[#1f2937]'
            }`}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-primary text-white shadow-md shadow-primary/25'
                  : 'bg-[#161b27] text-slate-300 hover:bg-white/5 border border-[#1f2937]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Secondary Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#161b27] p-3 rounded-2xl border border-[#1f2937] text-xs">
          <div className="flex items-center gap-4">
            {/* Veg Toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={vegOnly}
                onChange={(e) => setVegOnly(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-[#1f2937] bg-[#0d1117]"
              />
              <span className="font-semibold text-slate-300 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Pure Veg
              </span>
            </label>

            {/* In Stock Only */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary border-[#1f2937] bg-[#0d1117]"
              />
              <span className="font-semibold text-slate-300">Available Only</span>
            </label>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#0d1117] border border-[#1f2937] rounded-lg px-2.5 py-1 text-slate-300 font-medium focus:outline-none focus:ring-1 focus:ring-primary text-xs"
            >
              <option value="DEFAULT">Recommended</option>
              <option value="PRICE_LOW">Price: Low to High</option>
              <option value="PRICE_HIGH">Price: High to Low</option>
              <option value="RATING">Highest Rated</option>
              <option value="PREP_TIME">Fastest Prep</option>
            </select>
          </div>
        </div>
      </div>

      {/* Food Items Grid */}
      {filteredFoods.length === 0 ? (
        <div className="text-center py-16 bg-[#161b27] rounded-3xl border border-[#1f2937] space-y-3">
          <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="font-heading font-bold text-white text-lg">No dishes found</h3>
          <p className="text-slate-400 text-xs">Try clearing filters or searching for something else.</p>
          <button
            onClick={() => {
              setSelectedCategory('ALL');
              setSearchQuery('');
              setVegOnly(false);
              setAvailableOnly(false);
            }}
            className="px-4 py-2 rounded-xl bg-white/10 text-slate-200 text-xs font-bold hover:bg-white/15"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredFoods.map((item) => {
            const isSoldOut = !item.isAvailable || item.stockQuantity <= 0;
            const isLowStock = !isSoldOut && item.stockQuantity < 10;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedFood(item)}
                className={`bg-[#161b27] rounded-2xl border border-[#1f2937] overflow-hidden shadow-subtle hover:border-primary/40 hover:shadow-premium transition-all duration-300 flex flex-col justify-between cursor-pointer group ${
                  isSoldOut ? 'opacity-65' : ''
                }`}
              >
                {/* Food Image */}
                <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop'}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Veg / Non-Veg Indicator */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span
                      className={`w-3.5 h-3.5 rounded-sm border-2 border-white flex items-center justify-center ${
                        item.isVeg ? 'bg-blue-600' : 'bg-red-600'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-md">
                      {item.category?.name}
                    </span>
                  </div>

                  {/* Rating */}
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg text-xs font-bold text-white flex items-center gap-1 shadow-sm border border-white/10">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span>{item.rating.toFixed(1)}</span>
                  </div>

                  {/* Prep Time */}
                  <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-lg text-[11px] font-medium flex items-center gap-1 border border-white/10">
                    <Clock className="w-3 h-3 text-primary" />
                    <span>{item.preparationTime}m</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-heading font-bold text-base text-white group-hover:text-primary transition-colors line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#1f2937] flex items-center justify-between">
                    <div>
                      <span className="font-heading font-bold text-lg text-primary">
                        ₹{item.price}
                      </span>
                      {/* Stock badge */}
                      <div className="mt-0.5">
                        {isSoldOut ? (
                          <span className="text-[10px] font-bold text-red-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            Sold Out
                          </span>
                        ) : isLowStock ? (
                          <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Only {item.stockQuantity} left
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-blue-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            Available
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      disabled={isSoldOut}
                      onClick={(e) => handleQuickAdd(e, item)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm ${
                        isSoldOut
                          ? 'bg-white/5 text-slate-500 cursor-not-allowed border border-[#1f2937] shadow-none'
                          : 'bg-primary text-white hover:bg-primary-dark hover:scale-105 active:scale-95'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FOOD DETAILS MODAL */}
      {selectedFood && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="bg-[#161b27] rounded-3xl max-w-lg w-full overflow-hidden shadow-float border border-[#1f2937] animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Image */}
            <div className="relative h-56 w-full bg-slate-900 shrink-0">
              <img
                src={selectedFood.image || 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop'}
                alt={selectedFood.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedFood(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-md transition-all border border-white/10"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 border border-white/10">
                <Clock className="w-4 h-4 text-primary" />
                <span>Prep Time: ~{selectedFood.preparationTime} min</span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3.5 h-3.5 rounded-sm border-2 border-white flex items-center justify-center ${
                        selectedFood.isVeg ? 'bg-blue-600' : 'bg-red-600'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    </span>
                    <h2 className="text-xl font-bold font-heading text-white">{selectedFood.name}</h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{selectedFood.category?.name || 'General'}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold font-heading text-primary">₹{selectedFood.price}</div>
                  <div className="text-[11px] text-slate-500">incl. all taxes</div>
                </div>
              </div>

              <p className="text-slate-300 text-sm leading-relaxed">{selectedFood.description}</p>

              {/* Special instructions */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-slate-300">Special Cooking Instructions (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Less spicy, extra sauce, well done"
                  value={specialNote}
                  onChange={(e) => setSpecialNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#1f2937] bg-[#0d1117] text-white placeholder:text-slate-600 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 bg-[#0d1117] border-t border-[#1f2937] flex items-center justify-between gap-4 shrink-0">
              {/* Quantity Counter */}
              <div className="flex items-center gap-3 bg-[#161b27] px-3 py-1.5 rounded-xl border border-[#1f2937]">
                <button
                  onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold text-white w-4 text-center">{modalQuantity}</span>
                <button
                  onClick={() => setModalQuantity(modalQuantity + 1)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                disabled={!selectedFood.isAvailable || selectedFood.stockQuantity <= 0}
                onClick={handleModalAdd}
                className="flex-1 py-3.5 px-6 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark shadow-md shadow-primary/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart • ₹{selectedFood.price * modalQuantity}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
