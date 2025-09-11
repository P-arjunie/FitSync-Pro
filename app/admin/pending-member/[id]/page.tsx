// app/admin/pending-member/[id]/page.tsx
import React from "react";
import { connectToDatabase } from "@/lib/mongodb"; // ✅ Correct for named export

import PendingMember from "@/models/pendingMember";

interface PageProps {
  params: { id: string };
}

export default async function PendingMemberDetail({ params }: PageProps) {
  await connectToDatabase();

  const member = await PendingMember.findById(params.id);

  if (!member) {
    return <div className="text-white p-6">Member not found</div>;
  }

  const formatValue = (key: string, value: unknown) => {
    // Special handling for emergencyContact object
    if (key === 'emergencyContact' && typeof value === 'object' && value !== null) {
      const contact = value as { name?: string; relationship?: string; phone?: string };
      return `${contact.name ?? ''} (${contact.relationship ?? ''}) - ${contact.phone ?? ''}`;
    }
    
    // Special handling for membershipInfo object
    if (key === 'membershipInfo' && typeof value === 'object' && value !== null) {
      const membership = value as { startDate?: string };
      return `Start Date: ${membership.startDate ?? ''}`;
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    
    // Handle other objects
    if (typeof value === "object" && value !== null) {
      return JSON.stringify(value);
    }
    
    // Handle other types
    return value?.toString() || '';
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-6">Member Request Details</h1>

      <div className="bg-zinc-900 p-6 rounded-lg border border-red-800 space-y-4">
        <img
          src={member.image}
          alt={`${member.firstName} ${member.lastName}`}
          className="w-32 h-32 rounded-full border-4 border-red-800 object-cover mx-auto"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {Object.entries(member.toObject()).map(([key, value]) => {
            if (key === "_id" || key === "__v" || key === "image") return null;
            
            const displayValue = formatValue(key, value);

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
