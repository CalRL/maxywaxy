import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: `Method ${req.method} not allowed.` });
  }

  const { username, password } = req.body;

  const envUser = process.env.ADMIN_USER;
  const envPassword = process.env.ADMIN_PASSWORD;

  if (username === envUser && password === envPassword) {
    return res.status(200).json({ message: "Login successful" });
  } else {
    return res.status(401).json({ error: "Invalid credentials" });
  }
}
