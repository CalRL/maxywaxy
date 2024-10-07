import { supabase } from "@/app/utils/supabaseClient";
import { NextApiRequest, NextApiResponse } from "next";

const BUCKET_NAME: string = "images";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end(`Method ${req.method} not allowed.`);
  }

  try {
    const { data: files, error: listError } = await supabase.storage
      .from(BUCKET_NAME)
      .list();

    if (listError) {
      console.warn(listError);
      throw listError;
    }

    if (!files || files.length === 0) {
      console.warn("No images found in the storage bucket");
      return res
        .status(404)
        .json({ message: "No images found in the storage bucket" });
    }

    const results = [];

    for (const file of files) {
      const { data: publicUrlData } = await supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(file.name);

      if (publicUrlData) {
        const imageUrl = publicUrlData.publicUrl;

        // Check if the URL already exists in the database
        const { data: existingData, error: selectError } = await supabase
          .from("main")
          .select("id")
          .eq("url", imageUrl)
          .single();

        if (selectError && selectError.code !== "PGRST116") {
          // Ignore "not found" error, handle others
          console.warn(
            `Error checking existence of ${imageUrl}:`,
            selectError.message
          );
          results.push({
            file: file.name,
            status: "failed",
            error: selectError.message,
          });
          continue;
        }

        // If URL already exists, skip the insertion
        if (existingData) {
          console.log(
            `Skipping ${imageUrl} as it already exists in the database.`
          );
          results.push({
            file: file.name,
            status: "skipped",
            message: "Already exists",
          });
          continue;
        }

        // Insert the new image URL
        const { error: insertError } = await supabase
          .from("main")
          .insert({ url: imageUrl, tags: [] });

        if (insertError) {
          console.warn(`Failed to insert ${imageUrl}:`, insertError.message);
          results.push({
            file: file.name,
            status: "failed",
            error: insertError.message,
          });
        } else {
          console.log(`Inserted URL for file: ${file.name}`);
          results.push({
            file: file.name,
            status: "success",
            message: `${imageUrl} inserted successfully`,
          });
        }
      }
    }

    return res.status(200).json({ message: "Processing complete", results });
  } catch (error) {
    console.error("An unexpected error occurred:", error);
    return res
      .status(500)
      .json({ message: `An unexpected error occurred: ${error}` });
  }
}
