// store/menuStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useMenuStore = create(
  persist(
    (set) => ({
      cachedCategories: [],
      cachedFoods: [],
      setCachedData: (categories, foods) => {
        // safety check to avoid null values
        if (Array.isArray(categories) && Array.isArray(foods)) {
          set({ cachedCategories: categories, cachedFoods: foods });
        }
      },
      clearCachedData: () => set({ cachedCategories: [], cachedFoods: [] }), // Add this
    }),
    {
      name: "menu-cache", // key used in localStorage
      partialize: (state) => ({
        cachedCategories: state.cachedCategories,
        cachedFoods: state.cachedFoods,
      }),
    }
  )
);