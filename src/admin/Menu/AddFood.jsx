import React, { useState, useEffect, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { axiosWithRefresh } from "../../axiosWithRefresh";
import { useMenuStore } from "../../menuStore";

const AddFood = () => {
  const { clearCachedData } = useMenuStore();
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    image: null,
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axiosWithRefresh({
          method: "get",
          url: "/public/foodCategories",
        });

        setCategories(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        toast.error("❌ Failed to load categories.");
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (
      !form.name ||
      !form.description ||
      !form.price ||
      !form.categoryId ||
      !form.image
    ) {
      toast.error("❌ All fields are required.");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("price", Number(form.price)); // convert to number
      formData.append("description", form.description);
      formData.append("categoryId", Number(form.categoryId)); // convert to int
      formData.append("image", form.image);
      formData.append("isActive", "true"); // API expects string "true"

      await axiosWithRefresh({
        method: "post",
        url: "/api/v1/admin/addFoodItem",
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("✅ Food item added successfully!");
      clearCachedData();

      setForm({
        name: "",
        description: "",
        price: "",
        categoryId: "",
        image: null,
      });

      if (fileInputRef.current) fileInputRef.current.value = null;
    } catch (err) {
      console.error("Add food error:", err);
      toast.error("❌ Failed to add food item.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Add New Food Item
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Food Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            placeholder="e.g., Momo Platter"
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            rows="3"
            placeholder="Short, tasty description..."
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="price"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Price (NPR)
            </label>
            <input
              id="price"
              name="price"
              type="number"
              value={form.price}
              onChange={handleChange}
              placeholder="e.g., 200"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="categoryId"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Category
            </label>
            <select
              id="categoryId"
              name="categoryId"
              value={form.categoryId}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md bg-white focus:ring-orange-500 focus:border-orange-500"
              required
            >
              <option value="" disabled>
                -- Select a Category --
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="image"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Food Image
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600 justify-center">
                <label
                  htmlFor="image"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500"
                >
                  <span>Upload an image</span>
                  <input
                    id="image"
                    name="image"
                    type="file"
                    accept="image/*"
                    onChange={handleChange}
                    className="sr-only"
                    required
                    ref={fileInputRef}
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 5MB</p>
              {form.image && (
                <p className="text-sm pt-2 text-green-600">
                  Selected: {form.image.name}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Add Food Item"}
          </button>
        </div>
      </form>

      <ToastContainer position="bottom-right" autoClose={4000} />
    </div>
  );
};

export default AddFood;