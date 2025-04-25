// pages/api/member/profile.js
import { getSession } from "next-auth/react"; // or use your auth mechanism
import Member from "../../models/Member";

export default async function handler(req, res) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const member = await Member.findOne({email}); 
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }
    res.status(200).json(member);
  } catch (error) {
    res.status(500).json({ message: "Error fetching member data", error });
  }
}
