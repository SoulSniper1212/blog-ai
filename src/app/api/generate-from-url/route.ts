export const maxDuration = 240; 
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma/index.js';
import { GoogleGenerativeAI } from "@google/generative-ai";

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID || "";
const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET || "";
const REDDIT_USERNAME = process.env.REDDIT_USERNAME || "";
const REDDIT_PASSWORD = process.env.REDDIT_PASSWORD || "";

interface RedditPost {
  kind: string;
  data: {
    title: string;
    permalink: string;
    score: number;
    selftext: string;
    id: string;
    subreddit: string;
  };
}

interface RedditResponse {
  data: {
    children: RedditPost[];
  };
}

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

async function getComments(subreddit: string, postId: string, accessToken: string | null): Promise<string[]> {
  let isOAuth = !!accessToken;
  let triedFallback = false;
  
  // Try OAuth endpoint first
  if (isOAuth) {
    const oauthEndpoint = `https://oauth.reddit.com/r/${subreddit}/comments/${postId}.json?limit=100&depth=10`;
    try {
      const res = await fetch(oauthEndpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });
      if (!res.ok) {
        if (res.status === 403) {
          console.warn(`OAuth 403 for ${oauthEndpoint}, falling back to public endpoint.`);
          triedFallback = true;
        } else {
          console.error(`Failed to fetch comments from ${oauthEndpoint}: ${res.status} ${res.statusText}`);
        }
      } else {
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
      }
    } catch (error: any) {
      console.error(`Failed to fetch comments with OAuth for post ${postId}:`, error);
      triedFallback = true;
    }
  }
  
  // Try public endpoint if OAuth failed or we need fallback
  if (!isOAuth || triedFallback) {
    const publicEndpoint = `https://www.reddit.com/r/${subreddit}/comments/${postId}.json?limit=100&depth=10`;
    try {
      const res = await fetch(publicEndpoint, {
        headers: {
          "User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });
      if (!res.ok) {
        console.error(`Failed to fetch comments from public endpoint ${publicEndpoint}: ${res.status} ${res.statusText}`);
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
      console.error(`Failed to fetch comments with public endpoint for post ${postId}:`, error);
      return [];
    }
  }
  
  return [];
}

function extractRedditInfo(url: string): { subreddit: string; postId: string } | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    // Handle different Reddit URL formats
    // https://www.reddit.com/r/subreddit/comments/postid/title/
    // https://reddit.com/r/subreddit/comments/postid/
    
    const subredditIndex = pathParts.findIndex(part => part === 'r');
    const commentsIndex = pathParts.findIndex(part => part === 'comments');
    
    if (subredditIndex !== -1 && commentsIndex !== -1 && commentsIndex > subredditIndex) {
      const subreddit = pathParts[subredditIndex + 1];
      const postId = pathParts[commentsIndex + 1];
      
      if (subreddit && postId) {
        return { subreddit, postId };
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

async function getRedditPost(subreddit: string, postId: string, accessToken: string | null) {
  let isOAuth = !!accessToken;
  let triedFallback = false;
  
  // Try OAuth endpoint first
  if (isOAuth) {
    const oauthEndpoint = `https://oauth.reddit.com/r/${subreddit}/comments/${postId}.json`;
    try {
      const res = await fetch(oauthEndpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });
      if (!res.ok) {
        if (res.status === 403) {
          console.warn(`OAuth 403 for ${oauthEndpoint}, falling back to public endpoint.`);
          triedFallback = true;
        } else {
          console.error(`Failed to fetch post from ${oauthEndpoint}: ${res.status} ${res.statusText}`);
        }
      } else {
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          console.error('Failed to parse JSON response:', parseError);
          console.error('Response text:', text.substring(0, 200));
        }
        const postData = data[0]?.data?.children?.[0]?.data;
        if (postData) {
          return {
            title: postData.title,
            selftext: postData.selftext || "",
            subreddit: postData.subreddit,
            score: postData.score,
            id: postData.id,
            permalink: postData.permalink
          };
        }
      }
    } catch (error: any) {
      console.error(`Failed to fetch Reddit post with OAuth:`, error);
      triedFallback = true;
    }
  }
  
  // Try public endpoint if OAuth failed or we need fallback
  if (!isOAuth || triedFallback) {
    const publicEndpoint = `https://www.reddit.com/r/${subreddit}/comments/${postId}.json`;
    try {
      const res = await fetch(publicEndpoint, {
        headers: {
          "User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });
      if (!res.ok) {
        console.error(`Failed to fetch post from public endpoint ${publicEndpoint}: ${res.status} ${res.statusText}`);
        throw new Error('Failed to fetch Reddit post');
      }
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        console.error('Response text:', text.substring(0, 200));
        throw new Error('Failed to fetch Reddit post');
      }
      const postData = data[0]?.data?.children?.[0]?.data;
      if (!postData) {
        throw new Error('Failed to fetch Reddit post');
      }
      return {
        title: postData.title,
        selftext: postData.selftext || "",
        subreddit: postData.subreddit,
        score: postData.score,
        id: postData.id,
        permalink: postData.permalink
      };
    } catch (error: any) {
      console.error(`Failed to fetch Reddit post with public endpoint:`, error);
      throw new Error('Failed to fetch Reddit post');
    }
  }
  
  throw new Error('Failed to fetch Reddit post');
}

function extractLinks(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s)]+/g;
  const matches = text.match(urlRegex);
  return matches || [];
}

function getRandomItems<T>(arr: T[], count: number): T[] {
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function getRandomTopics() {
  try {
    const accessToken = await getRedditAccessToken();
    const topics: any[] = [];

    const SUBREDDITS = ["technology", "artificial", "cybersecurity", "saas"];

    for (const sub of SUBREDDITS) {
      try {
        // Try multiple endpoints with fallbacks
        const endpoints = [
          `https://oauth.reddit.com/r/${sub}/hot.json?limit=25`,
          `https://oauth.reddit.com/r/${sub}/top.json?t=day&limit=25`,
          `https://oauth.reddit.com/r/${sub}/new.json?limit=25`
        ];

        let posts: any[] = [];
        let success = false;

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

            const text = await res.text();
            let data: any;
            
            try {
              data = JSON.parse(text);
            } catch (parseError) {
              console.error(`Failed to parse JSON from ${endpoint}:`, parseError);
              console.error('Response text:', text.substring(0, 200));
              continue;
            }

            posts = data.data?.children || [];
            if (posts.length > 0) {
              success = true;
              break;
            }
          } catch (endpointError) {
            console.error(`Error with endpoint ${endpoint}:`, endpointError);
            continue;
          }
        }

        if (!success) {
          console.error(`Failed to fetch posts from r/${sub} with all endpoints`);
          continue;
        }

        const filteredPosts = posts.filter((p: any) => 
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

        const [randomPost] = getRandomItems<any>(filteredPosts, 1);

        topics.push({
          title: randomPost.data.title.trim(),
          url: `https://www.reddit.com${randomPost.data.permalink}`,
          subreddit: sub,
          score: randomPost.data.score,
          selftext: randomPost.data.selftext || "",
          id: randomPost.data.id,
        });

        console.log(`Successfully fetched topic from r/${sub}: ${randomPost.data.title}`);
      } catch (error: any) {
        console.error(`Failed to fetch posts from r/${sub}:`, error);
      }
      
      // Add delay between subreddit requests to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    return { topics, accessToken };
  } catch (error: any) {
    console.error("Failed to get random topics:", error);
    return { topics: [], accessToken: null };
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
  }

  return await saveBlog({
    title: blogContent.title,
    metaDescription: blogContent.metaDescription,
    content: blogContent.content,
    image: image || "",
    topic: topic.subreddit,
  });
}

function cleanContent(content: string): string {
  return content
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\/g, '')
    .replace(/\n{2,}/g, '\n')
    .replace(/\s{2,}/g, ' ')
    .trim();
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
  if (linksInPost.length > 0) {
    groundingInstruction = `\n\nPlease ground your blog content using information specifically from this link: ${linksInPost[0]}`;
  }

  const prompt = `Write a detailed, engaging, and original blog post (500-700 words) about the following Reddit topic from r/${subreddit}.

Use the post title, the full post content, and all comments to create a rich and informative article.${groundingInstruction}

Post Title:
"${title}"

Post Content:
${selftext || "(No additional post content)"}

All Comments:
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
}`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    let cleanedText = responseText.replace(/```json|```/g, '').trim();

    // Try to extract JSON from the response
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedText = jsonMatch[0];
    }

    let jsonResponse;
    let usedFallback = false;
    try {
      jsonResponse = JSON.parse(cleanedText);
    } catch (parseError: any) {
      // More aggressive JSON fixing
      let fixedText = cleanedText
        .replace(/,\s*([\]}])/g, '$1')
        .replace(/[\n\r\t]/g, ' ')
        .replace(/"\s*,\s*"/g, '","')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
        .replace(/([^\\])"/g, '$1\\"')
        .replace(/\\"/g, '"')
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/\s+/g, ' ')
        .trim();
      const jsonObjectMatch = fixedText.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
      if (jsonObjectMatch) {
        fixedText = jsonObjectMatch[0];
      }
      try {
        jsonResponse = JSON.parse(fixedText);
      } catch (finalParseError: any) {
        // Last resort: fallback regex
        const titleMatch = cleanedText.match(/"title"\s*:\s*"([^"]+)"/);
        const metaMatch = cleanedText.match(/"metaDescription"\s*:\s*"([^"]+)"/);
        const contentMatch = cleanedText.match(/"content"\s*:\s*"([^"]+)"/);
        if (titleMatch && metaMatch && contentMatch) {
          jsonResponse = {
            title: titleMatch[1],
            metaDescription: metaMatch[1],
            content: contentMatch[1]
          };
          usedFallback = true;
        } else {
          return null; // Fully invalid
        }
      }
    }
    // Validate required fields
    if (!jsonResponse || !jsonResponse.title || !jsonResponse.metaDescription || !jsonResponse.content) {
      return null;
    }
    // If fallback was used, treat as invalid
    if (usedFallback) {
      return null;
    }
    // Clean up content
    jsonResponse.content = cleanContent(jsonResponse.content);
    return jsonResponse;
  } catch (error: any) {
    return null;
  }
}

