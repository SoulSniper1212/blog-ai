export const maxDuration = 240;
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma/index.js';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Prisma and Gemini clients
const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Subreddits to fetch posts from
const SUBREDDITS = ["technology", "artificial", "cybersecurity", "saas"];

// Reddit API credentials
const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID || "";
const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET || "";
const REDDIT_USERNAME = process.env.REDDIT_USERNAME || "";
const REDDIT_PASSWORD = process.env.REDDIT_PASSWORD || "";

// Interfaces for Reddit API responses
interface RedditPost {
  kind: string;
  data: {
    title: string;
    permalink: string;
    score: number;
    selftext: string;
    id: string;
  };
}

interface RedditResponse {
  data: {
    children: RedditPost[];
  };
}

interface Topic {
  title: string;
  url: string;
  subreddit: string;
  score: number;
  selftext: string;
  id: string;
}

/**
 * Selects a random subset of items from an array.
 * @param arr The array to select from.
 * @param count The number of items to select.
 * @returns A new array with the random items.
 */
function getRandomItems<T>(arr: T[], count: number): T[] {
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Fetches an access token from the Reddit API.
 * @returns A promise that resolves to the access token.
 */
async function getRedditAccessToken() {
  try {
    const response = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Authorization': `Basic ${Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: "password",
        username: REDDIT_USERNAME,
        password: REDDIT_PASSWORD,
      }).toString()
    });
    
    if (!response.ok) {
      throw new Error(`Reddit auth failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data.access_token) {
      throw new Error('No access token received from Reddit');
    }
    
    return data.access_token;
  } catch (error: any) {
    console.error("Failed to obtain Reddit access token:", error);
    throw new Error("Reddit authentication failed");
  }
}

/**
 * Fetches comments for a given Reddit post.
 * @param subreddit The subreddit of the post.
 * @param postId The ID of the post.
 * @param accessToken The Reddit API access token.
 * @returns A promise that resolves to an array of comment strings.
 */
async function getComments(subreddit: string, postId: string, accessToken: string): Promise<string[]> {
  try {
    const url = `https://oauth.reddit.com/r/${subreddit}/comments/${postId}.json?limit=100&depth=10`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!res.ok) {
      console.error(`Failed to fetch comments: ${res.status} ${res.statusText}`);
      return [];
    }

    const data = await res.json();
    const commentsData = data[1]?.data?.children || [];
    const comments: string[] = [];

    // Recursive function to extract all comments and replies
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
  } catch (error: any) {
    console.error(`Failed to fetch comments for post ${postId}:`, error);
    return [];
  }
}

/**
 * Fetches random topics from the specified subreddits.
 * @returns A promise that resolves to an object containing the topics, access token, and whether a fallback was used.
 */
async function getRandomTopics() {
  let accessToken: string | null = null;
  let usedFallback = false;
  try {
    accessToken = await getRedditAccessToken();
  } catch (e) {
    console.warn('OAuth failed, will use public endpoints for all.');
    accessToken = null;
    usedFallback = true;
  }
  const topics: Topic[] = [];

  for (const sub of SUBREDDITS) {
    let posts: RedditPost[] = [];
    let success = false;
    
    const endpoints = [
      `https://oauth.reddit.com/r/${sub}/hot.json?limit=25`,
      `https://oauth.reddit.com/r/${sub}/top.json?t=day&limit=25`,
      `https://oauth.reddit.com/r/${sub}/new.json?limit=25`
    ];
      
    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          },
        });

        if (!res.ok) {
          console.error(`Failed to fetch from ${endpoint}: ${res.status} ${res.statusText}`);
          continue;
        }

        const data: RedditResponse = await res.json();
        posts = data.data?.children || [];

        if (posts.length > 0) {
          success = true;
          break;
        }
      } catch (endpointError) {
        console.error(`Error with endpoint ${endpoint}:`, endpointError);
      }
    }
    
    if (!success) {
      console.error(`Failed to fetch posts from r/${sub} with all endpoints`);
      continue;
    }

    const filteredPosts = posts.filter((p: RedditPost) => 
      p.data?.title && 
      p.data.title.length > 15 && 
      p.data.title.length < 300 &&
      !p.data.title.toLowerCase().includes('removed') &&
      !p.data.title.toLowerCase().includes('deleted')
    );

    if (filteredPosts.length === 0) {
      console.log(`No valid posts found for r/${sub}`);
      continue;
    }

    const [randomPost] = getRandomItems<RedditPost>(filteredPosts, 1);
    topics.push({
      title: randomPost.data.title.trim(),
      url: `https://www.reddit.com${randomPost.data.permalink}`,
      subreddit: sub,
      score: randomPost.data.score,
      selftext: randomPost.data.selftext || "",
      id: randomPost.data.id,
    });

    console.log(`Successfully fetched topic from r/${sub}: ${randomPost.data.title}`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return { topics, accessToken, usedFallback };
}

/**
 * Performs a Google search and returns the results.
 * @param query The search query.
 * @returns A promise that resolves to the search results.
 */
async function performGoogleSearch(query: string) {
    try {
        const response = await fetch(`https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_API_KEY}&cx=${process.env.GOOGLE_CX}&q=${encodeURIComponent(query)}`);
        if (!response.ok) {
            throw new Error(`Google Search API request failed with status ${response.status}`);
        }
        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error("Error performing Google Search:", error);
        return [];
    }
}


/**
 * Cleans the generated content by removing unwanted characters.
 * @param content The content to clean.
 * @returns The cleaned content.
 */
