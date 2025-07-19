import React from "react";

const SkeletonCard = () => {
  return (
    <article className="group relative bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 overflow-hidden animate-pulse">
      <div className="aspect-[16/10] bg-gray-200" />
      
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-5 w-16 bg-gray-200 rounded-full" />
          <div className="h-4 w-20 bg-gray-200 rounded" />
        </div>
        
        <div className="space-y-3 mb-4">
          <div className="h-6 bg-gray-200 rounded w-3/4" />
          <div className="h-6 bg-gray-200 rounded w-1/2" />
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-4/6" />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-4 w-4 bg-gray-200 rounded mr-2" />
            <div className="h-4 w-16 bg-gray-200 rounded" />
          </div>
          <div className="h-4 w-20 bg-gray-200 rounded" />
        </div>
      </div>
    </article>
  );
};

export default SkeletonCard;