async function generateImageWithGemini(promptText: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Missing GEMINI_API_KEY");
    return "";
  }

  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent";

  const headers = {
    "x-goog-api-key": apiKey,
    "Content-Type": "application/json",
  };

  const body = {
    contents: [
      {
        parts: [
          { text: promptText },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    const imageData = data?.candidates?.[0]?.content?.parts?.find((part: any) => part.inlineData)?.inlineData?.data;

    if (imageData) {
      return `data:image/png;base64,${imageData}`;
    } else {
      console.error("No image data in Gemini response:", data);
      return "";
    }
  } catch (error: any) {
    console.error("Failed to generate image via Gemini API:", error);
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

export async function POST(request: NextRequest) {
  try {
    const { redditUrl } = await request.json();

    if (!redditUrl) {
      return NextResponse.json(
        { success: false, error: 'Reddit URL is required' },
        { status: 400 }
      );
    }

    // Extract subreddit and post ID from URL
    const redditInfo = extractRedditInfo(redditUrl);
    if (!redditInfo) {
      return NextResponse.json(
        { success: false, error: 'Invalid Reddit URL format' },
        { status: 400 }
      );
    }

    console.log(`Generating blog from Reddit URL: ${redditUrl}`);

    let accessToken: string | null = null;
    try { accessToken = await getRedditAccessToken(); } catch { accessToken = null; }

    // Fetch the specific Reddit post
    const post = await getRedditPost(redditInfo.subreddit, redditInfo.postId, accessToken);

    // Check if blog already exists
    const exists = await prisma.blog.findFirst({
      where: {
        title: post.title.trim(),
      },
    });

    if (exists) {
      return NextResponse.json({
        success: false,
        error: 'Blog already exists with this title'
      });
    }

    // Get comments for the post
    const comments = await getComments(redditInfo.subreddit, redditInfo.postId, accessToken);

    // Generate blog content
    const blogContent = await generateBlogContent(
      post.title,
      post.subreddit,
      post.selftext,
      comments,
      `https://www.reddit.com${post.permalink}`
    );

    if (!blogContent) {
      console.log("Blog content generation failed, falling back to normal blog generation");
      
      // Fall back to normal blog generation
      try {
        const { topics, accessToken } = await getRandomTopics();
        console.log("Selected Random Topics for fallback:", topics.map((t) => `${t.title} (r/${t.subreddit})`));

        const results = [];
        for (const topic of topics) {
          try {
            const blog = await generateBlogAndImage(topic, accessToken);
            if (blog) {
              console.log(`Successfully created fallback blog: ${blog.title}`);
              results.push({ success: true, title: blog.title });
            } else {
              console.log(`Skipped or failed to create fallback blog for topic: ${topic.title}`);
              results.push({ success: false, title: topic.title, reason: 'Skipped or failed' });
            }
          } catch (error: any) {
            console.error(`An error occurred while processing fallback topic: ${topic.title}`, error.message);
            results.push({ success: false, title: topic.title, reason: error.message });
          }
        }

        await prisma.$disconnect();
        
        return NextResponse.json({
          success: true,
          message: "URL generation failed, but generated blogs using normal process",
          fallback: true,
          results
        });
      } catch (fallbackError: any) {
        console.error("Fallback generation also failed:", fallbackError.message);
        await prisma.$disconnect();
        
        return NextResponse.json({
          success: false,
          error: 'Failed to generate blog content and fallback generation also failed'
        });
      }
    }

    // Generate image
    const imagePrompt = `Create a 3d rendered image that visually represents the blog titled: "${blogContent.title}"`;
    const image = await generateImageWithGemini(imagePrompt);

    if (!image) {
      console.warn(`Could not generate image for blog: "${blogContent.title}". Saving without image.`);
    }

    // Save to database
    const savedBlog = await saveBlog({
      title: blogContent.title,
      metaDescription: blogContent.metaDescription,
      content: blogContent.content,
      image: image || "",
      topic: post.subreddit,
    });

    if (!savedBlog) {
      return NextResponse.json({
        success: false,
        error: 'Failed to save blog to database'
      });
    }

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      message: 'Blog generated successfully from Reddit URL',
      blog: {
        title: savedBlog.title,
        metaDescription: savedBlog.metaDescription,
        id: savedBlog.id
      }
    });

  } catch (error: any) {
    console.error("Error in generate from URL:", error.message);
    await prisma.$disconnect();
    
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 