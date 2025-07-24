# Fix History API Issues

This document outlines the steps needed to fix the issues between the API route and the history page.

## 1. Create a Proper Dynamic Route

The current API route is defined at `app/api/analytics/history/route.ts` but expects a dynamic `type` parameter. In Next.js App Router, dynamic segments need to be defined with square brackets in the file path.

### Steps:

1. Create a new directory: `app/api/analytics/history/[type]`
2. Move the content from `app/api/analytics/history/route.ts` to a new file: `app/api/analytics/history/[type]/route.ts`
3. Keep the same code but ensure the parameter handling is correct

## 2. Update the API Route Handler

The API route handler needs to properly handle the type parameter from the URL.

### Code Changes:

```typescript
// app/api/analytics/history/[type]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Session from "@/models/Session";
import VirtualSession from "@/models/VirtualSession";
import Payment from "@/models/Payment";
import Order from "@/models/order";
import Enrollment from "@/models/enrollment";
import PricingPlanPurchase from "@/models/PricingPlanPurchase";
import LoginHistory from "@/models/LoginHistory";
import ApprovedTrainer from "@/models/ApprovedTrainer";

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const type = params.type; // This will now correctly get the type from the URL
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    // Rest of the code remains the same...
```

## 3. Add Better Error Handling and Data Normalization

Improve error handling and data normalization in both the API and client code.

### API Changes:

```typescript
// Inside the sessions case
try {
  const physicalSessions = await Session.find(query)
    .populate('trainerId', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .lean();

  const virtualSessions = await VirtualSession.find(query)
    .sort({ createdAt: -1 })
    .lean();

  // Add more robust null checks and data normalization
  const formattedPhysical = physicalSessions.map(session => ({
    ...session,
    sessionType: 'Physical',
    trainerName: session.trainerId && session.trainerId.firstName
      ? `${session.trainerId.firstName} ${session.trainerId.lastName || ''}`
      : 'Unknown Trainer',
    participants: session.currentParticipants || 0,
    maxParticipants: session.maxParticipants || 0,
    location: session.location || 'Not specified',
    // Add consistent date fields
    start: session.start || session.createdAt,
    end: session.end || null,
    date: session.start || session.createdAt
  }));

  const formattedVirtual = virtualSessions.map(session => ({
    ...session,
    sessionType: 'Virtual',
    trainerName: session.trainer && session.trainer.name 
      ? session.trainer.name 
      : 'Unknown Trainer',
    participants: session.participants && Array.isArray(session.participants) 
      ? session.participants.length 
      : 0,
    maxParticipants: session.maxParticipants || 0,
    location: 'Virtual',
    onlineLink: session.onlineLink || '#',
    // Add consistent date fields
    start: session.date || session.createdAt,
    end: session.date || session.createdAt,
    date: session.date || session.createdAt
  }));

  data = [...formattedPhysical, ...formattedVirtual]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  totalCount = data.length;
} catch (error) {
  console.error('Error fetching sessions:', error);
  data = [];
}
```

### Client Changes:

```typescript
// In the renderHistoryItem function for sessions
return (
  <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-200">
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="text-lg font-bold text-gray-800">{item.title || 'Untitled Session'}</h3>
        <p className="text-gray-600">Trainer: {item.trainerName || 'Unknown Trainer'}</p>
        <p className="text-sm text-gray-500">
          Type: <span className="font-medium">{item.sessionType || 'Physical'}</span>
        </p>
      </div>
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
        item.status === 'active' ? 'bg-green-100 text-green-800' :
        item.status === 'completed' ? 'bg-blue-100 text-blue-800' :
        'bg-red-100 text-red-800'
      }`}>
        {item.status || 'Active'}
      </span>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      <div>
        <span className="text-gray-500">Participants:</span>
        <p className="font-medium">
          {typeof item.participants === 'number' 
            ? item.participants 
            : (item.currentParticipants || 0)}/
          {item.maxParticipants || 0}
        </p>
      </div>
      <div>
        <span className="text-gray-500">Location:</span>
        <p className="font-medium">{item.location || (item.onlineLink ? 'Virtual' : 'N/A')}</p>
      </div>
      <div>
        <span className="text-gray-500">Date:</span>
        <p className="font-medium">
          {new Date(item.start || item.date || item.createdAt).toLocaleDateString()}
        </p>
      </div>
      <div>
        <span className="text-gray-500">Created:</span>
        <p className="font-medium">{new Date(item.createdAt).toLocaleDateString()}</p>
      </div>
    </div>
  </div>
);
```

## 4. Improve Client Error Handling

Add better error handling in the client to provide feedback to users when API requests fail.

```typescript
// In the fetchHistoryData function
const fetchHistoryData = async (tab: string = activeTab) => {
  setIsLoading(true);
  try {
    const params = new URLSearchParams({
      startDate: dateRange.start,
      endDate: dateRange.end,
      status: statusFilter !== 'all' ? statusFilter : ''
    });

    const response = await fetch(`/api/analytics/history/${tab}?${params}`);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      setHistoryData(result.data || []);
      setFilteredData(result.data || []);
    } else {
      console.error('API returned error:', result.error);
      // Show error to user (could add a toast notification here)
      setHistoryData([]);
      setFilteredData([]);
    }
  } catch (error) {
    console.error('Error fetching history data:', error);
    // Show error to user (could add a toast notification here)
    setHistoryData([]);
    setFilteredData([]);
  } finally {
    setIsLoading(false);
  }
};
```

## Implementation Steps

1. Create the new dynamic route file structure
2. Update the API route handler to properly handle the type parameter
3. Add better error handling and data normalization in both API and client code
4. Test each history type to ensure data is displayed correctly

## Notes

- These changes maintain the existing model structures
- The focus is on making the API and client work together correctly
- Additional error handling and data normalization improve robustness