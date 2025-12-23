import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import { ArrowLeft, FileText, Download, Calendar, User, FileArchive, Upload } from 'lucide-react';
import ResourceActions from '@/components/ResourceActions';

// 1. Define the shape of the Resource based on your DB schema
interface Resource {
  id: string;
  course_id: string;
  year: string;
  semester: number;
  prof: string;
  type: string;
  filename: string;
  hf_path: string;
  file_hash: string;
  uploader_name?: string;
  uploader_email?: string;
  is_hidden?: boolean;
  upvotes: number;
}

interface Props {
  params: Promise<{ id: string }>;
}

export const revalidate = 0;

export default async function CoursePage({ params }: Props) {
  const { id } = await params;
  const courseId = decodeURIComponent(id).toUpperCase();

  // 2. Fetch resources
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('course_id', courseId)
    .eq('is_hidden', false)
    .order('year', { ascending: false });

  if (error || !data) {
    return <div className="p-8 text-center text-red-500">Error loading course resources.</div>;
  }

  const resources = data as Resource[];

  // 3. Group resources
  const groupedResources = resources.reduce((acc, resource) => {
    // If type is empty/null, categorize as 'Other'
    const type = resource.type || 'Other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(resource);
    return acc;
  }, {} as Record<string, Resource[]>);

  // Sort keys so "Lecture Slides" usually comes first, others follow
  const resourceTypes = Object.keys(groupedResources).sort((a, b) => {
    const order = ['Lecture Slides', 'Tutorials', 'Lab Manuals', 'PYQ (with soln.)', 'PYQ (without soln.)'];
    const indexA = order.indexOf(a);
    const indexB = order.indexOf(b);
    // If both are in the known list, sort by index
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    // If one is known, it comes first
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    // Otherwise alphabetical
    return a.localeCompare(b);
  });

  // Helper to check for archive files
  const isArchive = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '');
  };

  // Helper for Section Dot Colors
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Lecture Slides': return 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]';
      case 'Tutorials': return 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]';
      case 'Lab Manuals': return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
      case 'PYQ (with soln.)': return 'bg-purple-600 shadow-[0_0_10px_rgba(147,51,234,0.5)]';
      case 'PYQ (without soln.)': return 'bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]';
      default: return 'bg-gray-400 dark:bg-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 md:p-12 transition-colors duration-200">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Search
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">{courseId} Archive</h1>
          </div>
          {/* Contribute Button */}
          <Link 
            href="/upload" 
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-900 dark:bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 dark:hover:bg-blue-700 hover:shadow-lg transition-all transform hover:-translate-y-0.5"
          >
            <Upload className="w-4 h-4" />
            Contribute
          </Link>
        </div>

        {/* Resources Grid */}
        {resourceTypes.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400 text-lg">No resources found for this course yet.</p>
            <Link href="/upload" className="text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block font-medium">
              Upload the first file
            </Link>
          </div>
        ) : (
          <div className="grid gap-10">
            {resourceTypes.map((type) => (
              <div key={type} className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-3">
                  <span className={`w-3 h-3 rounded-full ${getTypeColor(type)}`}></span>
                  {type}
                </h3>
                
                <div className="grid gap-4">
                  {groupedResources[type].map((res: Resource) => (
                    <div key={res.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all group gap-4">
                      
                      {/* Left Side: Icon & Info */}
                      <div className="flex items-start gap-4 flex-1">
                        {/* Icon Box */}
                        <div className={`p-3 rounded-xl flex-shrink-0 ${
                          isArchive(res.filename) 
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                        }`}>
                          {isArchive(res.filename) ? <FileArchive className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                        </div>
                        
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white truncate text-base mb-1 pr-4">
                            {res.filename}
                          </p>
                          
                          {/* Metadata Tags */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs md:text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" /> {res.year} (Sem {res.semester})
                            </span>
                            {res.prof && (
                              <span className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5" /> Prof. {res.prof}
                              </span>
                            )}
                            
                            {/* Contributor Credit */}
                            {res.uploader_name && (
                              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-800/50">
                                uploaded by {res.uploader_email} | {res.uploader_name.substring(0,res.uploader_name.indexOf(' '))}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Actions */}
                      <div className="flex items-center gap-3 justify-between md:justify-end w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-0 border-gray-100 dark:border-gray-700">
                        {/* Vote & Report */}
                        <ResourceActions
                          resourceId={res.id} 
                          initialUpvotes={res.upvotes} 
                          uploaderEmail={res.uploader_email}
                        />

                        {/* Download Button */}
                        <a 
                          href={`${process.env.NEXT_PUBLIC_WORKER_URL}?path=${res.hf_path}`}
                          className="p-2.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Download"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}