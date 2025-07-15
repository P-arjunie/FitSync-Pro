'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

type ImageItem = {
  src: string;
  status: 'pending' | 'approved' | 'declined';
};

export default function AdminGallery() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('galleryImages');
    if (stored) {
      setImages(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('galleryImages', JSON.stringify(images));
  }, [images]);

  const updateStatus = (index: number, status: 'approved' | 'declined') => {
    const updated = [...images];
    updated[index].status = status;
    setImages(updated);
    setNotification(`✅ Image ${status}`);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {notification && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded shadow z-50">
          {notification}
        </div>
      )}

      <h1 className="text-3xl font-bold text-center mb-8">🛡 Admin Panel - Image Approval</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {images
          .map((img, i) => ({ ...img, index: i }))
          .filter(img => img.status === 'pending')
          .map(({ src, index }) => (
            <div key={index} className="bg-white border p-4 rounded-lg shadow">
              <Image
                src={src}
                alt={`Pending ${index}`}
                width={400}
                height={300}
                className="rounded w-full h-auto object-cover"
              />
              <div className="flex justify-between mt-3">
                <button
                  onClick={() => updateStatus(index, 'approved')}
                  className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
                >
                  ✅ Approve
                </button>
                <button
                  onClick={() => updateStatus(index, 'declined')}
                  className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700"
                >
                  ❌ Decline
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
