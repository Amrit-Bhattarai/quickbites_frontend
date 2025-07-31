import React, { useEffect, useState } from "react";
import { axiosWithRefresh } from "../../axiosWithRefresh";

const BASE_URL = "http://localhost:8080";
const IMAGE_BASE_URL = `${BASE_URL}/uploads/images/foodItemImages/`;

const FoodList = () => {
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    imageUrl: "",
    image: null,
  });

  useEffect(() => {
    fetchFoods();
    fetchCategories();
  }, []);

  const fetchFoods = async () => {
    setLoading(true);
    try {
      const res = await axiosWithRefresh({
        method: "get",
        url: "/public/foodItems",
      });
      setFoods(res.data || []);
    } catch (err) {
      console.error("Failed to fetch foods:", err);
      setFoods([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axiosWithRefresh({
        method: "get",
        url: "/public/foodCategories",
      });
      setCategories(res.data || []);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      setCategories([]);
    }
  };

  const startEditing = (food) => {
    setEditingId(food.id);
    setEditForm({
      name: food.name || "",
      description: food.description || "",
      price: food.price?.toString() || "",
      category: food.category?.id?.toString() || "",
      imageUrl: food.imageUrl || "",
      image: null,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({
      name: "",
      description: "",
      price: "",
      category: "",
      imageUrl: "",
      image: null,
    });
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const saveEdits = async () => {
    try {
      let imageUrl = editForm.imageUrl;

      if (editForm.image) {
        const imageFormData = new FormData();
        imageFormData.append("image", editForm.image);

        const imageUploadResponse = await axiosWithRefresh({
          method: "post",
          url: "/api/v1/admin/upload/foodItemImage",
          data: imageFormData,
          headers: { "Content-Type": "multipart/form-data" },
        });

        imageUrl = imageUploadResponse.data.imageUrl || editForm.image.name;
      }

      // Validate category selection
      if (!editForm.category) {
        alert("❌ Please select a category.");
        return;
      }

      const foodItemData = {
        id: editingId,
        name: editForm.name.trim(),
        price: parseFloat(editForm.price),
        description: editForm.description.trim(),
        imageUrl: imageUrl,
        // Only send category id (simplify to avoid backend errors)
        category: {
          id: parseInt(editForm.category),
        },
        foodVariants: [], // keep empty to avoid unintended overwrite
        active: true,
      };

      // Debug print before sending
      console.log("Updating food item with data:", foodItemData);

      await axiosWithRefresh({
        method: "put",
        url: `/api/v1/admin/foodItem/${editingId}`,
        data: foodItemData,
        headers: { "Content-Type": "application/json" },
      });

      await fetchFoods();
      cancelEditing();
    } catch (err) {
      console.error(
        "Failed to update food item:",
        err.response?.data || err.message || err
      );
      alert(
        "❌ Failed to update food item. Please check console for more details."
      );
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("❗ Delete this food item?")) return;
    try {
      await axiosWithRefresh({
        method: "delete",
        url: `/api/v1/admin/foodItem/${id}`,
      });
      setFoods((prev) => prev.filter((food) => food.id !== id));
    } catch (err) {
      console.error(
        "Failed to delete food item:",
        err.response?.data || err.message || err
      );
      alert("❌ Failed to delete food item.");
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Food Items</h2>

      {loading ? (
        <p>Loading food items...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3">Image</th>
                <th className="px-6 py-3">Name & Variants</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Price</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {foods.map((food) =>
                editingId === food.id ? (
                  <tr key={food.id + "-edit"}>
                    <td className="px-6 py-4">
                      <img
                        src={
                          editForm.image
                            ? URL.createObjectURL(editForm.image)
                            : `${IMAGE_BASE_URL}${editForm.imageUrl}`
                        }
                        alt="Preview"
                        className="h-16 w-16 object-cover rounded-md"
                      />
                      <input
                        type="file"
                        name="image"
                        accept="image/*"
                        onChange={handleChange}
                        className="mt-2"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        name="name"
                        value={editForm.name}
                        onChange={handleChange}
                        className="w-full border p-2 rounded"
                      />
                      <textarea
                        name="description"
                        value={editForm.description}
                        onChange={handleChange}
                        rows="2"
                        className="w-full mt-2 border p-2 rounded"
                        placeholder="Description"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <select
                        name="category"
                        value={editForm.category}
                        onChange={handleChange}
                        className="w-full border p-2 rounded"
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        name="price"
                        value={editForm.price}
                        onChange={handleChange}
                        className="w-full border p-2 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={saveEdits}
                        className="text-green-600 hover:underline"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="text-gray-600 hover:underline"
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr key={food.id}>
                    <td className="px-6 py-4">
                      <img
                        src={`${food.imageUrl}`}
                        alt={food.name}
                        className="h-16 w-16 object-cover rounded-md"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            "https://via.placeholder.com/400x300?text=No+Image";
                        }}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium">{food.name}</p>
                      <p className="text-sm text-gray-500">
                        {food.description}
                      </p>

                      {food.foodVariants && food.foodVariants.length > 0 && (
                        <ul className="mt-2 ml-4 list-disc list-inside text-sm text-gray-600">
                          {food.foodVariants.map((variant) => (
                            <li key={variant.id}>
                              {variant.name} - NPR {variant.price}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-6 py-4">{food.category?.name}</td>
                    <td className="px-6 py-4">NPR {food.price}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => startEditing(food)}
                        className="text-indigo-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(food.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>

          {foods.length === 0 && (
            <p className="text-center py-4 text-gray-500">
              No food items found.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default FoodList;
