'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

type ImageItem = {
  _id: string;
  src: string;
  status: 'pending' | 'approved' | 'declined';
};

export default function AdminGallery() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch pending images from backend
  const fetchPendingImages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/image?status=pending');
      if (res.ok) {
        setImages(await res.json());
      }
    } catch (err) {
      setNotification('❌ Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingImages();
  }, []);

  // Approve or decline image
  const updateStatus = async (imgId: string, status: 'approved' | 'declined') => {
    try {
      const res = await fetch(`/api/image/${imgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setNotification(`✅ Image ${status}`);
        fetchPendingImages();
      } else {
        setNotification('❌ Failed to update image');
      }
    } catch (err) {
      setNotification('❌ Failed to update image');
    } finally {
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {notification && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded shadow z-50">
          {notification}
        </div>
      )}

      <h1 className="text-3xl font-bold text-center mb-8">🛡 Admin Panel - Image Approval</h1>

      {loading ? (
        <div className="text-center text-gray-500 py-10">Loading images...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {images.map((img) => (
            <div key={img._id} className="bg-white border p-4 rounded-lg shadow">
              <Image
                src={img.src}
                alt={`Pending ${img._id}`}
                width={400}
                height={300}
                className="rounded w-full h-auto object-cover"
              />
              <div className="flex justify-between mt-3">
                <button
                  onClick={() => updateStatus(img._id, 'approved')}
                  className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
                >
                  ✅ Approve
                </button>
                <button
                  onClick={() => updateStatus(img._id, 'declined')}
                  className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700"
                >
                  ❌ Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
