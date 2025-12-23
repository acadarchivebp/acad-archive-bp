'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase';
import { ThumbsUp, Flag, Check, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  resourceId: string;
  initialUpvotes: number;
  uploaderEmail?: string; // We need to know who owns this file
}

export default function ResourceActions({ resourceId, initialUpvotes, uploaderEmail }: Props) {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [hasVoted, setHasVoted] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  
  const supabase = createClient();
  const router = useRouter();

  // Check who is looking at the screen
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setCurrentUserEmail(user.email);
      }
    };
    checkUser();
  }, []);

  const handleAction = async (action: 'upvote' | 'report') => {
    // ... (Same voting logic as before) ...
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert('Please login first.');

    if (action === 'upvote') {
        if (hasVoted) return;
        setUpvotes(p => p + 1);
        setHasVoted(true);
    } else {
        if (hasReported) return;
        setHasReported(true);
        alert('Reported. Thanks for helping.');
    }

    await supabase.from('interactions').insert({
      user_email: user.email,
      resource_id: resourceId,
      action_type: action
    });
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure? This cannot be undone.')) return;

    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', resourceId);

    if (error) {
      alert('Error: Could not delete. ' + error.message);
    } else {
      // Refresh the page to show it's gone
      router.refresh();
    }
  };

  // Is the viewer the owner?
  const isOwner = currentUserEmail && uploaderEmail && currentUserEmail === uploaderEmail;

  return (
    <div className="flex items-center gap-2">
      {/* Delete Button (Only visible to Owner) */}
      {isOwner && (
        <button
          onClick={handleDelete}
          className="p-1 mr-2 text-gray-400 hover:text-red-600 transition-colors bg-red-50 hover:bg-red-100 rounded"
          title="Delete your file"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Upvote Button */}
      <button 
        onClick={() => handleAction('upvote')}
        disabled={hasVoted}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
          hasVoted 
            ? 'bg-green-100 text-green-700 cursor-default' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
        }`}
      >
        {hasVoted ? <Check className="w-3 h-3" /> : <ThumbsUp className="w-3 h-3" />}
        <span>{upvotes || 0}</span>
      </button>

      {/* Report Button */}
      {!hasReported && !isOwner && (
        <button 
          onClick={() => {
            if(confirm('Report this file?')) handleAction('report');
          }}
          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
        >
          <Flag className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}