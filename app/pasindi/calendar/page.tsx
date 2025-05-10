// 'use client';

// import GoogleCalendarEvents from '../components/GoogleCalendarEvents'; // Update path if needed
// import { SessionProvider, useSession } from 'next-auth/react';

// export default function CalendarPage() {
//   const { status } = useSession();

//   if (status === 'loading') return <p>Loading...</p>;
//   if (status === 'unauthenticated') return <p>Please log in via Google to view your calendar.</p>;

//   return (
//     <div>
//       <SessionProvider>
//       <GoogleCalendarEvents />
//     </SessionProvider>
//     </div>
//   );
// }
// app/calender/page.tsx

'use client';

import { SessionProvider } from 'next-auth/react';
import GoogleCalendarEvents from '../components/GoogleCalendarEvents';

export default function CalendarPage() {
  return (
    <SessionProvider>
      <GoogleCalendarEvents />
    </SessionProvider>
  );
}
