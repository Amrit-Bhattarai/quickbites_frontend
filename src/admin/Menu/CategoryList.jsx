import React, { useEffect, useState } from "react";
import { axiosWithRefresh } from "../../axiosWithRefresh";

const BASE_URL = "http://localhost:8080";
const IMAGE_BASE_URL = `${BASE_URL}/uploads/images/foodCategoryImages/`;

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    imageUrl: "",
    image: null,
    active: true,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axiosWithRefresh({
        method: "get",
        url: "/public/foodCategories",
      });
      setCategories(res.data || []);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (cat) => {
    setEditingId(cat.id);
    setEditForm({
      name: cat.name,
      description: cat.description,
      imageUrl: cat.imageUrl,
      image: null,
      active: cat.active,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({
      name: "",
      description: "",
      imageUrl: "",
      image: null,
      active: true,
    });
  };

  const handleChange = (e) => {
    const { name, value, files, type, checked } = e.target;
    if (type === "file") {
      setEditForm((prev) => ({ ...prev, image: files[0] }));
    } else if (type === "checkbox") {
      setEditForm((prev) => ({ ...prev, active: checked }));
    } else {
      setEditForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const saveEdits = async () => {
    try {
      const formData = new FormData();
      formData.append("name", editForm.name);
      formData.append("description", editForm.description);
      if (editForm.image) formData.append("image", editForm.image);
      // active must be string "true" or "false"
      formData.append("active", editForm.active ? "true" : "false");

      await axiosWithRefresh({
        method: "put",
        url: `/api/v1/admin/foodCategory/${editingId}`,
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });

      await fetchCategories();
      cancelEditing();
    } catch {
      alert("❌ Failed to update category.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("❗ Delete this category?")) return;
    try {
      await axiosWithRefresh({
        method: "delete",
        url: `/api/v1/admin/foodCategory/${id}`,
      });
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
    } catch {
      alert("❌ Failed to delete category.");
    }
  };

  const toggleStatus = async (id, isActive) => {
    try {
      const url = `/api/v1/admin/foodCategory/${id}/${
        isActive ? "deactivate" : "activate"
      }`;
      await axiosWithRefresh({ method: "put", url });
      setCategories((prev) =>
        prev.map((cat) => (cat.id === id ? { ...cat, active: !isActive } : cat))
      );
    } catch {
      alert("❌ Failed to update status.");
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Food Categories</h2>

      {loading ? (
        <p>Loading categories...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-500">
                    No categories found.
                  </td>
                </tr>
              ) : (
                categories.map((cat) =>
                  editingId === cat.id ? (
                    <tr key={cat.id + "-edit"}>
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
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <textarea
                          name="description"
                          value={editForm.description}
                          onChange={handleChange}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          name="active"
                          checked={editForm.active}
                          onChange={handleChange}
                        />
                        <span
                          className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            editForm.active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                          {editForm.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                        <button
                          onClick={saveEdits}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="text-gray-500 hover:text-gray-700 ml-4"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={cat.id}>
                      <td className="px-6 py-4">

<img
  src={cat.imageUrl}
  alt={cat.name}
  className="h-16 w-16 object-cover rounded-md"
  onError={(e) => {
    e.target.onerror = null;
    e.target.src = "https://via.placeholder.com/400x300?text=No+Image";
  }}
/>
                      </td>
                      <td className="px-6 py-4">{cat.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {cat.description}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          onClick={() => toggleStatus(cat.id, cat.active)}
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer ${
                            cat.active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {cat.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => startEditing(cat)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CategoryList;