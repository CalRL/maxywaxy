import { supabase } from "@/app/utils/supabaseAdmin";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const { data, error } = await supabase.from("main").select("*");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data);
  }

  if (req.method === "PUT") {
    const { id, tags } = req.body;

    const { error } = await supabase.from("main").update({ tags }).eq("id", id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ message: "File updated successfully" });
  }

  if (req.method === "DELETE") {
    const { id } = req.body;

    const { error } = await supabase.from("files").delete().eq("id", id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ message: "File deleted successfully" });
  }
}
