"use client";
import { useState } from "react";

type ImageResponse = {
  url?: string;
  error?: string;
};

export default function Home() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [lastImageUrl, setLastImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch a random image from the API
  const fetchRandomImage = async () => {
    setImageUrl(null); // Remove the last image before fetching a new one
    setLoading(true);
    setError(null);
    try {
      let newImageUrl = null;
      let attempts = 0;
      do {
        const response = await fetch("/max/api/random");
        const data: ImageResponse = await response.json();

        if (response.ok && data.url) {
          newImageUrl = data.url;
        } else {
          setError(data.error || "Failed to load image.");
          return;
        }
        attempts++;
      } while (newImageUrl === lastImageUrl && attempts < 5);

      setLastImageUrl(newImageUrl);
      setImageUrl(newImageUrl);
    } catch (e) {
      setError("An error occurred while fetching the image.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-center mt-8">
      <h1 className="text-2xl font-bold mb-8">Random Maxywaxy image</h1>
      <div className="mt-8 flex justify-center space-x-4">
        <button
          onClick={fetchRandomImage}
          className="bg-slate-700 hover:bg-slate-900 text-white font-semibold py-2 px-4 rounded-lg duration-150"
        >
          Get Another Random Image
        </button>
      </div>

      {loading && <p className="text-gray-600 mt-16">Loading...</p>}
      <div className="flex justify-center my-8">
        {error && <p className="text-red-500">{error}</p>}
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Random Image"
            className="max-w-md h-auto rounded-lg shadow-md"
          />
        )}
      </div>
    </div>
  );
}
