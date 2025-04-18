import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../services/api';
import { Track } from '../components/music/MusicPlayer';

interface Playlist {
  id: number;
  name: string;
  description?: string;
  user_id: number;
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

  // Fetch playlists on component mount
  useEffect(() => {
    const fetchPlaylists = async () => {
      setIsLoading(true);
      try {
        console.log('Fetching user playlists...');
        const data = await apiService.playlists.getUserPlaylists();
        console.log('Received playlists:', data);
        setPlaylists(data);
        setError('');
      } catch (err: any) {
        console.error('Error in fetchPlaylists:', err);
        if (err.response?.status === 500) {
          setError('Server error: Please try again later');
        } else {
          setError(err.response?.data?.message || 'Failed to load playlists');
        }
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
        [] as Track[]
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

  const handleDeletePlaylist = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this playlist?')) {
      return;
    }

    try {
      // Convert the number ID to string for the API
      await apiService.playlists.deletePlaylist(id.toString());
      setPlaylists(playlists.filter(playlist => playlist.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete playlist');
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map((playlist) => (
            <div key={playlist.id} className="bg-gray-800 bg-opacity-80 rounded-lg shadow-lg overflow-hidden">
              <div className="p-5">
                <h2 className="text-xl font-semibold text-white mb-2">{playlist.name}</h2>
                {playlist.description && <p className="text-white/80 mb-4">{playlist.description}</p>}
                <div className="flex justify-between items-center">
                  <Link
                    to={`/playlist/${playlist.id}`}
                    className="text-purple-300 hover:text-white font-medium"
                    aria-label={`View songs in ${playlist.name}`}
                    onClick={(e) => {
                      // Ensure the ID is a valid number before navigating
                      if (isNaN(Number(playlist.id))) {
                        e.preventDefault();
                        console.error('Invalid playlist ID:', playlist.id);
                        setError('Invalid playlist ID');
                      } else {
                        console.log('Navigating to playlist:', playlist.id, 'Type:', typeof playlist.id);
                      }
                    }}
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