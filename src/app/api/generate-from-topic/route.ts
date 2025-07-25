export const maxDuration = 240;
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma/index.js';
import { GoogleGenAI, Modality } from "@google/genai";

// Initialize Prisma and the new Google GenAI Client
const prisma = new PrismaClient();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

/**
 * Cleans the generated content by removing unwanted characters.
 */
function cleanContent(content: string): string {
  return content
    .replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\/g, '')
    .replace(/\n{2,}/g, '\n').replace(/\s{2,}/g, ' ').trim();
}

/**
 * Generates blog content from a topic using the Gemini SDK.
 */
async function generateBlogContentFromTopic(topic: string) {
  const prompt = `
    Write a detailed, engaging, and original blog post (500-700 words) about the following topic: "${topic}".

    **Instructions:**
    1.  Create a catchy, SEO-friendly title for the blog post.
    2.  Write a meta description (150-160 characters).
    3.  The main content should be well-structured with headings (<h2>), paragraphs (<p>), and bullet points (<ul><li>).
    4.  Include a "Key Takeaways" section at the end.
    5.  The tone should be informative and accessible.

    Return the response as a JSON object with this structure:
    {
      "title": "Your Catchy Title",
      "metaDescription": "Your Meta Description",
      "content": "Your blog content with HTML tags."
    }
    IMPORTANT: The entire response must be a single, valid JSON object. Ensure all string values, especially the "content" field, have properly escaped double quotes (e.g., use \\" for quotes inside the string).`;

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
        throw new Error("No text found in the response from Gemini.");
    }
    
    let cleanedText = responseText.replace(/```json|```/g, '').trim();
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON object found in Gemini's response.");
    const jsonResponse = JSON.parse(jsonMatch[0]);
    if (!jsonResponse.title || !jsonResponse.metaDescription || !jsonResponse.content) {
        throw new Error("Generated content is missing required fields.");
    }
    jsonResponse.content = cleanContent(jsonResponse.content);
    return jsonResponse;
  } catch (error) {
    console.error("Error generating blog content with Gemini:", error);
    return null;
  }
}

/**
 * Generates an image using the Gemini SDK.
 */
async function generateImageWithGemini(promptText: string): Promise<string> {
  try {
    console.log(`Generating image for prompt: "${promptText}"`);
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-preview-image-generation",
        contents: [{ parts: [{ text: promptText }] }],
        config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
    });
    const parts = response.candidates?.[0]?.content?.parts;

    if (parts) {
        for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
                const imageData = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                console.log("Successfully generated image and created data URI.");
                return imageData;
            }
        }
    }
    console.error("No image data found in the Gemini response.");
    return "";
  } catch (error) {
    console.error("Failed to generate image via Gemini API:", error);
    return "";
  }
}

/**
 * Saves the generated blog post to the database.
 */
async function saveBlog(blogData: { title: string; metaDescription: string; content: string; image: string; topic: string; isPrivate: boolean; isArchived: boolean; }) {
  try {
    const blog = await prisma.blog.create({ data: blogData });
    return blog;
  } catch (error: any) {
    console.error(`Failed to save blog to database:`, error.message);
    return null;
  }
}

// --- Main API Route Handler ---

/**
 * Handles POST requests to generate a blog from a specific topic.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const topic: string = body.topic;

    if (!topic) {
      return NextResponse.json({ success: false, error: 'Request body must contain a "topic" key.' }, { status: 400 });
    }

    console.log(`Processing topic: ${topic}`);

    const blogContent = await generateBlogContentFromTopic(topic);

    if (!blogContent) {
      throw new Error(`Failed to generate blog content for "${topic}".`);
    }

    const imagePrompt = `Create a visually stunning, quality 3D rendered photo for a tech blog. The image should be precise and artistic, representing the core themes of this title: "${blogContent.title}". Focus on a modern, clean aesthetic.`;
    const image = await generateImageWithGemini(imagePrompt);

    const savedBlog = await saveBlog({
      title: blogContent.title,
      metaDescription: blogContent.metaDescription,
      content: blogContent.content,
      image: image || "",
      topic: "custom", // Assign a generic topic
      isPrivate: false,
      isArchived: false,
    });

    if (savedBlog) {
      console.log(`Successfully created blog: ${savedBlog.title}`);
      return NextResponse.json({ success: true, message: "Blog generated successfully!", blog: savedBlog });
    } else {
      throw new Error('Failed to save the blog to the database.');
    }

  } catch (error: any) {
    console.error("Error during blog generation from topic:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
