// app/admin/pending-trainer/[id]/page.tsx
import React from "react";
import { connectToDatabase } from "@/lib/mongodb"; // ✅ Correct for named export

import Trainer from "@/models/Trainer";

interface PageProps {
  params: { id: string };
}

export default async function PendingTrainerDetail({ params }: PageProps) {
    await connectToDatabase();

  const trainer = await Trainer.findById(params.id);

  if (!trainer) {
    return <div className="text-white p-6">Trainer not found</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-6">Trainer Request Details</h1>

      <div className="bg-zinc-900 p-6 rounded-lg border border-red-800 space-y-4">
        <img
          src={trainer.profileImage}
          alt={`${trainer.firstName} ${trainer.lastName}`}
          className="w-32 h-32 rounded-full border-4 border-red-800 object-cover mx-auto"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {Object.entries(trainer.toObject()).map(([key, value]) => {
            if (key === "_id" || key === "__v" || key === "profileImage") return null;
            const displayValue = Array.isArray(value)
              ? value.join(", ")
              : typeof value === "object"
              ? JSON.stringify(value)
              : value?.toString();

            return (
              <div key={key}>
                <span className="font-semibold capitalize">{key}:</span>{" "}
                <span className="text-gray-300">{displayValue}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
