export const maxDuration = 240;
import { NextRequest, NextResponse } from 'next/server';
// **FIX:** Changed the import to use the standard Prisma package.
import { PrismaClient } from '../../../generated/prisma/index.js';
import { GoogleGenAI, Modality } from "@google/genai";

// Initialize Prisma and the new Google GenAI Client
const prisma = new PrismaClient();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// A unique user-agent is required for unauthenticated Reddit requests.
const CUSTOM_USER_AGENT = "my-blog-generator-app:v2.0 (by /u/Jackfruitstricking)";

// --- Helper Functions ---

/**
 * Extracts the subreddit and post ID from a Reddit URL.
 */
function extractRedditInfo(url: string): { subreddit: string; postId: string } | null {
  try {
    const pathParts = new URL(url).pathname.split('/');
    const commentsIndex = pathParts.findIndex(part => part === 'comments');
    
    if (commentsIndex > 1 && pathParts.length > commentsIndex + 1) {
      const subreddit = pathParts[commentsIndex - 1];
      const postId = pathParts[commentsIndex + 1];
      if (subreddit && postId) {
        return { subreddit, postId };
      }
    }
    return null;
  } catch (error) {
    console.error("Invalid URL provided:", error);
    return null;
  }
}

/**
 * Fetches the data for a single Reddit post.
 */
async function getRedditPost(subreddit: string, postId: string) {
  const url = `https://www.reddit.com/r/${subreddit}/comments/${postId}.json`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": CUSTOM_USER_AGENT } });
    if (!res.ok) {
      throw new Error(`Failed to fetch post from Reddit: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    const postData = data[0]?.data?.children?.[0]?.data;
    if (!postData) {
      throw new Error("Post data not found in Reddit API response.");
    }
    return {
      title: postData.title,
      permalink: postData.permalink,
      selftext: postData.selftext || "",
      id: postData.id,
      subreddit: postData.subreddit,
    };
  } catch (error) {
    console.error(`Error fetching post ${postId}:`, error);
    return null;
  }
}

/**
 * Fetches comments for a given Reddit post using public endpoints.
 */
async function getComments(subreddit: string, postId: string): Promise<string[]> {
  try {
    const url = `https://www.reddit.com/r/${subreddit}/comments/${postId}.json?limit=100&depth=10`;
    const res = await fetch(url, { headers: { "User-Agent": CUSTOM_USER_AGENT } });
    if (!res.ok) {
      console.error(`Failed to fetch comments: ${res.status} ${res.statusText}`);
      return [];
    }
    const data = await res.json();
    const commentsData = data[1]?.data?.children || [];
    const comments: string[] = [];
    const extractComments = (commentList: any[]): void => {
      for (const comment of commentList) {
        if (comment.kind === "t1" && comment.data?.body) {
          comments.push(comment.data.body);
        }
        if (comment.data?.replies?.data?.children) {
          extractComments(comment.data.replies.data.children);
        }
      }
    };
    extractComments(commentsData);
    return comments;
  } catch (error) {
    console.error(`Failed to fetch comments for post ${postId}:`, error);
    return [];
  }
}

/**
 * Cleans the generated content by removing unwanted characters.
 */
function cleanContent(content: string): string {
  return content
    .replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\/g, '')
    .replace(/\n{2,}/g, '\n').replace(/\s{2,}/g, ' ').trim();
}

/**
 * Generates blog content using the Gemini SDK.
 */
async function generateBlogContent(title: string, subreddit: string, selftext: string, comments: string[], postUrl: string) {
  const combinedComments = comments.length ? comments.map((c, i) => `Comment ${i + 1}: ${c}`).join("\n\n") : "No comments available.";
  const prompt = `
    Write a detailed, engaging, and original blog post (500-700 words) about the following trending Reddit topic from r/${subreddit}.
    **Reddit Post Details:**
    Post Title: "${title}"
    Post Content: ${selftext || "(No additional post content)"}
    **Comments from the community:**
    ${combinedComments}
    **Instructions:**
    1.  Create a catchy, SEO-friendly title for the blog post.
    2.  Write a meta description (150-160 characters).
    3.  Structure the content with headings (<h2>), paragraphs (<p>), and bullet points (<ul><li>).
    4.  Include a "Key Takeaways" section at the end.
    5.  At the bottom, add a "Source" section with a link to the original Reddit post: <a href="${postUrl}" target="_blank" rel="noopener noreferrer">${postUrl}</a>
    Return as a JSON object: { "title": "...", "metaDescription": "...", "content": "..." }
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
 * Handles POST requests to generate a blog from a specific Reddit URL.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const redditUrl: string = body.redditUrl;

    if (!redditUrl) {
      return NextResponse.json({ success: false, error: 'Request body must contain a "redditUrl" key.' }, { status: 400 });
    }

    const redditInfo = extractRedditInfo(redditUrl);
    if (!redditInfo) {
      return NextResponse.json({ success: false, error: 'Invalid Reddit post URL format.' }, { status: 400 });
    }

    console.log(`Processing Reddit URL: ${redditUrl}`);

    const post = await getRedditPost(redditInfo.subreddit, redditInfo.postId);
    if (!post) {
      return NextResponse.json({ success: false, error: 'Could not fetch the specified Reddit post.' }, { status: 404 });
    }

    const fullPostUrl = `https://www.reddit.com${post.permalink}`;
    const exists = await prisma.blog.findFirst({ where: { content: { contains: fullPostUrl } } });

    if (exists) {
      console.log(`A blog for this post already exists: ${post.title}`);
      return NextResponse.json({ success: false, error: 'A blog for this post already exists.' }, { status: 409 });
    }

    const comments = await getComments(post.subreddit, post.id);
    const blogContent = await generateBlogContent(post.title, post.subreddit, post.selftext, comments, fullPostUrl);

    if (!blogContent) {
      throw new Error(`Failed to generate blog content for "${post.title}".`);
    }

    const imagePrompt = `Create a visually stunning, quality 3D rendered photo for a tech blog. The image should be precise and artistic, representing the core themes of this title: "${blogContent.title}". Focus on a modern, clean aesthetic.`;
    const image = await generateImageWithGemini(imagePrompt);

    const savedBlog = await saveBlog({
      title: blogContent.title,
      metaDescription: blogContent.metaDescription,
      content: blogContent.content,
      image: image || "",
      topic: post.subreddit,
      isPrivate: false, // Default to public
      isArchived: false, // Default to not archived
    });

    if (savedBlog) {
      console.log(`Successfully created blog: ${savedBlog.title}`);
      return NextResponse.json({ success: true, message: "Blog generated successfully!", blog: savedBlog });
    } else {
      throw new Error('Failed to save the blog to the database.');
    }

  } catch (error: any) {
    console.error("Error during blog generation from URL:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
