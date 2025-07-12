'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import Navbar from "@/Components/navbar";
import Footer1 from '@/Components/footer_01';

const IMAGES_FIRST_PAGE = 11;
const IMAGES_PER_PAGE = 9;

export default function GalleryPage() {
  const [images, setImages] = useState<string[]>([
    '/gallery01.jpg',
    '/gallery02.jpg',
    '/galley03.jpg',
    '/galley04.jpg',
    '/gallery05.jpg',
    '/gallery06.jpg',
    '/galley07.jpg',
    '/gallery08.jpg',
    '/galley09.jpg',
    '/gallery10.jpg',
    '/gallery11.jpg',
    '/gallery12.jpg',
    '/gallery13.jpg',
    '/galley14.jpg',
  ]);

  const [page, setPage] = useState(1);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const totalPages = Math.ceil((images.length - IMAGES_FIRST_PAGE) / IMAGES_PER_PAGE) + 1;

  const getCurrentImages = () => {
    if (page === 1) return images.slice(0, IMAGES_FIRST_PAGE);
    const start = IMAGES_FIRST_PAGE + (page - 2) * IMAGES_PER_PAGE;
    const end = start + IMAGES_PER_PAGE;
    return images.slice(start, end);
  };

  const currentImages = getCurrentImages();

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      const newImages = [previewUrl, ...images]; // Add new image at the beginning
      setImages(newImages);
      setPage(1); // Reset to page 1 to show the new image
    }
  };

  return (
    <div className="min-h-screen relative bg-white">
      <Navbar />

      <div className="p-4 gallery-bg relative z-10">
        <div className="absolute inset-0 bg-white/30 backdrop-blur-sm z-0" />

        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-center text-black mb-6 drop-shadow-lg">
            FitSyncPro Gallery
          </h1>

          {/* Upload Button */}
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

          {/* Masonry Layout */}
          <div className="columns-2 sm:columns-3 gap-3 max-w-6xl mx-auto space-y-3 px-2">
            {currentImages.map((src, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-lg cursor-pointer break-inside-avoid"
                onClick={() => setLightboxImg(src)}
              >
                <Image
                  src={src}
                  alt={`Gallery ${index + 1}`}
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover transition-transform hover:scale-105 duration-200"
                />
              </div>
            ))}
          </div>

          {/* Pagination */}
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

      {/* Lightbox */}
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
