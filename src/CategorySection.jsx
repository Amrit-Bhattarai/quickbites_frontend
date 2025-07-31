import FoodCard from "./FoodCard";

const CategorySection = ({ category, items, onAddToCart }) => (
  <div className="mb-8">
    <div className="flex items-center gap-3 mb-6">
      {category?.imageUrl && (
        <img
          src={`${category.imageUrl}`}
          alt={category.name}
          className="w-8 h-8 rounded-full object-cover"
          loading="lazy"
        />
      )}
      <h2 className="text-xl sm:text-2xl font-semibold text-orange-800 truncate max-w-xs">
        {category?.name}
      </h2>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {items.length === 0 ? (
        <p className="text-gray-500 col-span-full text-center">
          No items available.
        </p>
      ) : (
        items.map((food) => (
          <FoodCard key={food.id} food={food} onAddToCart={onAddToCart} />
        ))
      )}
    </div>
  </div>
);

export default CategorySection;
