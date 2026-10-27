'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { fetchGraphQL } from '@/lib/graphql';

export interface CartItem {
  id?: string;
  foodItemId: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  preparationTime: number;
  isVeg: boolean;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  tax: number;
  total: number;
  addItem: (item: { id: string; name: string; price: number; image?: string; preparationTime?: number; isVeg?: boolean }, quantity?: number) => void;
  updateQuantity: (foodItemId: string, quantity: number) => void;
  removeItem: (foodItemId: string) => void;
  clearCart: () => void;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Load local storage cart on first mount
  useEffect(() => {
    const saved = localStorage.getItem('sq_cart');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Save to local storage whenever items change
  useEffect(() => {
    localStorage.setItem('sq_cart', JSON.stringify(items));
  }, [items]);

  const addItem = (
    foodItem: { id: string; name: string; price: number; image?: string; preparationTime?: number; isVeg?: boolean },
    quantity: number = 1,
  ) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.foodItemId === foodItem.id);
      if (existing) {
        return prev.map((i) =>
          i.foodItemId === foodItem.id ? { ...i, quantity: i.quantity + quantity } : i,
        );
      } else {
        return [
          ...prev,
          {
            foodItemId: foodItem.id,
            name: foodItem.name,
            price: foodItem.price,
            image: foodItem.image,
            quantity,
            preparationTime: foodItem.preparationTime || 8,
            isVeg: foodItem.isVeg ?? true,
          },
        ];
      }
    });
  };

  const updateQuantity = (foodItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(foodItemId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.foodItemId === foodItemId ? { ...i, quantity } : i)),
    );
  };

  const removeItem = (foodItemId: string) => {
    setItems((prev) => prev.filter((i) => i.foodItemId !== foodItemId));
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('sq_cart');
  };

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const total = subtotal + tax;

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        tax,
        total,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
