import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../services/api';
import { Track } from '../components/music/MusicPlayer';
import toast from 'react-hot-toast';

interface Playlist {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  created_at: string;
}

const Playlists: React.FC = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch playlists on component mount
  useEffect(() => {
    const fetchPlaylists = async () => {
      setIsLoading(true);
      try {
        console.log('Fetching user playlists...');
        const data = await apiService.playlists.getUserPlaylists();
        console.log('Received playlists:', data);
        
        // Debug the data type
        console.log('Playlists data type:', typeof data);
        console.log('Is array?', Array.isArray(data));
        
        // Only set playlists if data is an array
        if (Array.isArray(data)) {
          setPlaylists(data);
          setError('');
        } else {
          console.error('Playlist data is not an array:', data);
          // If we got HTML instead of JSON, likely an API URL issue
          if (typeof data === 'string' && data.includes('<!doctype html>')) {
            setError('API error: Received HTML instead of playlist data. Please reload the page.');
            console.error('Received HTML instead of playlist data');
          } else {
            setError('Invalid response format from server');
          }
          setPlaylists([]);
        }
      } catch (err: any) {
        console.error('Error in fetchPlaylists:', err);
        if (err.response?.status === 500) {
          setError('Server error: Please try again later');
        } else {
          setError(err.response?.data?.message || 'Failed to load playlists');
        }
        setPlaylists([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPlaylists();
  }, []);

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    // Clear any previous validation errors
    setValidationError('');
    
    if (!newPlaylistName.trim()) {
      setValidationError('Playlist name is required');
      return;
    }
    
    setIsCreating(true);
    try {
      // Create a playlist with empty tracks array
      const newPlaylist = await apiService.playlists.createPlaylist(
        newPlaylistName.trim(), 
        [] as Track[],
        newPlaylistDescription.trim() || undefined
      );
      
      setPlaylists([...playlists, newPlaylist]);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      setShowCreateForm(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create playlist');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeletePlaylist = async (id: string | number) => {
    if (!id) return;
    
    try {
      setIsDeleting(true);
      
      // Confirm deletion with the user
      const confirmed = window.confirm('Are you sure you want to delete this playlist?');
      
      if (!confirmed) {
        setIsDeleting(false);
        return;
      }
      
      // Delete the playlist
      await apiService.playlists.deletePlaylist(String(id));
      
      // Remove from local state
      setPlaylists(playlists.filter(p => p.id !== id));
      
      // Show success message
      toast.success('Playlist deleted successfully');
    } catch (error) {
      console.error('Error deleting playlist:', error);
      setError('Failed to delete playlist');
      
      // Show error message
      toast.error('Failed to delete playlist');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading && playlists.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-6">Your Playlists</h1>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white drop-shadow-lg">Your Playlists</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
        >
          {showCreateForm ? 'Cancel' : 'Create Playlist'}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/70 border border-red-500 text-white px-4 py-3 rounded-lg shadow-lg relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {showCreateForm && (
        <div className="bg-gray-800 bg-opacity-80 p-4 rounded-lg shadow-lg mb-6">
          <h2 className="text-xl font-semibold text-white mb-3">Create New Playlist</h2>
          <form onSubmit={handleCreatePlaylist}>
            <div className="mb-4">
              <label className="block text-white text-sm font-bold mb-2" htmlFor="playlist-name">
                Playlist Name *
              </label>
              <input
                id="playlist-name"
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="shadow appearance-none border bg-gray-700 rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline focus:border-purple-500"
                required
              />
              {validationError && (
                <p className="text-red-500 text-xs italic mt-1">{validationError}</p>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-white text-sm font-bold mb-2" htmlFor="playlist-description">
                Description (Optional)
              </label>
              <textarea
                id="playlist-description"
                value={newPlaylistDescription}
                onChange={(e) => setNewPlaylistDescription(e.target.value)}
                className="shadow appearance-none border bg-gray-700 rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline focus:border-purple-500"
                rows={3}
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isCreating}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
              >
                {isCreating ? 'Creating...' : 'Create Playlist'}
              </button>
            </div>
          </form>
        </div>
      )}

      {playlists.length === 0 ? (
        <div className="bg-gray-800 bg-opacity-80 p-6 rounded-lg shadow-lg text-center">
          <p className="text-white">You don't have any playlists yet.</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
          >
            Create Your First Playlist
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-5">
          {playlists.map((playlist) => (
            <div key={playlist.id} className="bg-gray-800 bg-opacity-80 rounded-lg shadow-lg overflow-hidden w-[300px] h-[220px]">
              <div className="p-5 flex flex-col h-full">
                <h2 className="text-xl font-semibold text-white mb-3 line-clamp-1">{playlist.name}</h2>
                {playlist.description && <p className="text-white/80 mb-4 text-sm line-clamp-2 flex-grow">{playlist.description}</p>}
                <div className="flex justify-between items-center mt-auto w-full">
                  <Link
                    to={`/playlist/${playlist.id}`}
                    className="text-blue-300 hover:text-blue-100 font-medium"
                    data-cy="view-songs-button"
                  >
                    View Songs
                  </Link>
                  <button
                    onClick={() => handleDeletePlaylist(playlist.id)}
                    className="text-red-300 hover:text-red-100 font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Playlists; 