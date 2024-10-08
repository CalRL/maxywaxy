"use client";
import { useState, useEffect } from "react";

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const [files, setFiles] = useState<any[]>([]);
  const [editTags, setEditTags] = useState<string>("");

  const [file, setFile] = useState<File | null>(null);
  const [tags, setTags] = useState<string>("");
  const [bulkFiles, setBulkFiles] = useState<FileList | null>(null); // For bulk upload
  const [loading, setLoading] = useState<boolean>(false);
  const [responseMessage, setResponseMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isLoggedIn) {
      fetchFiles();
    }
  }, [isLoggedIn]);

  const fetchFiles = async () => {
    try {
      const response = await fetch("/max/api/files", {
        method: "GET",
      });

      const textResponse = await response.text();
      console.log("Response:", textResponse);

      try {
        const data = JSON.parse(textResponse);
        if (Array.isArray(data)) {
          setFiles(data);
        } else {
          console.error("Expected an array but got:", data);
        }
      } catch (jsonError) {
        console.error("Failed to parse JSON:", jsonError);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  const handleLogin = async () => {
    const credentials = { username, password };

    try {
      const response = await fetch("/max/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (response.ok) {
        setIsLoggedIn(true);
        setError(null);
      } else {
        setError("Invalid username or password");
      }
    } catch (error) {
      setError("An error occurred while trying to log in.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch("/max/api/files", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });
      if (response.ok) {
        setFiles(files.filter((file) => file.id !== id));
      }
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  const handleUpdate = async (id: string, newTags: string) => {
    try {
      const response = await fetch("/max/api/files", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, tags: newTags }),
      });
      if (response.ok) {
        fetchFiles(); // Re-fetch the updated data
      }
    } catch (error) {
      console.error("Error updating file:", error);
    }
  };

  // File upload handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    } else {
      setFile(null);
    }
  };

  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setBulkFiles(e.target.files);
    } else {
      setBulkFiles(null);
    }
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTags(e.target.value);
  };

  const handleUpload = async () => {
    if (!file) {
      setResponseMessage("Please select a file to upload.");
      return;
    }

    setLoading(true);
    setResponseMessage(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("tags", tags);

    try {
      const response = await fetch("/max/api/uploadImage", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResponseMessage(data.message || "Upload successful!");
      } else {
        setResponseMessage(data.error || "Upload failed.");
      }
    } catch (error) {
      setResponseMessage(
        `An error occurred while uploading the image. ${
          error instanceof Error ? error.message : ""
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle bulk file upload (no tags)
  const handleBulkUpload = async () => {
    if (!bulkFiles || bulkFiles.length === 0) {
      setResponseMessage("Please select files to upload.");
      return;
    }

    setLoading(true);
    setResponseMessage(null);

    try {
      for (const file of bulkFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("tags", "");

        const response = await fetch("/max/api/uploadImage", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          setResponseMessage(`Upload failed for ${file.name}: ${data.error}`);
        }
      }
      setResponseMessage("Bulk upload successful!");
    } catch (error) {
      setResponseMessage(
        `An error occurred during bulk upload. ${
          error instanceof Error ? error.message : ""
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto my-8 p-4 border rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Admin Login</h1>
        <input
          type="text"
          placeholder="Username"
          value={username || ""}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full mb-4 p-2 border rounded-lg"
        />
        <input
          type="password"
          placeholder="Password"
          value={password || ""}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 p-2 border rounded-lg"
        />
        <button
          onClick={handleLogin}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Login
        </button>
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-md mx-auto my-8 p-4 border rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Admin Upload Page</h1>
        <input type="file" onChange={handleFileChange} className="mb-4" />
        <input
          type="text"
          value={tags || ""}
          onChange={handleTagsChange}
          placeholder="Enter tags (comma-separated)"
          className="w-full mb-4 p-2 border rounded-lg"
        />
        <button
          onClick={handleUpload}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          disabled={loading}
        >
          {loading ? "Uploading..." : "Upload Image"}
        </button>

        <h2 className="text-xl font-bold mt-8 mb-4">Bulk File Upload</h2>
        <input
          type="file"
          multiple
          onChange={handleBulkFileChange}
          className="mb-4"
        />
        <button
          onClick={handleBulkUpload}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          disabled={loading}
        >
          {loading ? "Uploading..." : "Upload Bulk Files"}
        </button>

        {responseMessage && (
          <p className="mt-4 text-center">
            {responseMessage.startsWith("Error") ? (
              <span className="text-red-500">{responseMessage}</span>
            ) : (
              <span className="text-green-500">{responseMessage}</span>
            )}
          </p>
        )}
      </div>

      <div className="max-w-4xl mx-auto my-8 p-4 border rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <table className="w-full table-auto border">
          <thead>
            <tr>
              <th>Image Preview</th>
              <th>ID</th>
              <th>URL</th>
              <th>Tags</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr key={file.id} className="border-t">
                <td>
                  <img src={file.url} alt="Preview" className="h-16 w-16" />
                </td>
                <td>{file.id}</td>
                <td>{file.url}</td>
                <td>
                  <input
                    type="text"
                    value={editTags || file.tags.join(", ")}
                    onChange={(e) => setEditTags(e.target.value)}
                    className="border rounded p-2"
                  />
                </td>
                <td>
                  <button
                    onClick={() => handleUpdate(file.id, editTags)}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded mr-2"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
