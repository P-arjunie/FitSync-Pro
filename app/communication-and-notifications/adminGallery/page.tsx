/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import Navbar from '@/Components/Navbar';
import Footer1 from '@/Components/Footer_01';

type ImageItem = {
  _id: string;
  src: string;
  status: 'pending' | 'approved' | 'declined';
};

const FILTERS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Declined', value: 'declined' },
  { label: 'All', value: 'all' },
];

export default function AdminGallery() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'declined' | 'all'>('pending');

  // Fetch images from backend by status
  const fetchImages = async () => {
    setLoading(true);
    try {
      let url = '/api/image';
      if (filter === 'pending') {
        url += '?status=pending&source=gallery';
      } else if (filter !== 'all') {
        url += `?status=${filter}`;
      }
      const res = await fetch(url);
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
    fetchImages();
    // eslint-disable-next-line
  }, [filter]);

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
        fetchImages();
      } else {
        setNotification('❌ Failed to update image');
      }
    } catch (err) {
      setNotification('❌ Failed to update image');
    } finally {
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Delete image
  const deleteImage = async (imgId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;
    try {
      const res = await fetch(`/api/image/${imgId}`, { method: 'DELETE' });
      if (res.ok) {
        setNotification('✅ Image deleted successfully');
        setImages(prev => prev.filter(img => img._id !== imgId));
      } else {
        setNotification('❌ Failed to delete image');
      }
    } catch (err) {
      setNotification('❌ Failed to delete image');
    } finally {
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div className="min-h-screen relative bg-gray-50">
      <Navbar />
      {notification && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded shadow z-50">
          {notification}
        </div>
      )}
      <h1 className="text-3xl font-bold text-center mb-8">🛡 Admin Panel - Gallery Management</h1>
      {/* Filter Tabs */}
      <div className="flex justify-center mb-8 gap-4">
        {FILTERS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value as any)}
            className={`px-4 py-2 rounded font-semibold border transition-all ${
              filter === tab.value
                ? 'bg-red-600 text-white border-red-700'
                : 'bg-white text-red-700 border-red-200 hover:bg-red-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="text-center text-gray-500 py-10">Loading images...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {images.length === 0 ? (
            <div className="text-center text-gray-500 py-10 col-span-full">No images found</div>
          ) : (
            images.map((img) => (
              <div key={img._id} className="bg-white border p-4 rounded-lg shadow">
                <Image
                  src={img.src}
                  alt={`Image ${img._id}`}
                  width={400}
                  height={300}
                  className="rounded w-full h-auto object-cover"
                />
                <div className="flex justify-between mt-3">
                  {(filter === 'pending' || filter === 'declined' || filter === 'all') && (
                    <button
                      onClick={() => updateStatus(img._id, 'approved')}
                      className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
                    >
                      ✅ Approve
                    </button>
                  )}
                  {(filter === 'pending' || filter === 'approved' || filter === 'declined' || filter === 'all') && (
                    <button
                      onClick={() => updateStatus(img._id, 'declined')}
                      className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700"
                    >
                      ❌ Decline
                    </button>
                  )}
                  <button
                    onClick={() => deleteImage(img._id)}
                    className="bg-gray-700 text-white px-4 py-1 rounded hover:bg-black"
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      <Footer1 />
    </div>
  );
}
