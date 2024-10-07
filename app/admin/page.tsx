"use client";
import { useState } from "react";

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [tags, setTags] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [responseMessage, setResponseMessage] = useState<string | null>(null);

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

  // Upload handling functions

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    } else {
      setFile(null);
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

  return (
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
  );
}
