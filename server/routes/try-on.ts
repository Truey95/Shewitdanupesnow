import { Router } from "express";
import OpenAI from "openai";
import { Buffer } from "buffer";

const router = Router();

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/api/try-on", async (req, res) => {
  try {
    const { userPhoto, selectedItem } = req.body;

    // Remove data URL prefix to get base64
    const userPhotoBase64 = userPhoto.split(",")[1];
    const selectedItemBase64 = selectedItem.split(",")[1];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please blend this clothing item onto the person in the photo realistically, maintaining proper perspective and lighting."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${userPhotoBase64}`
              }
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${selectedItemBase64}`
              }
            }
          ],
        },
      ],
      max_tokens: 500,
    });

    // Convert the AI description into an image using DALL-E
    const imagePrompt = response.choices[0].message.content || "A person wearing the selected clothing item";

    // Generate the blended image using DALL-E
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: imagePrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    res.json({ url: imageResponse.data[0].url });
  } catch (error) {
    console.error("Error processing try-on request:", error);
    res.status(500).json({ error: "Failed to process the virtual try-on" });
  }
});

export default router;