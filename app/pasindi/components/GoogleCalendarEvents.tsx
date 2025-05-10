/* eslint-disable @typescript-eslint/no-explicit-any */
import { useSession } from 'next-auth/react';
import { Session } from 'next-auth';

// Extend the Session type to include accessToken
declare module 'next-auth' {
  interface Session {
    accessToken?: string;
  }
}
import { useEffect, useState } from 'react';

const GoogleCalendarEvents = () => {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'loading') {
      return;  // Wait until session is loaded
    }

    if (!session?.accessToken) {
      console.log('Access token not available');
      return;
    }

    // Fetch events from Google Calendar API using the access token
    fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    })
      .then(response => response.json())
      .then(data => {
        console.log('Google Calendar Data:', data);  // Log the fetched data
        setEvents(data.items);
      })
      .catch(error => {
        console.error('Error fetching calendar events:', error);
      });
  }, [session?.accessToken, status]);

  return (
    <div>
      <h2>Your Google Calendar Events</h2>
      {events.length > 0 ? (
        <ul>
          {events.map(event => (
            <li key={event.id}>{event.summary}</li>
          ))}
        </ul>
      ) : (
        <p>No events found.</p>
      )}
    </div>
  );
};

export default GoogleCalendarEvents;
