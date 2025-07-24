type Notification = {
  _id: string;
  message: string;
  createdAt: string;
};

interface Props {
  notifications?: Notification[]; // 👈 optional to avoid crash
}

export default function NotificationPage({ notifications }: Props) {
  if (!notifications) {
    // Still loading or undefined
    return <div className="p-4">Loading notifications...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Notifications</h1>
      <ul>
        {notifications.length === 0 ? (
          <li>No notifications yet.</li>
        ) : (
          notifications.map((n) => (
            <li key={n._id} className="p-3 mb-2 bg-gray-100 rounded">
              {n.message}
              <br />
              <small className="text-gray-500">
                {new Date(n.createdAt).toLocaleString()}
              </small>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
