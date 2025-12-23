'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Search, BookOpen, LogOut, User as UserIcon, Upload, FileText } from 'lucide-react';
import Link from 'next/link';

interface Course {
  id: string;
  name: string;
  count: number;
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initData = async () => {
      // 1. Get User
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // 2. Fetch Courses (ID + Name)
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, name');

      // 3. Fetch ALL Resource IDs (to count them)
      const { data: resourcesData, error: resourcesError } = await supabase
        .from('resources')
        .select('course_id')
        .eq('is_hidden', false);

      if (coursesData && resourcesData) {
        // A. Calculate counts
        const counts: Record<string, number> = {};
        resourcesData.forEach((r) => {
          const cId = r.course_id;
          counts[cId] = (counts[cId] || 0) + 1;
        });

        // B. Merge counts
        let mergedCourses = coursesData.map(c => ({
          ...c,
          count: counts[c.id] || 0
        }));

        // C. SORTING LOGIC (Descending Count -> Alphabetical ID)
        mergedCourses.sort((a, b) => {
          if (b.count !== a.count) {
            return b.count - a.count; // Higher count first
          }
          return a.id.localeCompare(b.id); // Alphabetical second
        });

        setAllCourses(mergedCourses);
        setFilteredCourses(mergedCourses);
      } else {
        console.error('Error fetching data', coursesError || resourcesError);
      }
      setLoading(false);
    };

    initData();
  }, []);

  // Search Logic
  useEffect(() => {
    if (query.trim() === '') {
      setFilteredCourses(allCourses);
    } else {
      const lowerQuery = query.toLowerCase();
      const filtered = allCourses.filter(course => 
        course.id.toLowerCase().includes(lowerQuery) || 
        (course.name && course.name.toLowerCase().includes(lowerQuery))
      );
      setFilteredCourses(filtered);
    }
  }, [query, allCourses]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col relative transition-colors duration-200">
      
      {/* --- TOP BAR --- */}
      <div className="absolute top-4 right-4 flex items-center gap-4 z-20">
        {user ? (
          <>
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
              <UserIcon className="w-4 h-4" />
              <span className="font-medium">
                {user.user_metadata?.full_name?.split(' ')[0] || 'Student'}
              </span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </>
        ) : (
          <Link href="/login" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
            Login
          </Link>
        )}
      </div>

      {/* --- CENTER CONTENT --- */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 w-full max-w-5xl mx-auto space-y-8 mt-16 md:mt-0">
        
        {/* Branding */}
        <div className="text-center space-y-3">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white">BITS Archive</h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg">The community-driven resource hub</p>
        </div>

        {/* Search Bar */}
        <div className="w-full relative group max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-14 pr-4 py-5 bg-white dark:bg-gray-800 border-2 border-transparent dark:border-gray-700 shadow-lg dark:shadow-none rounded-2xl text-gray-700 dark:text-gray-100 text-lg focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 focus:outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
            placeholder="Search using Course name or ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Contribute Button */}
        <Link 
          href="/upload" 
          className="flex items-center gap-2 bg-gray-900 dark:bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-800 dark:hover:bg-blue-700 hover:shadow-lg transition-all transform hover:-translate-y-1"
        >
          <Upload className="w-5 h-5" />
          Contribute Resource
        </Link>

        {/* --- THE GRID --- */}
        <div className="w-full mt-8">
          <h3 className="text-gray-400 dark:text-gray-500 font-medium text-sm uppercase tracking-wider mb-4 ml-1">
            {query ? 'Search Results' : 'Courses'}
          </h3>
          
          {loading ? (
            <div className="text-center py-10 text-gray-400 dark:text-gray-500">Loading courses...</div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-white/50 dark:bg-gray-800/50">
              <p className="text-gray-500 dark:text-gray-400 text-lg">No courses found matching "{query}"</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try searching by ID (e.g. F111) or Name</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map((course) => (
                <Link 
                  key={course.id} 
                  href={`/course/${course.id}`}
                  className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 transition-all group flex flex-col justify-between h-full"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {course.id}
                      </span>
                      {/* Count Badge */}
                      <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${
                        course.count > 0 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                      }`}>
                        <FileText className="w-3 h-3" />
                        {course.count}
                      </span>
                    </div>
                    {/* Course Name */}
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium line-clamp-2 mt-1">
                      {course.name || 'Course Name Unavailable'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-gray-400 dark:text-gray-600 text-sm py-4">
          © {new Date().getFullYear()} BITS Archive
        </div>
      </div>
    </main>
  );
}