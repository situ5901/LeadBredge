"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";

const Profile = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("userName");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setFormData(parsedUser);
      } catch (error) {
        setFormData({ name: storedUser, email: "", phone: "" });
      }
    }
  }, []);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    localStorage.setItem("userName", JSON.stringify(formData));
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col md:flex-row  p-8">
      {/* Details Card */}
      <div className="bg-white rounded-xl shadow-md p-6 w-full md:w-3/4 flex flex-col md:flex-row items-start gap-6 ">
        {/* Image Section */}
        <div className="w-full md:w-1/3 flex justify-center mt-10  mx-auto">
          <Image
            src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava3.webp"
            alt="Profile Picture"
            width={250}
            height={250}
            className="object-cover rounded-full border-2 border-gray-300"
          />
        </div>

        {/* Details Section */}
        <div className="w-full mx-auto pl-30 md:w-2/3  mt-18 text-2xl">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            User Details
          </h2>
          <p className="text-gray-700 mb-2 ">
            <strong>Name:</strong> {formData.name}
          </p>
          <p className="text-gray-700 mb-2">
            <strong>Email:</strong> {formData.email}
          </p>
          <p className="text-gray-700 mb-2">
            <strong>Phone:</strong> {formData.phone}
          </p>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-black text-white rounded-xl shadow-lg p-6 w-full md:w-1/2 ">
        <h2 className="text-2xl font-bold mb-4">Edit User Details</h2>
        <form className="space-y-4">
          <div>
            <label className="block mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block mb-1">Phone</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring focus:ring-blue-400"
            />
          </div>
          {!isEditing ? (
            <button
              type="button"
              onClick={handleEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Edit
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Save
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default Profile;
