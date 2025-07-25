'use client';
import { notFound } from "next/navigation";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Blog } from '@/types';

interface BlogWithActions extends Blog {
  isEditing?: boolean;
  isDeleting?: boolean;
}

export default function AdminPage() {
  // Call all hooks first
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [redditUrl, setRedditUrl] = useState('');
  const [isGeneratingFromUrl, setIsGeneratingFromUrl] = useState(false);
  const [urlResult, setUrlResult] = useState<any>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [isGeneratingFromTopic, setIsGeneratingFromTopic] = useState(false);
  const [topicResult, setTopicResult] = useState<any>(null);
  const [topicError, setTopicError] = useState<string | null>(null);
  
  // Blog management states
  const [blogs, setBlogs] = useState<BlogWithActions[]>([]);
  const [isLoadingBlogs, setIsLoadingBlogs] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterArchived, setFilterArchived] = useState<string>('all');
  const [filterPrivate, setFilterPrivate] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingBlog, setEditingBlog] = useState<BlogWithActions | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    metaDescription: '',
    content: '',
    image: '',
    topic: '',
    isArchived: false,
    isPrivate: false
  });
  const [newBlogForm, setNewBlogForm] = useState({
    title: '',
    metaDescription: '',
    content: '',
    image: '',
    topic: '',
    isArchived: false,
    isPrivate: false
  });
  const [isSubmittingNewBlog, setIsSubmittingNewBlog] = useState(false);
  const [newBlogError, setNewBlogError] = useState<string | null>(null);
  const [newBlogSuccess, setNewBlogSuccess] = useState<string | null>(null);

  const loadBlogs = useCallback(async () => {
    setIsLoadingBlogs(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: searchTerm,
        ...(filterArchived !== 'all' && { archived: filterArchived }),
        ...(filterPrivate !== 'all' && { private: filterPrivate })
      });

      const response = await fetch(`/api/blogs?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setBlogs(data.blogs);
        setTotalPages(data.pagination.pages);
      } else {
        console.error('Failed to load blogs:', data.error);
      }
    } catch (error) {
      console.error('Error loading blogs:', error);
    } finally {
      setIsLoadingBlogs(false);
    }
  }, [currentPage, searchTerm, filterArchived, filterPrivate]);

  // Check authentication status on component mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Load blogs when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadBlogs();
    }
  }, [isAuthenticated, loadBlogs]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth');
      const data = await response.json();
      setIsAuthenticated(data.authenticated);
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password, action: 'login' }),
      });

      const data = await response.json();
      
      if (data.success) {
        setIsAuthenticated(true);
        setPassword('');
      } else {
        setLoginError(data.message || 'Login failed');
      }
    } catch (err: any) {
      setLoginError('An error occurred during login');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'logout' }),
      });
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const generateBlogs = async () => {
    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/generate-blogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
        loadBlogs(); // Refresh the blog list
      } else {
        setError(data.error || 'Failed to generate blogs');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFromRedditUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingFromUrl(true);
    setUrlError(null);
    setUrlResult(null);

    try {
      const response = await fetch('/api/generate-from-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ redditUrl }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setUrlResult(data);
        setRedditUrl(''); // Clear the input on success
        loadBlogs(); // Refresh the blog list
      } else {
        setUrlError(data.error || 'Failed to generate blog from URL');
      }
    } catch (err: any) {
      setUrlError(err.message || 'An error occurred');
    } finally {
      setIsGeneratingFromUrl(false);
    }
  };

  const generateFromTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingFromTopic(true);
    setTopicError(null);
    setTopicResult(null);

    try {
      const response = await fetch('/api/generate-from-topic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setTopicResult(data);
        setTopic(''); // Clear the input on success
        loadBlogs(); // Refresh the blog list
      } else {
        setTopicError(data.error || 'Failed to generate blog from topic');
      }
    } catch (err: any) {
      setTopicError(err.message || 'An error occurred');
    } finally {
      setIsGeneratingFromTopic(false);
    }
  };

  const handleNewBlogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingNewBlog(true);
    setNewBlogError(null);
    setNewBlogSuccess(null);
    try {
      const response = await fetch('/api/blogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBlogForm),
      });
      const data = await response.json();
      if (response.ok) {
        setNewBlogSuccess('Blog created successfully!');
        setNewBlogForm({
          title: '',
          metaDescription: '',
          content: '',
          image: '',
          topic: '',
          isArchived: false,
          isPrivate: false
        });
        loadBlogs();
      } else {
        setNewBlogError(data.error || 'Failed to create blog');
      }
    } catch (err: any) {
      setNewBlogError(err.message || 'An error occurred');
    } finally {
      setIsSubmittingNewBlog(false);
    }
  };

  const startEdit = (blog: BlogWithActions) => {
    setEditingBlog(blog);
    setEditForm({
      title: blog.title,
      metaDescription: blog.metaDescription || '',
      content: blog.content,
      image: blog.image || '',
      topic: blog.topic,
      isArchived: blog.isArchived,
      isPrivate: blog.isPrivate
    });
  };

  const cancelEdit = () => {
    setEditingBlog(null);
    setEditForm({
      title: '',
      metaDescription: '',
      content: '',
      image: '',
      topic: '',
      isArchived: false,
      isPrivate: false
    });
  };

  const saveEdit = async () => {
    if (!editingBlog) return;

    try {
      const response = await fetch('/api/blogs', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingBlog.id,
          ...editForm
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setBlogs(blogs.map(blog => 
          blog.id === editingBlog.id ? { ...blog, ...editForm } : blog
        ));
        cancelEdit();
      } else {
        alert(data.error || 'Failed to update blog');
      }
    } catch (error) {
      alert('An error occurred while updating the blog');
    }
  };

  const deleteBlog = async (blog: BlogWithActions) => {
    if (!confirm(`Are you sure you want to delete "${blog.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/blogs?id=${blog.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (response.ok) {
        setBlogs(blogs.filter(b => b.id !== blog.id));
      } else {
        alert(data.error || 'Failed to delete blog');
      }
    } catch (error) {
      alert('An error occurred while deleting the blog');
    }
  };

  const toggleArchive = async (blog: BlogWithActions) => {
    try {
      const response = await fetch('/api/blogs', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: blog.id,
          title: blog.title,
          metaDescription: blog.metaDescription,
          content: blog.content,
          image: blog.image,
          topic: blog.topic,
          isArchived: !blog.isArchived,
          isPrivate: blog.isPrivate
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setBlogs(blogs.map(b => 
          b.id === blog.id ? { ...b, isArchived: !b.isArchived } : b
        ));
      } else {
        alert(data.error || 'Failed to update blog');
      }
    } catch (error) {
      alert('An error occurred while updating the blog');
    }
  };

  const togglePrivate = async (blog: BlogWithActions) => {
    try {
      const response = await fetch('/api/blogs', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: blog.id,
          title: blog.title,
          metaDescription: blog.metaDescription,
          content: blog.content,
          image: blog.image,
          topic: blog.topic,
          isArchived: blog.isArchived,
          isPrivate: !blog.isPrivate
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setBlogs(blogs.map(b => 
          b.id === blog.id ? { ...b, isPrivate: !b.isPrivate } : b
        ));
      } else {
        alert(data.error || 'Failed to update blog');
      }
    } catch (error) {
      alert('An error occurred while updating the blog');
    }
  };

  // Now check the environment
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="max-w-md w-full mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Admin Login</h1>
            
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Enter admin password"
                  required
                />
              </div>

              {loginError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 text-sm">{loginError}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Login
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/" className="text-blue-600 hover:text-blue-800 underline text-sm">
                ← Back to Blog
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Blog Admin Panel</h1>
                <p className="text-sm text-gray-600">Manage your blog content and settings</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-sm">View Site</span>
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Dashboard Overview</h2>
            <p className="text-blue-100 text-sm mt-1">Manage your blog content, generate new posts, and control visibility</p>
          </div>
          
          <div className="p-6 space-y-8">
            {/* Blog Management Section */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Blog Management</h2>
              </div>
              
              {/* Filters */}
              <div className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Filters & Search</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                          <input
                            type="text"
                            placeholder="Title"
                            value={editForm.title}
                            onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                            className="px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                          />
                  </div>
                  <select
                    value={filterArchived}
                    onChange={(e) => setFilterArchived(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="false">Active</option>
                    <option value="true">Archived</option>
                  </select>
                  <select
                    value={filterPrivate}
                    onChange={(e) => setFilterPrivate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Visibility</option>
                    <option value="false">Public</option>
                    <option value="true">Private</option>
                  </select>
                  <button
                    onClick={loadBlogs}
                    disabled={isLoadingBlogs}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors flex items-center justify-center space-x-2"
                  >
                    {isLoadingBlogs ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Refresh</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Blog List */}
              <div className="space-y-4">
                {blogs.map((blog) => (
                  <div key={blog.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                    {editingBlog?.id === blog.id ? (
                      // Edit Form
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input
                            type="text"
                            placeholder="Topic"
                            value={editForm.topic}
                            onChange={(e) => setEditForm({...editForm, topic: e.target.value})}
                            className="px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                          />
                          <input
                            type="text"
                            placeholder="Topic"
                            value={editForm.topic}
                            onChange={(e) => setEditForm({...editForm, topic: e.target.value})}
                            className="px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                          />
                        </div>
                        <textarea
                          placeholder="Meta Description"
                          value={editForm.metaDescription}
                          onChange={(e) => setEditForm({...editForm, metaDescription: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                          rows={2}
                        />
                        <textarea
                          placeholder="Content (HTML)"
                          value={editForm.content}
                          onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                          rows={6}
                        />
                        <input
                          type="text"
                          placeholder="Image URL"
                          value={editForm.image}
                          onChange={(e) => setEditForm({...editForm, image: e.target.value})}
                          className="px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                        />
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editForm.isArchived}
                              onChange={(e) => setEditForm({...editForm, isArchived: e.target.checked})}
                              className="mr-2"
                            />
                            Archived
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editForm.isPrivate}
                              onChange={(e) => setEditForm({...editForm, isPrivate: e.target.checked})}
                              className="mr-2"
                            />
                            Private
                          </label>
                        </div>
                                                 <div className="flex space-x-3">
                           <button
                             onClick={saveEdit}
                             className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                           >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                             </svg>
                             <span>Save</span>
                           </button>
                           <button
                             onClick={cancelEdit}
                             className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                           >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                             </svg>
                             <span>Cancel</span>
                           </button>
                         </div>
                      </div>
                    ) : (
                      // Blog Display
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">{blog.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{blog.topic}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Created: {new Date(blog.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            {blog.isArchived && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                Archived
                              </span>
                            )}
                            {blog.isPrivate && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                Private
                              </span>
                            )}
                          </div>
                        </div>
                        
                                                 <div className="flex flex-wrap gap-2 mt-4">
                           <button
                             onClick={() => startEdit(blog)}
                             className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
                           >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                             </svg>
                             <span>Edit</span>
                           </button>
                           <button
                             onClick={() => toggleArchive(blog)}
                             className={`px-3 py-2 text-sm rounded-lg transition-colors flex items-center space-x-1 ${
                               blog.isArchived 
                                 ? 'bg-green-600 text-white hover:bg-green-700' 
                                 : 'bg-yellow-600 text-white hover:bg-yellow-700'
                             }`}
                           >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                             </svg>
                             <span>{blog.isArchived ? 'Unarchive' : 'Archive'}</span>
                           </button>
                           <button
                             onClick={() => togglePrivate(blog)}
                             className={`px-3 py-2 text-sm rounded-lg transition-colors flex items-center space-x-1 ${
                               blog.isPrivate 
                                 ? 'bg-green-600 text-white hover:bg-green-700' 
                                 : 'bg-red-600 text-white hover:bg-red-700'
                             }`}
                           >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                             </svg>
                             <span>{blog.isPrivate ? 'Make Public' : 'Make Private'}</span>
                           </button>
                           <Link
                             href={`/blog/${blog.id}`}
                             target="_blank"
                             className="px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-1"
                           >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                             </svg>
                             <span>View</span>
                           </Link>
                           <button
                             onClick={() => deleteBlog(blog)}
                             className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-1"
                           >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                             </svg>
                             <span>Delete</span>
                           </button>
                         </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {blogs.length === 0 && !isLoadingBlogs && (
                  <div className="text-center py-8 text-gray-500">
                    No blogs found matching your criteria.
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-2 text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Manual Blog Creation Section */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Write Your Own Blog</h2>
              </div>
              <form onSubmit={handleNewBlogSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Title"
                    value={newBlogForm.title}
                    onChange={e => setNewBlogForm({ ...newBlogForm, title: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Topic"
                    value={newBlogForm.topic}
                    onChange={e => setNewBlogForm({ ...newBlogForm, topic: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    required
                  />
                </div>
                <textarea
                  placeholder="Meta Description"
                  value={newBlogForm.metaDescription}
                  onChange={e => setNewBlogForm({ ...newBlogForm, metaDescription: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  rows={2}
                  required
                />
                <textarea
                  placeholder="Content (HTML)"
                  value={newBlogForm.content}
                  onChange={e => setNewBlogForm({ ...newBlogForm, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  rows={6}
                  required
                />
                <input
                  type="text"
                  placeholder="Image URL"
                  value={newBlogForm.image}
                  onChange={e => setNewBlogForm({ ...newBlogForm, image: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                />
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newBlogForm.isArchived}
                      onChange={e => setNewBlogForm({ ...newBlogForm, isArchived: e.target.checked })}
                      className="mr-2"
                    />
                    Archived
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newBlogForm.isPrivate}
                      onChange={e => setNewBlogForm({ ...newBlogForm, isPrivate: e.target.checked })}
                      className="mr-2"
                    />
                    Private
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingNewBlog}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    isSubmittingNewBlog
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-pink-600 text-white hover:bg-pink-700'
                  }`}
                >
                  {isSubmittingNewBlog ? 'Submitting...' : 'Publish Blog'}
                </button>
              </form>
              {newBlogError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                  <h3 className="text-red-800 font-medium">Error</h3>
                  <p className="text-red-600 mt-1">{newBlogError}</p>
                </div>
              )}
              {newBlogSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                  <h3 className="text-green-800 font-medium">Success</h3>
                  <p className="text-green-600 mt-1">{newBlogSuccess}</p>
                </div>
              )}
            </div>

            {/* Generate from Topic */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M12 21v-1m0-16a8 8 0 100 16 8 8 0 000-16z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Generate from Topic</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Enter a topic or a title, and the AI will write a blog post for you.
              </p>
              
              <form onSubmit={generateFromTopic} className="space-y-4">
                <div>
                  <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
                    Blog Topic
                  </label>
                  <input
                    type="text"
                    id="topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="e.g., The Future of Artificial Intelligence"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isGeneratingFromTopic}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    isGeneratingFromTopic
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                >
                  {isGeneratingFromTopic ? 'Generating...' : 'Generate Blog'}
                </button>
              </form>

              {topicError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                  <h3 className="text-red-800 font-medium">Error</h3>
                  <p className="text-red-600 mt-1">{topicError}</p>
                </div>
              )}

              {topicResult && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                  <h3 className="text-green-800 font-medium">Success!</h3>
                  <p className="text-green-600 mt-1 mb-3">{topicResult.message}</p>
                  
                  {topicResult.blog && (
                    <div className="mt-4">
                      <h4 className="text-green-800 font-medium mb-2">Generated Blog:</h4>
                      <div className="bg-white rounded p-3">
                        <p className="font-medium text-gray-900">{topicResult.blog.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{topicResult.blog.metaDescription}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Generate from Reddit URL */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Generate from Reddit URL</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Paste a Reddit post URL to generate a blog post from that specific content.
              </p>
              
              <form onSubmit={generateFromRedditUrl} className="space-y-4">
                <div>
                  <label htmlFor="redditUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    Reddit Post URL
                  </label>
                  <input
                    type="url"
                    id="redditUrl"
                    value={redditUrl}
                    onChange={(e) => setRedditUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="https://www.reddit.com/r/technology/comments/..."
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isGeneratingFromUrl}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    isGeneratingFromUrl
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {isGeneratingFromUrl ? 'Generating...' : 'Generate from URL'}
                </button>
              </form>

              {urlError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                  <h3 className="text-red-800 font-medium">Error</h3>
                  <p className="text-red-600 mt-1">{urlError}</p>
                </div>
              )}

              {urlResult && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                  <h3 className="text-green-800 font-medium">
                    {urlResult.fallback ? "Fallback Success!" : "Success!"}
                  </h3>
                  <p className="text-green-600 mt-1 mb-3">{urlResult.message}</p>
                  
                  {urlResult.fallback && urlResult.results && (
                    <div className="mt-4">
                      <h4 className="text-green-800 font-medium mb-2">Fallback Blogs Generated:</h4>
                      <ul className="space-y-2">
                        {urlResult.results.map((item: any, index: number) => (
                          <li key={index} className="text-sm">
                            <span className={`font-medium ${item.success ? 'text-green-700' : 'text-red-700'}`}>
                              {item.success ? '✅' : '❌'} {item.title}
                            </span>
                            {!item.success && item.reason && (
                              <span className="text-red-600 ml-2">({item.reason})</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {urlResult.blog && !urlResult.fallback && (
                    <div className="mt-4">
                      <h4 className="text-green-800 font-medium mb-2">Generated Blog:</h4>
                      <div className="bg-white rounded p-3">
                        <p className="font-medium text-gray-900">{urlResult.blog.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{urlResult.blog.metaDescription}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Auto Generate Blogs */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Auto Generate Blogs</h2>
              </div>
              <p className="text-gray-600 mb-4">
                This will fetch trending topics from Reddit and generate blog posts using AI.
              </p>
              
              <button
                onClick={generateBlogs}
                disabled={isGenerating}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  isGenerating
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isGenerating ? 'Generating Blogs...' : 'Generate Blogs'}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-red-800 font-medium">Error</h3>
                <p className="text-red-600 mt-1">{error}</p>
              </div>
            )}

            {result && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-green-800 font-medium">Success!</h3>
                <p className="text-green-600 mt-1 mb-3">{result.message}</p>
                
                {result.results && result.results.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-green-800 font-medium mb-2">Results:</h4>
                    <ul className="space-y-2">
                      {result.results.map((item: any, index: number) => (
                        <li key={index} className="text-sm">
                          <span className={`font-medium ${item.success ? 'text-green-700' : 'text-red-700'}`}>
                            {item.success ? '✅' : '❌'} {item.title}
                          </span>
                          {!item.success && item.reason && (
                            <span className="text-red-600 ml-2">({item.reason})</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
