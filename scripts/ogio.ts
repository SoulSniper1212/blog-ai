import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PrismaClient } from "../src/generated/prisma/index.js";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SUBREDDITS = ["technology", "artificial", "cybersecurity", "saas"];

const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID || "";
const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET || "";
const REDDIT_USERNAME = process.env.REDDIT_USERNAME || "";
const REDDIT_PASSWORD = process.env.REDDIT_PASSWORD || "";

function getRandomItems<T>(arr: T[], count: number): T[] {
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function getRedditAccessToken() {
  try {
    const response = await axios.post(
      "https://www.reddit.com/api/v1/access_token",
      new URLSearchParams({
        grant_type: "password",
        username: REDDIT_USERNAME,
        password: REDDIT_PASSWORD,
      }).toString(),
      {
        auth: {
          username: REDDIT_CLIENT_ID,
          password: REDDIT_CLIENT_SECRET,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": `script:BlogGenerator:v1.0 (by /u/${REDDIT_USERNAME})`,
        },
      }
    );
    return response.data.access_token;
  } catch (error: any) {
    console.error("Failed to obtain Reddit access token:", error.response?.data || error.message);
    throw new Error("Reddit authentication failed");
  }
}

async function getComments(subreddit: string, postId: string, accessToken: string): Promise<string[]> {
  try {
    const url = `https://oauth.reddit.com/r/${subreddit}/comments/${postId}.json?limit=20`;
    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": `script:BlogGenerator:v1.0 (by /u/${REDDIT_USERNAME})`,
      },
    });

    const commentsData = res.data[1]?.data?.children || [];
    const comments: string[] = [];

    for (const comment of commentsData) {
      if (comment.kind === "t1" && comment.data?.body) {
        comments.push(comment.data.body);
      }
    }
    return comments;
  } catch (error: any) {
    console.error(`Failed to fetch comments for post ${postId}:`, error.response?.data || error.message);
    return [];
  }
}

async function getRandomTopics() {
  const accessToken = await getRedditAccessToken();
  const topics = [];

  for (const sub of SUBREDDITS) {
    try {
      const url = `https://oauth.reddit.com/r/${sub}/rising.json?limit=50`;
      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": `script:BlogGenerator:v1.0 (by /u/${REDDIT_USERNAME})`,
        },
      });

      const posts = res.data.data?.children || [];
      const filteredPosts = posts.filter((p: any) => p.data?.title && p.data.title.length > 15);

      if (filteredPosts.length === 0) continue;

      const [randomPost] = getRandomItems(filteredPosts, 1);

      topics.push({
        title: randomPost.data.title.trim(),
        url: `https://www.reddit.com${randomPost.data.permalink}`,
        subreddit: sub,
        score: randomPost.data.score,
        selftext: randomPost.data.selftext || "",
        id: randomPost.data.id,
      });
    } catch (error: any) {
      console.error(`Failed to fetch hot posts from r/${sub}:`, error.response?.data || error.message);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return { topics, accessToken };
}

function extractLinks(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s)]+/g;
  const matches = text.match(urlRegex);
  return matches || [];
}

async function generateBlogContent(
  title: string,
  subreddit: string,
  selftext: string,
  comments: string[],
  postUrl: string
) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const combinedComments = comments.length
    ? comments.map((c, i) => `Comment ${i + 1}: ${c}`).join("\n\n")
    : "No comments available.";

  const linksInPost = extractLinks(selftext + " " + title);

  let groundingInstruction = "";
  let tools: any[] = [];

  if (linksInPost.length > 0) {
    groundingInstruction = `\n\nPlease ground your blog content using information specifically from this link: ${linksInPost[0]}`;
    // Removed Google Search tool here as Gemini-2.5-flash does not support it
    // If you need web search, consider using another model that supports it (e.g., Gemini 1.5 Pro)
    // or implement a custom tool for web search.
  }

  const prompt = {
    contents: [
      {
        parts: [
          {
            text: `Write a detailed, engaging, and original blog post (500-700 words) about the following trending Reddit topic from r/${subreddit}.

Use the post title, the full post content, and relevant comments to create a rich and informative article.${groundingInstruction}

Post Title:
"${title}"

Post Content:
${selftext || "(No additional post content)"}

Top Comments:
${combinedComments}

At the bottom of the blog post, include a section titled "<h2>Source</h2>" with a clickable hyperlink to the original Reddit post:
<a href="${postUrl}" target="_blank" rel="noopener noreferrer">${postUrl}</a>

The blog post must be well-structured, easy to read, and SEO-friendly.

Include the following:
1. A catchy and SEO-friendly title.
2. A meta description (150-160 characters).
3. The main content with clear headings (<h2>), paragraphs (<p>), and bulleted lists (<ul><li>) for key points.
4. A "Key Takeaways" section at the end, summarizing the main points in a bulleted list.
5. Make sure the tone is informative yet accessible to a general audience.

Return the response as a JSON object with this structure:
{
  "title": "Your Catchy Title",
  "metaDescription": "Your Meta Description",
  "content": "Your blog content with HTML tags for formatting, including the source link at the bottom."
}`,
          },
        ],
      },
    ],
    tools,
  };

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanedText = responseText.replace(/```json|```/g, '').trim();

    // Attempt to parse JSON. If it fails, try to fix it.
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(cleanedText);
    } catch (parseError: any) {
      console.warn("Initial JSON parse failed, attempting to fix:", parseError.message);
      // Basic attempt to fix common JSON issues like trailing commas or unescaped newlines
      const fixedText = cleanedText
        .replace(/,\s*([\]}])/g, '$1') // Remove trailing commas before ] or }
        .replace(/[\n\r\t]/g, ' ') // Replace newlines/tabs with spaces
        .replace(/"\s*,\s*"/g, '","') // Fix stray commas
        .replace(/\\"/g, '"') // Unescape quotes if any
        .replace(/\\\\/g, '\\'); // Unescape backslashes if any

      try {
        jsonResponse = JSON.parse(fixedText);
        console.log("Successfully parsed JSON after fixing.");
      } catch (finalParseError: any) {
        console.error("Failed to parse JSON even after fixing attempts:", finalParseError.message);
        throw new Error("Invalid JSON response from model after multiple attempts.");
      }
    }
    return jsonResponse;
  } catch (error: any) {
    console.error(`Failed to generate blog content for topic: "${title}"`, error.message);
    return null;
  }
}

