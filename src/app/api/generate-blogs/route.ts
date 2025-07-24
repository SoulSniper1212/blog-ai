export const maxDuration = 240;
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma/index.js';
import { GoogleGenAI, Modality } from "@google/genai";

// Initialize Prisma and the new Google GenAI Client
const prisma = new PrismaClient();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// Subreddits to fetch posts from
const SUBREDDITS = ["technology", "artificial", "cybersecurity", "saas"];

// A unique user-agent is required for unauthenticated requests.
const CUSTOM_USER_AGENT = "my-blog-generator-app:v2.0 (by /u/Jackfruitstricking)";

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
 */
function getRandomItems<T>(arr: T[], count: number): T[] {
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
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
  } catch (error: any) {
    console.error(`Failed to fetch comments for post ${postId}:`, error);
    return [];
  }
}

/**
 * Fetches random topics from the specified subreddits using public endpoints.
 */
async function getRandomTopics() {
  const topics: Topic[] = [];

  for (const sub of SUBREDDITS) {
    let posts: RedditPost[] = [];
    let success = false;
    
    const endpoints = [
      `https://www.reddit.com/r/${sub}/hot.json?limit=25`,
      `https://www.reddit.com/r/${sub}/rising.json?t=day&limit=25`,
      `https://www.reddit.com/r/${sub}/new.json?limit=25`
    ];
      
    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, { headers: { "User-Agent": CUSTOM_USER_AGENT } });

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

  return { topics };
}

/**
 * Cleans the generated content by removing unwanted characters.
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
 * Generates blog content using the new @google/genai SDK.
 */
async function generateBlogContent(
  title: string,
  subreddit: string,
  selftext: string,
  comments: string[],
  postUrl: string
) {
  const combinedComments = comments.length
    ? comments.map((c, i) => `Comment ${i + 1}: ${c}`).join("\n\n")
    : "No comments available.";

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
    3.  The main content should be well-structured with headings (<h2>), paragraphs (<p>), and bullet points (<ul><li>).
    4.  Incorporate insights from the Reddit post and comments.
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
 * Generates an image using the Gemini image generation model.
 * This function is corrected to handle the required response modalities.
 */
async function generateImageWithGemini(promptText: string): Promise<string> {
    try {
        console.log(`Generating image for prompt: "${promptText}"`);
        
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-preview-image-generation",
            contents: [{ parts: [{ text: promptText }] }],
            config: {
                // FIX: The model requires both TEXT and IMAGE modalities to be specified.
                responseModalities: [Modality.TEXT, Modality.IMAGE],
            },
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
async function saveBlog(blogData: { title: string; metaDescription: string; content: string; image: string; topic: string }) {
  try {
    const blog = await prisma.blog.create({ data: blogData });
    return blog;
  } catch (error: any) {
    console.error(`Failed to save blog to database for topic: ${blogData.title}`, error.message);
    return null;
  }
}

/**
 * Main handler for the API route.
 */
export async function POST(request: NextRequest) {
  try {
    console.log("Starting blog generation cycle...");

    const { topics } = await getRandomTopics();
    console.log("Selected Random Topics:", topics.map((t) => `${t.title} (r/${t.subreddit})`));

    const results = [];

    for (const topic of topics) {
      try {
        const exists = await prisma.blog.findFirst({
            where: {
                OR: [
                    { content: { contains: topic.url } } 
                ]
            },
        });

        if (exists) {
            console.log(`Blog based on this topic already exists: ${topic.title}`);
            continue;
        }
        
        const comments = await getComments(topic.subreddit, topic.id);
        const blogContent = await generateBlogContent(topic.title, topic.subreddit, topic.selftext, comments, topic.url);

        if (!blogContent) {
          console.log(`Skipped blog generation for topic "${topic.title}" due to content generation failure.`);
          continue;
        }

        const generatedTitleExists = await prisma.blog.findFirst({
            where: { title: blogContent.title },
        });

        if (generatedTitleExists) {
            console.log(`A blog with the generated title already exists: "${blogContent.title}"`);
            continue;
        }
        
        const imagePrompt = `Create a visually stunning, quality 3D rendered photo for a tech blog. The image should be precise and artistic, representing the core themes of this title: "${blogContent.title}". Focus on a modern, clean aesthetic.`;
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
