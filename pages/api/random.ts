import type { NextApiResponse, NextApiRequest } from "next";
import { supabase } from "@/app/utils/supabaseClient";

type Data = {
  url?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const { data: files, error } = await supabase.storage
        .from("images")
        .list("", { limit: 100 });

      if (error) throw error;

      if (!files || files.length == 0) {
        console.error("No images found in the storage bucket");
        return res
          .status(404)
          .json({ error: "No images found in the storage bucket" });
      }

      const randomIndex = Math.floor(Math.random() * files.length);
      const randomFile = files[randomIndex];

      const { data } = supabase.storage
        .from("images")
        .getPublicUrl(randomFile.name);

      if (!data) {
        throw new Error("Failed to get public URL for the image.");
      }
      res.status(200).json({ url: data.publicUrl });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader("ALLOW", ["GET"]);
    res.status(405).end(`Method ${req.method} not allowed.`);
  }
}
