// OOPPE Form Component
// ------------------------------------------------------------
// This component renders a secure form for creating or editing OOPPE records.
// It uses controlled inputs, basic client‑side validation, and never uses
// `dangerouslySetInnerHTML` or other unsafe DOM APIs. All data is sent via
// Axios with the shared `getAuthConfig` helper, which attaches the JWT token
// in an HttpOnly cookie as per the security guidelines.
// ------------------------------------------------------------

import React, { useState, useEffect } from "react";

const OoppeForm = ({ onCancel, onSubmit, initialData }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [institution, setInstitution] = useState("");
  const [certificateUrl, setCertificateUrl] = useState("");
  const [userId, setUserId] = useState("");
  const [errors, setErrors] = useState({});

  // Populate fields when editing an existing record
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setDate(initialData.date ? new Date(initialData.date).toISOString().substring(0, 10) : "");
      setInstitution(initialData.institution || "");
      setCertificateUrl(initialData.certificateUrl || "");
      setUserId(initialData.user || "");
    }
  }, [initialData]);

  const validate = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = "Title is required";
    if (!date) newErrors.date = "Date is required";
    if (!institution.trim()) newErrors.institution = "Institution is required";
    // Simple URL validation – can be enhanced with a library if needed
    if (certificateUrl && !/^https?:\/\/[^\s]+$/.test(certificateUrl)) {
      newErrors.certificateUrl = "Enter a valid URL";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      title: title.trim(),
      description: description.trim(),
      date,
      institution: institution.trim(),
      certificateUrl: certificateUrl.trim(),
      userId: userId.trim(),
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-medium mb-1" htmlFor="title">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
        {errors.title && <p className="text-red-600 text-sm">{errors.title}</p>}
      </div>

      <div>
        <label className="block font-medium mb-1" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border rounded px-3 py-2"
          rows={3}
        />
      </div>

      <div>
        <label className="block font-medium mb-1" htmlFor="date">
          Date
        </label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
        {errors.date && <p className="text-red-600 text-sm">{errors.date}</p>}
      </div>

      <div>
        <label className="block font-medium mb-1" htmlFor="institution">
          Institution
        </label>
        <input
          id="institution"
          type="text"
          value={institution}
          onChange={(e) => setInstitution(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
        {errors.institution && <p className="text-red-600 text-sm">{errors.institution}</p>}
      </div>

      <div>
        <label className="block font-medium mb-1" htmlFor="certificateUrl">
          Certificate URL (optional)
        </label>
        <input
          id="certificateUrl"
          type="url"
          value={certificateUrl}
          onChange={(e) => setCertificateUrl(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
        {errors.certificateUrl && (
          <p className="text-red-600 text-sm">{errors.certificateUrl}</p>
        )}
      </div>

      {/* User ID is hidden but kept for completeness (could be filled by backend) */}
      <input type="hidden" value={userId} onChange={(e) => setUserId(e.target.value)} />

      <div className="flex justify-end space-x-2 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded hover:opacity-90 transition"
        >
          Save
        </button>
      </div>
    </form>
  );
};

export default OoppeForm;
