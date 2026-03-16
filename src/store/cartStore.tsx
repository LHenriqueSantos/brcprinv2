"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type CartItemType = "digital" | "ready_stock" | "custom_pod";

export interface CartItem {
  id: string; // unique cart item id (e.g. timestamp or uuid)
  type: CartItemType;
  catalog_item_id?: number | null;
  title: string;
  price: number;
  quantity: number;
  image_url?: string;
  // Specifics
  color?: string;
  stl_file_url?: string;
  filament_id?: number | null;
  extras?: any;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, newQuantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("@brcprint_cart");
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse cart storage");
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to local storage on change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("@brcprint_cart", JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const addItem = (item: Omit<CartItem, "id">) => {
    setItems((prev) => {
      // Check if exact same item exists (same type, catalog id, and color)
      const existingIdx = prev.findIndex(
        (i) => i.type === item.type && i.catalog_item_id === item.catalog_item_id && i.color === item.color
      );

      if (existingIdx >= 0 && item.type !== "custom_pod") {
        const newItems = [...prev];
        newItems[existingIdx].quantity += item.quantity;
        return newItems;
      }

      const newItem = { ...item, id: Math.random().toString(36).substring(2, 10) + Date.now().toString(36) };
      return [...prev, newItem];
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, quantity: newQuantity } : i));
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((acc, curr) => acc + curr.quantity, 0);
  const subtotal = items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