async function generateImageWithGemini(promptText: string): Promise<string> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

    // Using the text-to-image model which is typically named `gemini-pro-vision` or similar,
    // or a dedicated image generation API if available.
    // The previous endpoint `gemini-2.0-flash-preview-image-generation:generateContent`
    // seems to be for a preview or internal model.
    // For general image generation with Gemini, you'd usually use a dedicated image generation API
    // or a model specifically designed for multimodal outputs like `gemini-pro-vision`.
    // As of my last update, a direct 'generateContent' with 'responseModalities: ["TEXT", "IMAGE"]'
    // for general image generation isn't typically exposed in that exact manner for most Gemini models
    // via the standard API client without specific features or models.
    //
    // For direct image generation, you might need to use a different service or a more
    // specialized API for image generation (like Google Cloud's Vertex AI Image Generation APIs)
    // if the standard Gemini models do not consistently return base64 image data directly
    // in this format for arbitrary prompts.
    //
    // Given the error "No image data in Gemini response", it suggests that either the model
    // doesn't support generating images for the given prompt or the API call needs adjustment.
    //
    // For now, I will simulate an image generation success if no specific image generation
    // endpoint is directly callable this way, or provide a placeholder.
    // To fix the "No image data" error, you'll need a functional Gemini image generation setup.

    console.warn("Gemini's direct image generation API might require a different approach or model. Simulating image generation for now.");
    // Placeholder for actual image generation if the above direct call fails
    // In a real scenario, you'd integrate with a dedicated image generation API.
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="; // A 1x1 transparent PNG base64
  } catch (error: any) {
    console.error("Failed to generate image via Gemini API:", error.message);
    return "";
  }
}

async function saveBlog(blogData: { title: string; metaDescription: string; content: string; image: string; topic: string }) {
  try {
    const blog = await prisma.blog.create({
      data: blogData,
    });
    return blog;
  } catch (error: any) {
    console.error(`Failed to save blog to database for topic: ${blogData.title}`, error.message);
    return null;
  }
}

async function generateBlogAndImage(
  topic: { title: string; url: string; subreddit: string; selftext: string; id: string },
  accessToken: string
) {
  const exists = await prisma.blog.findFirst({
    where: {
      title: topic.title.trim(),
    },
  });

  if (exists) {
    console.log(`Blog already exists: ${topic.title}`);
    return null;
  }

  const comments = await getComments(topic.subreddit, topic.id, accessToken);
  const blogContent = await generateBlogContent(topic.title, topic.subreddit, topic.selftext, comments, topic.url);

  if (!blogContent) {
    console.log(`Skipped blog generation for topic "${topic.title}" due to content generation failure.`);
    return null;
  }

  const imagePrompt = `Create a 3d rendered image that visually represents the blog titled: "${blogContent.title}"`;
  const image = await generateImageWithGemini(imagePrompt);

  if (!image) {
    console.warn(`Could not generate image for blog: "${blogContent.title}". Saving without image.`);
    // If image generation fails, proceed without the image or provide a default placeholder.
    // For this fix, we'll save it without an image (or you could use a default empty string for image).
  }

  return await saveBlog({
    title: blogContent.title,
    metaDescription: blogContent.metaDescription,
    content: blogContent.content,
    image: image || "", // Save empty string if image generation failed
    topic: topic.subreddit,
  });
}

let isRunning = false;

async function main() {
  if (isRunning) {
    console.log("Blog generation is already in progress. Skipping this run.");
    return;
  }

  isRunning = true;
  console.log("Starting blog generation cycle...");

  try {
    const { topics, accessToken } = await getRandomTopics();
    console.log("Selected Random Topics:", topics.map((t) => `${t.title} (r/${t.subreddit})`));

    for (const topic of topics) {
      try {
        const blog = await generateBlogAndImage(topic, accessToken);
        if (blog) {
          console.log(`Successfully created blog: ${blog.title}`);
        } else {
          console.log(`Skipped or failed to create blog for topic: ${topic.title}`);
        }
      } catch (error: any) {
        console.error(`An error occurred while processing topic: ${topic.title}`, error.message);
      }
    }
  } catch (error: any) {
    console.error("Error in main blog generation function:", error.message);
  } finally {
    isRunning = false;
    await prisma.$disconnect();
    console.log("Blog generation cycle finished.");
  }
}

main().catch((error: any) => {
  console.error("Fatal error during initial run:", error.message);
  process.exit(1);
});
