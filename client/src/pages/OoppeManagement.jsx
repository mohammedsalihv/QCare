import Table from '../components/Table.jsx';
// OOPPE Management Page
// ------------------------------------------------------------
// This page allows users to view, create, edit, and delete OOPPE records.
// It follows secure coding guidelines: no innerHTML, all data via Axios
// with auth config, and input validation before sending to the backend.
// ------------------------------------------------------------

import React, { useEffect, useState } from "react";
import axios from "axios";
import { getAuthConfig } from "../utils/authConfig";
import OoppeForm from "../components/OoppeForm";

const OoppeManagement = () => {
  const [oopps, setOopps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const fetchOopps = async () => {
    try {
      const { data } = await axios.get("http://192.168.1.160:5000/api/ooppe", getAuthConfig());
      setOopps(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to load OOPPE records");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOopps();
  }, []);

  const handleCreate = async (values) => {
    try {
      const { data } = await axios.post(
        "http://192.168.1.160:5000/api/ooppe",
        values,
        getAuthConfig()
      );
      setOopps((prev) => [...prev, data]);
      setShowForm(false);
    } catch (err) {
      console.error(err);
      setError("Failed to create OOPPE record");
    }
  };

  const handleUpdate = async (id, values) => {
    try {
      const { data } = await axios.put(
        `http://192.168.1.160:5000/api/ooppe/${id}`,
        values,
        getAuthConfig()
      );
      setOopps((prev) => prev.map((item) => (item._id === id ? data : item)));
      setEditItem(null);
      setShowForm(false);
    } catch (err) {
      console.error(err);
      setError("Failed to update OOPPE record");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await axios.delete(`http://192.168.1.160:5000/api/ooppe/${id}`, getAuthConfig());
      setOopps((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      console.error(err);
      setError("Failed to delete OOPPE record");
    }
  };

  const openEdit = (item) => {
    setEditItem(item);
    setShowForm(true);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-semibold mb-4">OOPPE Management</h1>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      <button
        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded shadow hover:opacity-90 transition"
        onClick={() => {
          setEditItem(null);
          setShowForm(true);
        }}
      >
        Add New Record
      </button>
      {showForm && (
        <OopgeFormWrapper
          onCancel={() => setShowForm(false)}
          onSubmit={editItem ? (vals) => handleUpdate(editItem._id, vals) : handleCreate}
          initialData={editItem}
        />
      )}
      {loading ? (
        <p className="mt-4">Loading...</p>
      ) : (
        <Table className="min-w-full mt-4 border-collapse shadow-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Title</th>
              <th className="p-2 border">Institution</th>
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {oopps.map((item) => (
              <tr key={item._id} className="hover:bg-gray-50">
                <td className="p-2 border">{item.title}</td>
                <td className="p-2 border">{item.institution}</td>
                <td className="p-2 border">{new Date(item.date).toLocaleDateString()}</td>
                <td className="p-2 border space-x-2">
                  <button
                    className="text-blue-600"
                    onClick={() => openEdit(item)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-600"
                    onClick={() => handleDelete(item._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
};

// Wrapper component to avoid naming conflict with existing "OoppeForm" import
const OopgeFormWrapper = ({ onCancel, onSubmit, initialData }) => (
  <div className="fixed inset-0 bg-primary bg-opacity-40 flex items-center justify-center">
    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
      <OoppeForm onCancel={onCancel} onSubmit={onSubmit} initialData={initialData} />
    </div>
  </div>
);

export default OoppeManagement;
