'use client';

import { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { createClient } from '@/utils/supabase';
import { Upload, FileUp, AlertCircle, CheckCircle, FileArchive } from 'lucide-react';

const RESOURCE_TYPES = [
  'Lecture Slides',
  'Tutorials',
  'Lab Manuals',
  'PYQ (with soln.)',
  'PYQ (without soln.)',
  'Other'
];

export default function UploadForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [fileHash, setFileHash] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  
  // Track which button is active (separate from the actual text value)
  const [activeTypeBtn, setActiveTypeBtn] = useState('Lecture Slides');

  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const [formData, setFormData] = useState({
    course_id: '',
    year: '',
    semester: '1',
    prof: '',
    type: 'Lecture Slides', // Default
  });

  const handleTypeClick = (type: string) => {
    setActiveTypeBtn(type);
    if (type === 'Other') {
      setFormData({ ...formData, type: '' }); // Clear type so user has to type it
    } else {
      setFormData({ ...formData, type });
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File is too large. Max limit is 500MB.' });
      e.target.value = '';
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      setFileHash(hashHex);
      setMessage(null);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to process file.' });
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      setMessage({ type: 'error', text: 'You must be logged in to upload.' });
      return;
    }
    
    // Validation for "Other" type
    if (activeTypeBtn === 'Other' && !formData.type.trim()) {
      setMessage({ type: 'error', text: 'Please specify the resource type.' });
      return;
    }
    
    setLoading(true);
    setMessage(null);

    const fileInput = (e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement);
    const file = fileInput?.files?.[0];

    if (!file || !fileHash) {
      setLoading(false);
      setMessage({ type: 'error', text: 'Please select a file.' });
      return;
    }

    try {
      const { data: existing } = await supabase
        .from('resources')
        .select('id')
        .eq('file_hash', fileHash)
        .maybeSingle();

      if (existing) {
        throw new Error('Duplicate File! This resource already exists.');
      }

      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('course_id', formData.course_id.toUpperCase().trim());
      uploadData.append('year', formData.year);
      uploadData.append('semester', formData.semester);

      const uploadRes = await fetch(process.env.NEXT_PUBLIC_HF_UPLOADER_URL!, {
        method: 'POST',
        headers: { 'secret': process.env.NEXT_PUBLIC_UPLOAD_SECRET! },
        body: uploadData,
      });

      if (!uploadRes.ok) throw new Error('Upload to storage failed.');
      
      const responseJson = await uploadRes.json();
      const hfPath = responseJson.hf_path || responseJson.path;

      const { error: dbError } = await supabase.from('resources').insert({
        course_id: formData.course_id.toUpperCase().trim(),
        year: formData.year,
        semester: parseInt(formData.semester),
        prof: formData.prof,
        type: formData.type, // This now contains the specific string or custom input
        filename: file.name,
        hf_path: hfPath,
        file_hash: fileHash,
        uploader_email: user.email,
        uploader_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student',
      });

      if (dbError) throw dbError;

      setMessage({ type: 'success', text: 'Resource uploaded successfully!' });
      // Reset form but keep some defaults
      setFormData({ ...formData, course_id: '', prof: '' }); 
      fileInput.value = '';
      setFileHash(null);

    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all outline-none";
  const labelClass = "block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1.5";

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-8 transition-colors duration-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <Upload className="w-5 h-5 text-gray-700 dark:text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Contribute Resource</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Course Info Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Course ID</label>
            <input required type="text" placeholder="e.g. 'CS F111'" className={inputClass}
              value={formData.course_id} onChange={(e) => setFormData({ ...formData, course_id: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Prof Name</label>
            <input required type="text" placeholder="Prof." className={inputClass}
              value={formData.prof} onChange={(e) => setFormData({ ...formData, prof: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Year</label>
            <input required type="text" placeholder="e.g. '2023-24'" className={inputClass}
              value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Semester</label>
            <select className={inputClass}
              value={formData.semester} onChange={(e) => setFormData({ ...formData, semester: e.target.value })}>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
            </select>
          </div>
        </div>

        {/* Resource Type Buttons */}
        <div>
          <label className={labelClass}>Resource Type</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {RESOURCE_TYPES.map((type) => (
              <button key={type} type="button" onClick={() => handleTypeClick(type)}
                className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all ${
                  activeTypeBtn === type 
                    ? 'bg-gray-900 dark:bg-blue-600 text-white border-gray-900 dark:border-blue-600 ring-2 ring-offset-2 ring-gray-900 dark:ring-blue-600 dark:ring-offset-gray-800' 
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}>
                {type}
              </button>
            ))}
          </div>

          {/* Conditional Input for 'Other' */}
          {activeTypeBtn === 'Other' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <input 
                required 
                type="text" 
                placeholder="Please specify (e.g. 'Assignment Solutions')" 
                className={inputClass}
                value={formData.type} 
                onChange={(e) => setFormData({ ...formData, type: e.target.value })} 
                autoFocus
              />
            </div>
          )}
        </div>
        
        {/* File Input */}
        <div>
          <label className={labelClass}>
            File Upload (PDF or ZIP) <br />
            <span className="normal-case font-normal opacity-75">Upload whole set as .zip or merged PDF. Contributor name is public.</span>
          </label>
          <div className="relative group p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 transition-colors bg-gray-50 dark:bg-gray-800/50 text-center cursor-pointer">
            <input required type="file" 
              accept=".pdf,.zip,.rar,.7z,.doc,.docx,.ppt,.pptx" 
              onChange={handleFileChange} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
            
            <div className="space-y-3 pointer-events-none">
                <div className="w-12 h-12 mx-auto bg-white dark:bg-gray-700 rounded-full flex items-center justify-center shadow-sm">
                  <FileArchive className="w-6 h-6 text-gray-400 dark:text-gray-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {fileHash ? 'File selected' : 'Click to browse or drag file here'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Max size 500MB</p>
                </div>
            </div>
          </div>
          {fileHash && <p className="mt-2 text-sm text-green-600 dark:text-green-400 font-medium text-center flex items-center justify-center gap-1"><CheckCircle className="w-4 h-4"/> Ready to upload</p>}
        </div>

        {/* Submit Button */}
        <button type="submit" disabled={loading}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-600/20 transition-all transform hover:-translate-y-0.5 flex justify-center items-center gap-2 disabled:opacity-70 disabled:transform-none">
          {loading ? <span className="animate-pulse">Uploading to Vault...</span> : <><FileUp className="w-5 h-5" /> Contribute Resource</>}
        </button>

        {/* Status Message */}
        {message && (
          <div className={`p-4 rounded-xl flex items-start gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-900' 
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5 mt-0.5"/> : <AlertCircle className="w-5 h-5 mt-0.5"/>}
            <p className="text-sm font-medium leading-tight pt-0.5">{message.text}</p>
          </div>
        )}
      </form>
    </div>
  );
}