function cleanContent(content: string): string {
  return content
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\/g, '')
    .replace(/\n{2,}/g, '\n')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Generates blog content using the Gemini model.
 * @param title The title of the post.
 * @param subreddit The subreddit of the post.
 * @param selftext The selftext of the post.
 * @param comments An array of comments on the post.
 * @param postUrl The URL of the original Reddit post.
 * @returns A promise that resolves to the generated blog content.
 */
async function generateBlogContent(
  title: string,
  subreddit: string,
  selftext: string,
  comments: string[],
  postUrl: string
) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const combinedComments = comments.length
    ? comments.map((c, i) => `Comment ${i + 1}: ${c}`).join("\n\n")
    : "No comments available.";

  // Perform a Google search for grounding
  const searchResults = await performGoogleSearch(title);
  const searchSnippets = searchResults.map((item: any) => item.snippet).join("\n\n");

  const prompt = `
    Write a detailed, engaging, and original blog post (500-700 words) about the following trending Reddit topic from r/${subreddit}.
    
    **Grounding Information from Google Search:**
    ${searchSnippets || "No additional information from Google Search."}

    **Reddit Post Details:**
    Post Title: "${title}"
    Post Content: ${selftext || "(No additional post content)"}
    
    **Comments from the community:**
    ${combinedComments}
    
    **Instructions:**
    1.  Create a catchy, SEO-friendly title for the blog post.
    2.  Write a meta description (150-160 characters).
    3.  The main content should be well-structured with headings (<h2>), paragraphs (<p>), and bullet points (<ul><li>).
    4.  Incorporate insights from the Reddit post, comments, and the grounding information from the Google Search.
    5.  Include a "Key Takeaways" section at the end.
    6.  At the bottom, add a "Source" section with a link to the original Reddit post: <a href="${postUrl}" target="_blank" rel="noopener noreferrer">${postUrl}</a>
    7.  The tone should be informative and accessible.
    
    Return the response as a JSON object with this structure:
    {
      "title": "Your Catchy Title",
      "metaDescription": "Your Meta Description",
      "content": "Your blog content with HTML tags."
    }`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    let cleanedText = responseText.replace(/```json|```/g, '').trim();

    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error("No JSON object found in the response from Gemini.");
    }
    cleanedText = jsonMatch[0];

    const jsonResponse = JSON.parse(cleanedText);

    if (!jsonResponse.title || !jsonResponse.metaDescription || !jsonResponse.content) {
        throw new Error("The generated content is missing required fields.");
    }

    jsonResponse.content = cleanContent(jsonResponse.content);
    return jsonResponse;
  } catch (error) {
    console.error("Error generating blog content with Gemini:", error);
    return null;
  }
}

/**
 * Generates an image using the Gemini model.
 * @param promptText The prompt for the image generation.
 * @returns A promise that resolves to the base64 encoded image data.
 */
async function generateImageWithGemini(promptText: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("Missing GEMINI_API_KEY");
        return "";
    }

    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

    const headers = {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
    };

    const body = {
        contents: [{
            parts: [{ text: promptText }],
        }],
        generationConfig: {
            response_mime_type: "image/png",
        },
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        const imageData = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        if (imageData) {
            return `data:image/png;base64,${imageData}`;
        } else {
            console.error("No image data in Gemini response:", data);
            return "";
        }
    } catch (error) {
        console.error("Failed to generate image via Gemini API:", error);
        return "";
    }
}

/**
 * Saves the generated blog post to the database.
 * @param blogData The data for the blog post.
 * @returns A promise that resolves to the created blog post.
 */
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

/**
 * Main handler for the API route.
 * @param request The incoming request.
 * @returns A response with the results of the blog generation.
 */
export async function POST(request: NextRequest) {
  try {
    console.log("Starting blog generation cycle...");

    const { topics, accessToken, usedFallback } = await getRandomTopics();
    console.log("Selected Random Topics:", topics.map((t) => `${t.title} (r/${t.subreddit})`));

    const results = [];

    for (const topic of topics) {
      try {
        const exists = await prisma.blog.findFirst({
            where: {
                title: topic.title.trim(),
            },
        });

        if (exists) {
            console.log(`Blog already exists: ${topic.title}`);
            continue;
        }
        
        const comments = await getComments(topic.subreddit, topic.id, accessToken || "");
        const blogContent = await generateBlogContent(topic.title, topic.subreddit, topic.selftext, comments, topic.url);

        if (!blogContent) {
          console.log(`Skipped blog generation for topic "${topic.title}" due to content generation failure.`);
          continue;
        }

        const imagePrompt = `Create a 3D rendered image that visually represents the blog titled: "${blogContent.title}"`;
        const image = await generateImageWithGemini(imagePrompt);

        if (!image) {
          console.warn(`Could not generate image for blog: "${blogContent.title}". Saving without image.`);
        }

        const savedBlog = await saveBlog({
            title: blogContent.title,
            metaDescription: blogContent.metaDescription,
            content: blogContent.content,
            image: image || "",
            topic: topic.subreddit,
        });

        if (savedBlog) {
            console.log(`Successfully created blog: ${savedBlog.title}`);
            results.push({ success: true, title: savedBlog.title });
        } else {
            results.push({ success: false, title: topic.title, reason: 'Failed to save to database' });
        }
      } catch (error: any) {
        console.error(`An error occurred while processing topic: ${topic.title}`, error.message);
        results.push({ success: false, title: topic.title, reason: error.message });
      }
    }

    await prisma.$disconnect();
    console.log("Blog generation cycle finished.");

    return NextResponse.json({
      success: true,
      message: "Blog generation completed",
      results
    });

  } catch (error: any) {
    console.error("Error in blog generation:", error.message);
    await prisma.$disconnect();
    
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}