'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Dialog } from '@headlessui/react';

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

  const totalPages = Math.ceil(images.length / IMAGES_PER_PAGE);
  const currentImages = images.slice((page - 1) * IMAGES_PER_PAGE, page * IMAGES_PER_PAGE);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImages(prev => [...prev, previewUrl]);
      setPage(Math.ceil((images.length + 1) / IMAGES_PER_PAGE));
    }
  };

  return (
    <div className="min-h-screen gallery-bg p-4">
      <div className="relative z-10">
        <h1 className="text-3xl font-bold text-center text-white mb-4">FitSyncPro Gallery</h1>

        {/* Upload Button */}
        <div className="flex justify-center mb-4">
          <label className="cursor-pointer bg-red-500 text-white px-5 py-2 font-semibold rounded-lg shadow hover:bg-red-600 transition">
            📤 Upload Image
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2 max-w-5xl mx-auto">
          {currentImages.map((src, index) => (
            <div
              key={index}
              className="relative aspect-[4/3] bg-white rounded overflow-hidden cursor-pointer border hover:shadow-md transition"
              onClick={() => setLightboxImg(src)}
            >
              <Image
                src={src}
                alt={`Gallery ${index + 1}`}
                fill
                className="object-contain w-full h-full"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-2 mt-6">
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
    </div>
  );
}
