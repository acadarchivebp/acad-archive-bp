import Link from 'next/link';
import UploadForm from '@/components/UploadForm';
import { ArrowLeft } from 'lucide-react';

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 md:p-12 transition-colors duration-200">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Back Link */}
        <div className="flex items-center gap-2 mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>

        {/* Header Section */}
        <div className="text-center space-y-3 mb-10">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
            Upload Resources
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400">
            Help the community by adding resources.
          </p>
        </div>

        {/* The Form Component */}
        <UploadForm />
        
      </div>
    </div>
  );
}