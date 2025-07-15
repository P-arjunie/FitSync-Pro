'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import Navbar from "@/Components/navbar";
import Footer1 from '@/Components/footer_01';

const IMAGES_PER_PAGE = 9;

type ImageItem = {
  src: string;
  status: 'pending' | 'approved' | 'declined';
  comments: never[]; // unused now
  likes: number;
};

export default function GalleryPage() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [page, setPage] = useState(1);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const loadImages = () => {
      const stored = localStorage.getItem('galleryImages');
      if (stored) {
        const parsed: ImageItem[] = JSON.parse(stored);
        const fixed = parsed.map(img => ({
          ...img,
          comments: [],
          likes: typeof img.likes === 'number' ? img.likes : 0,
        }));
        setImages(fixed);
      }
    };

    loadImages();
    window.addEventListener('focus', loadImages);
    return () => window.removeEventListener('focus', loadImages);
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      return;
    }

    const data = await res.json();
    const cloudUrl = data.url;

    const newImage: ImageItem = {
      src: cloudUrl,
      status: 'pending',
      comments: [],
      likes: 0,
    };

    const updated = [newImage, ...images];
    setImages(updated);
    localStorage.setItem('galleryImages', JSON.stringify(updated));

    setNotification('✅ Image uploaded for review');
    setTimeout(() => setNotification(null), 3000);
    setPage(1);
  };

  // ✅ Fixed Like Handler (uses img.src as unique identifier)
  const handleLike = (imgSrc: string) => {
    const updated = images.map(img =>
      img.src === imgSrc ? { ...img, likes: img.likes + 1 } : img
    );
    setImages(updated);
    localStorage.setItem('galleryImages', JSON.stringify(updated));
  };

  const approvedImages = images.filter(img => img.status === 'approved');
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

          <div className="columns-2 sm:columns-3 gap-3 space-y-3 px-2">
            {currentImages.map((img) => (
              <div
                key={img.src}
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
                    className="text-red-500 font-bold select-none"
                    onClick={() => handleLike(img.src)}
                  >
                    ❤️ {img.likes ?? 0}
                  </button>
                </div>
              </div>
            ))}
          </div>

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
