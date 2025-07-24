import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

const FloatingChatButton = ({ hasUnread }: { hasUnread?: boolean }) => {
  const [chatLink, setChatLink] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const role = localStorage.getItem("userRole");
      if (role === "trainer") {
        setChatLink("/communication-and-notifications/Trainer-chat");
      } else if (role === "member") {
        setChatLink("/communication-and-notifications/User-chat");
      } else {
        setChatLink(null);
      }
    }
  }, []);

  if (!chatLink) return null;

  return (
    <a
      href={chatLink}
      className="fixed bottom-8 right-8 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg p-4 flex items-center justify-center z-50"
      title="Chat"
      style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.15)", position: 'fixed' }}
    >
      <div style={{ position: 'relative' }}>
        <MessageCircle className="w-7 h-7" />
        {hasUnread && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center border-2 border-white shadow" style={{ fontWeight: 700 }}>
            {/* Red dot only, no number */}
          </span>
        )}
      </div>
    </a>
  );
};

export default FloatingChatButton; 