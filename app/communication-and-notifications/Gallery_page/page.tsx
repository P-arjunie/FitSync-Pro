'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import Navbar from "@/Components/Navbar";
import Footer1 from '@/Components/Footer_01';

const IMAGES_PER_PAGE = 9;

type ImageItem = {
  _id: string;
  src: string;
  status: 'pending' | 'approved' | 'declined';
  likes: number;
  createdAt?: string;
  likedBy?: string[]; // Added for likedBy property
};

export default function GalleryPage() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [page, setPage] = useState(1);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [likeLoading, setLikeLoading] = useState<string | null>(null);

  // Fetch user role from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole');
      setUserRole(role ? role.toLowerCase() : null);
    }
  }, []);

  // Fetch approved images from backend
  const fetchImages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/image?status=approved');
      if (res.ok) {
        const data = await res.json();
        setImages(data);
      }
    } catch (err) {
      setNotification('❌ Failed to load images');
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  // Upload handler
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!userRole || (userRole !== 'member' && userRole !== 'trainer')) {
      setNotification('❌ You must be logged in as a member or trainer to upload images.');
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setNotification('Uploading...');

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      setNotification('❌ Upload failed');
    } else {
      setNotification('✅ Image uploaded for review');
    }

    setTimeout(() => setNotification(null), 3000);
    e.target.value = ''; // Reset input to allow same file upload again
  };

  // Helper functions for anonymous like tracking
  const getLikedImages = () => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('galleryLikedImages') || '[]');
    } catch {
      return [];
    }
  };
  const setLikedImages = (ids: string[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('galleryLikedImages', JSON.stringify(ids));
    }
  };

  // Like handler
  const handleLike = async (imgId: string) => {
    if (likeLoading) return;
    setLikeLoading(imgId);

    // Check localStorage for anonymous like
    const likedImages = getLikedImages();
    if (likedImages.includes(imgId)) {
      setNotification('You have already liked this image.');
      setTimeout(() => setNotification(null), 3000);
      setLikeLoading(null);
      return;
    }

    // Try to get userId if logged in
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    const res = await fetch(`/api/image/${imgId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userId ? { userId } : {}),
    });

    if (res.ok) {
      const data = await res.json();
      setImages(prev =>
        prev.map(img =>
          img._id === imgId ? { ...img, likes: data.likes, likedBy: data.likedBy } : img
        )
      );
      setLikedImages([...likedImages, imgId]);
    } else {
      setNotification('❌ Failed to like image');
      setTimeout(() => setNotification(null), 3000);
    }
    setLikeLoading(null);
  };

  // Approved images sorted by newest first
  const approvedImages = images
    .filter(img => img.status === 'approved')
    .sort((a, b) =>
      b.createdAt && a.createdAt
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : 0
    );

  const totalPages = Math.ceil(approvedImages.length / IMAGES_PER_PAGE);

  const getCurrentImages = () => {
    const start = (page - 1) * IMAGES_PER_PAGE;
    const end = start + IMAGES_PER_PAGE;
    return approvedImages.slice(start, end);
  };

  const currentImages = getCurrentImages();

  return (
    <div className="min-h-screen relative bg-white">
      <Navbar />

      {notification && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded shadow z-50">
          {notification}
        </div>
      )}

      <div className="p-4 gallery-bg relative z-10">
        <div className="absolute inset-0 bg-white/30 backdrop-blur-sm z-0" />
        <div className="relative z-10 max-w-7xl mx-auto">

          {(userRole === 'member' || userRole === 'trainer') && (
            <div className="flex justify-center mb-6">
              <label className="cursor-pointer bg-red-500 text-white px-6 py-2 font-semibold rounded-lg shadow hover:bg-red-600 transition">
                📤 Upload Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-10 text-gray-500">Loading images...</div>
          ) : (
            <div className="columns-2 sm:columns-3 gap-3 space-y-3 px-2">
              {currentImages.map((img) => (
                <div
                  key={img._id}
                  className="overflow-hidden rounded-lg break-inside-avoid bg-white shadow p-2 mb-4"
                >
                  <Image
                    src={img.src}
                    alt="Gallery Image"
                    width={600}
                    height={400}
                    className="w-full h-auto object-cover rounded cursor-pointer transition-transform hover:scale-105 duration-200"
                    onClick={() => setLightboxImg(img.src)}
                  />
                  <div className="flex items-center justify-center mt-2 px-2">
                    <button
                      disabled={
                        likeLoading === img._id ||
                        getLikedImages().includes(img._id)
                      }
                      className={`text-red-500 font-bold select-none ${
                        likeLoading === img._id || getLikedImages().includes(img._id)
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                      onClick={() => handleLike(img._id)}
                    >
                      ❤️ {img.likes ?? 0}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              className="px-3 py-1 bg-white border rounded shadow hover:bg-gray-100"
            >
              ←
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-8 h-8 rounded-full text-sm font-bold ${
                  page === i + 1 ? 'bg-red-500 text-white' : 'bg-white'
                } shadow hover:bg-gray-100`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              className="px-3 py-1 bg-white border rounded shadow hover:bg-gray-100"
            >
              →
            </button>
          </div>
        </div>
      </div>

      <Dialog open={!!lightboxImg} onClose={() => setLightboxImg(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
          <Dialog.Panel className="relative">
            <button
              onClick={() => setLightboxImg(null)}
              className="absolute top-2 right-2 text-white text-3xl font-bold"
            >
              ×
            </button>
            {lightboxImg && (
              <Image
                src={lightboxImg}
                alt="Preview"
                width={1000}
                height={700}
                className="rounded-lg shadow-2xl max-h-[80vh] object-contain"
              />
            )}
          </Dialog.Panel>
        </div>
      </Dialog>

      <Footer1 />
    </div>
  );
}
