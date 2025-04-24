import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    res.status(200).json({ userId: "test_user_123" }); // Replace with real logic later
  } else {
    res.status(405).json({ error: "Method Not Allowed" });
  }
}
