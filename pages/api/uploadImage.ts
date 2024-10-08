import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/app/utils/supabaseAdmin";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false, // Disable built-in body parsing
  },
};

const BUCKET_NAME = "images";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: `Method ${req.method} not allowed.` });
  }

  try {
    // Use formidable to parse the request
    const form = formidable({ multiples: false, keepExtensions: true });

    // Wrap form.parse in a Promise to handle async/await flow
    const { fields, files } = await new Promise<{
      fields: formidable.Fields;
      files: formidable.Files;
    }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    // Extract the file from the formidable parsed object
    let file: formidable.File | undefined;
    if (!files.file) return res.status(400);

    if (Array.isArray(files.file)) {
      file = files.file[0]; // If file is an array, use the first item
    } else {
      file = files.file as formidable.File; // Otherwise, use it as a single File
    }

    if (!file || !file.filepath) {
      console.error(
        "File or filepath is missing in formidable parsed data",
        files
      );
      return res
        .status(400)
        .json({ error: "File is required, and must have a valid path" });
    }

    const tags = fields.tags
      ? Array.isArray(fields.tags)
        ? fields.tags[0]
        : fields.tags
      : "";

    const fileContent = fs.readFileSync(file.filepath);

    if (file.newFilename === null || file.originalFilename === null) {
      return res.status(400).json({ message: "File name is null" });
    }

    const { data, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(file.newFilename || file.originalFilename, fileContent, {
        contentType: file.mimetype || "application/octet-stream",
      });

    if (uploadError) {
      console.error("Error uploading file to Supabase:", uploadError);
      return res.status(500).json({ error: "Error uploading file to storage" });
    }

    // Get the public URL for the uploaded file
    const { data: publicUrlData } = await supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    if (!publicUrlData) {
      return res.status(500).json({ error: "Failed to get public URL" });
    }

    const imageUrl = publicUrlData.publicUrl;

    // Check if the image already exists in the database
    const { data: existingImage, error: checkError } = await supabase
      .from("main")
      .select("id")
      .eq("url", imageUrl)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking existing image in database:", checkError);
      return res
        .status(500)
        .json({ error: "Error checking image existence in database" });
    }

    if (existingImage) {
      return res
        .status(200)
        .json({ message: "Image already exists in the database" });
    }

    // Insert the URL and tags into the database
    const { error: insertError } = await supabase
      .from("main")
      .insert({ url: imageUrl, tags: tags.split(",") });

    if (insertError) {
      console.error(
        "Error inserting image data into the database:",
        insertError
      );
      return res
        .status(500)
        .json({ error: "Error inserting image data into the database" });
    }

    return res
      .status(200)
      .json({ message: "Image uploaded and data inserted successfully" });
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({ error: "An unexpected error occurred" });
  }
}
