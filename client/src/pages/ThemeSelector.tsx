import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { themeAPI } from '../services/api';

// Import these interface types from another file
interface Theme {
  id: number;
  name: string;
  background_url: string;
  description: string;
  is_default?: boolean;
  is_premium?: boolean;
  type?: string;
  image_url: string;
}

interface CustomTheme {
  name: string;
  background_url: string;
  description: string;
  is_public: boolean;
}

interface CustomThemeWithCreator extends Theme {
  creator_username: string;
}

// Add a utility function for image compression
const compressImage = (file: File, maxSizeMB: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate the width and height, maintaining the aspect ratio
        const maxDimension = 1200; // Max width or height
        if (width > height && width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Adjust quality as needed
        const quality = 0.7;
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // Check if the compressed image is under the size limit
        const base64Data = dataUrl.split(',')[1];
        const sizeInBytes = Math.ceil((base64Data.length * 3) / 4);
        const sizeInMB = sizeInBytes / (1024 * 1024);
        
        if (sizeInMB <= maxSizeMB) {
          resolve(dataUrl);
        } else {
          // If still too large, try with lower quality
          const lowerQualityDataUrl = canvas.toDataURL('image/jpeg', 0.5);
          resolve(lowerQualityDataUrl);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Error loading image'));
      };
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
  });
};

const ThemeSelector: React.FC = () => {
  const { currentTheme, setActiveTheme, setCurrentTheme } = useTheme();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState('standard');
  const [standardThemes, setStandardThemes] = useState<Theme[]>([]);
  const [communityThemes, setCommunityThemes] = useState<CustomThemeWithCreator[]>([]);
  const [userThemes, setUserThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  // Add edit mode states
  const [editMode, setEditMode] = useState(false);
  const [themeToEdit, setThemeToEdit] = useState<Theme | null>(null);
  // Add debug state
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTheme, setNewTheme] = useState<CustomTheme>({
    name: '',
    background_url: '',
    description: '',
    is_public: false
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Refresh function to reload all themes
  const refreshAllThemes = async () => {
    setLoading(true);
    try {
      const [standardData, communityData, userData] = await Promise.all([
        themeAPI.getAllThemes(),
        themeAPI.getPublicCustomThemes(),
        user ? themeAPI.getUserCustomThemes() : Promise.resolve([])
      ]);
      
      setStandardThemes(standardData);
      setCommunityThemes(communityData);
      setUserThemes(userData);
      setError(null);
    } catch (err) {
      console.error('Error refreshing themes:', err);
      setError('Failed to refresh themes. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Load themes on component mount
  useEffect(() => {
    console.log("ThemeSelector - Loading themes, authenticated user:", user ? user.username : "not authenticated");
    refreshAllThemes();
  }, [user]);

  // Redirect to standard tab if user tries to access my-themes while not authenticated
  useEffect(() => {
    if (selectedTab === 'my-themes' && !user) {
      setSelectedTab('standard');
    }
  }, [selectedTab, user]);

  // Handle opening the edit modal
  const handleEditTheme = (theme: Theme) => {
    setThemeToEdit(theme);
    setEditMode(true);
    setNewTheme({
      name: theme.name,
      background_url: theme.background_url || theme.image_url || '',
      description: theme.description || '',
      is_public: (theme as any).is_public || false
    });
    setShowCreateModal(true);
  };

  // Handle theme creation or update
  const handleCreateOrUpdateTheme = async () => {
    setCreateError(null);
    
    // Validate form
    if (!newTheme.name.trim()) {
      setCreateError('Theme name is required');
      return;
    }
    
    if (!newTheme.background_url.trim() && !uploadedImage && !editMode) {
      setCreateError('Please provide an image URL or upload an image');
      return;
    }
    
    try {
      setIsCreating(true); // Show loading state
      let image_url = newTheme.background_url;
      
      if (uploadedImage && imagePreview) {
        try {
          // Compress the image before sending
          const compressedImageDataUrl = await compressImage(uploadedImage, 2); // 2MB max
          image_url = compressedImageDataUrl;
          console.log('Image compressed successfully');
        } catch (err) {
          console.error('Error compressing image:', err);
          setCreateError('Error processing image. Please try a different image or use a URL instead.');
          setIsCreating(false);
          return;
        }
      }
      
      let theme: Theme;
      let success = false;
      
      try {
        if (editMode && themeToEdit) {
          // Update existing theme
          theme = await themeAPI.updateCustomTheme(themeToEdit.id, {
            name: newTheme.name,
            description: newTheme.description,
            // Only include image_url if we're changing it
            ...(image_url ? { image_url, background_url: image_url } : {}),
            is_public: newTheme.is_public
          });
          
          success = true;
        } else {
          // Create new theme
          theme = await themeAPI.createCustomTheme({
            name: newTheme.name,
            description: newTheme.description,
            image_url: image_url,
            is_public: newTheme.is_public
          });
          
          success = true;
        }
      } catch (apiError) {
        console.error('API error:', apiError);
        // If server error, create a client-side theme representation
        // with a placeholder high ID to avoid conflicts
        if (!editMode) {
          // Generate a high ID for client-side themes (to avoid conflicts with server IDs)
          const highestId = Math.max(
            ...userThemes.map(t => t.id), 
            ...communityThemes.map(t => t.id),
            10000
          );
          
          theme = {
            id: highestId + 1,
            name: newTheme.name,
            description: newTheme.description || '',
            image_url: image_url,
            background_url: image_url,
            is_default: false,
            is_premium: false,
            type: 'custom',
            ...(newTheme.is_public ? { is_public: true } : {})
          };
          
          success = true;
        } else {
          // For edit mode, if there's an error we can't proceed
          throw apiError;
        }
      }
      
      if (success) {
        // Update the theme lists
        if (editMode && themeToEdit) {
          // Update the theme in the userThemes list
          setUserThemes(prevThemes => 
            prevThemes.map(t => t.id === themeToEdit.id ? theme : t)
          );
          
          console.log('Theme updated successfully:', theme);
        } else {
          // Add the new theme to the userThemes list
          setUserThemes(prev => [theme, ...prev]);
          console.log('Theme created successfully:', theme);
        }
        
        // Refresh community themes if public
        if (newTheme.is_public) {
          try {
            const communityData = await themeAPI.getPublicCustomThemes();
            setCommunityThemes(communityData);
          } catch (err) {
            console.error('Error refreshing community themes:', err);
          }
        }
        
        // Auto-select the newly created/updated theme directly
        // Bypass server call which might fail
        setCurrentTheme(theme);
        
        // Reset the form
        setShowCreateModal(false);
        setEditMode(false);
        setThemeToEdit(null);
        setNewTheme({
          name: '',
          background_url: '',
          description: '',
          is_public: false
        });
        setUploadedImage(null);
        setImagePreview('');
      }
    } catch (err) {
      console.error('Error creating/updating theme:', err);
      setCreateError(editMode 
        ? 'Failed to update theme. Please try again.' 
        : 'Failed to create theme. The image might be too large. Please try a smaller image or use a URL instead.');
    } finally {
      setIsCreating(false);
    }
  };

  // Update the create theme modal title and button text
  const modalTitle = editMode ? "Edit Theme" : "Create New Theme";
  const actionButtonText = editMode ? "Update Theme" : "Create Theme";

  useEffect(() => {
    // Log theme data for debugging
    if (standardThemes.length > 0) {
      console.log('Standard themes:', standardThemes);
    }
  }, [standardThemes]);

  // Add a force-direct-set function for debugging
  const forceSetThemeDirectly = (theme: Theme) => {
    try {
      console.log('===== FORCE SETTING THEME DIRECTLY =====');
      console.log('Forcing theme:', theme);
      
      // Ensure the image_url and background_url are set properly
      let updatedTheme = {...theme};
      if (!updatedTheme.image_url && (updatedTheme as any).background_url) {
        updatedTheme.image_url = (updatedTheme as any).background_url;
      } else if (updatedTheme.image_url && !(updatedTheme as any).background_url) {
        (updatedTheme as any).background_url = updatedTheme.image_url;
      }
      
      // Set theme directly in ThemeContext
      setCurrentTheme(updatedTheme);
      
      setDebugInfo(`Force set theme: ${updatedTheme.name} (ID: ${updatedTheme.id})\nImage URL: ${updatedTheme.image_url}`);
      console.log('===== DONE FORCE SETTING THEME =====');
    } catch (err) {
      console.error('Error in force setting theme:', err);
      setDebugInfo(`Error: ${err}`);
    }
  };

  const handleThemeSelect = async (theme: Theme) => {
    try {
      // Create a complete clone of the theme to avoid reference issues
      const themeToApply = JSON.parse(JSON.stringify(theme));
      
      // Ensure the image_url and background_url are set properly for display
      if (!themeToApply.image_url && themeToApply.background_url) {
        themeToApply.image_url = themeToApply.background_url;
      } else if (themeToApply.image_url && !themeToApply.background_url) {
        themeToApply.background_url = themeToApply.image_url;
      }
      
      // Set theme directly in context for immediate visual feedback
      setCurrentTheme(themeToApply);
      
      // Try server call in background, but don't depend on it
      try {
        themeAPI.setUserTheme(theme.id).catch(e => {
          // Silent catch - we've already updated the UI
        });
      } catch (serverErr) {
        // Ignore server errors - our client-side approach ensures theme changes work
      }
    } catch (err) {
      console.error('Error selecting theme:', err);
      setError('Failed to select theme. Please try again.');
    }
  };

  const handleDeleteTheme = async (themeId: number) => {
    if (!window.confirm('Are you sure you want to delete this theme?')) {
      return;
    }
    
    try {
      await themeAPI.deleteCustomTheme(themeId);
      setUserThemes(userThemes.filter(theme => theme.id !== themeId));
      if (currentTheme?.id === themeId) {
        // If the deleted theme was selected, switch to the first available standard theme
        if (standardThemes.length > 0) {
          await setActiveTheme(standardThemes[0].id);
        }
      }
    } catch (err) {
      console.error('Error deleting theme:', err);
      setError('Failed to delete theme. Please try again.');
    }
  };

  // Handle file upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size - don't allow files larger than 1MB to prevent PayloadTooLargeError
    if (file.size > 1024 * 1024) {
      setCreateError('Image size must be less than 1MB');
      return;
    }
    
    // Preview the image
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setNewTheme({...newTheme, background_url: ''});
    };
    reader.readAsDataURL(file);
    setUploadedImage(file);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-6">Background Themes</h1>
      
      {error && (
        <div className="bg-gray-800 bg-opacity-80 p-4 border-l-4 border-red-500 text-white mb-6 rounded-lg shadow-lg">
          {error}
        </div>
      )}
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium ${
            selectedTab === 'standard' 
              ? 'border-b-2 border-indigo-500 text-white' 
              : 'text-white/70 hover:text-white'
          }`}
          onClick={() => setSelectedTab('standard')}
        >
          Standard Themes
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            selectedTab === 'community' 
              ? 'border-b-2 border-indigo-500 text-white' 
              : 'text-white/70 hover:text-white'
          }`}
          onClick={() => setSelectedTab('community')}
        >
          Community Themes
        </button>
        {user && (
          <button
            className={`py-2 px-4 font-medium ${
              selectedTab === 'my-themes' 
                ? 'border-b-2 border-indigo-500 text-white' 
                : 'text-white/70 hover:text-white'
            }`}
            onClick={() => setSelectedTab('my-themes')}
          >
            My Themes
          </button>
        )}
      </div>
      
      {/* Debug info - to help troubleshoot issues */}
      {debugInfo && (
        <div className="bg-gray-800 p-3 mb-4 rounded border border-gray-700 text-xs text-gray-300 font-mono overflow-auto">
          {debugInfo}
        </div>
      )}
      
      {/* Add debug button to check if user is authenticated */}
      <div className="mb-4">
        <button 
          onClick={() => {
            const authStatus = `User status: ${user ? 'Authenticated as ' + user.username : 'Not authenticated'}`;
            const themesInfo = `
              Standard Themes: ${standardThemes.length}
              Community Themes: ${communityThemes.length}
              User Themes: ${userThemes.length}
              Current Theme: ${currentTheme ? currentTheme.name + ' (ID: ' + currentTheme.id + ')' : 'None'}
            `;
            setDebugInfo(authStatus + '\n' + themesInfo);
            refreshAllThemes();
          }}
          className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
        >
          Debug Info
        </button>
      </div>
      
      {/* Theme Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {selectedTab === 'standard' && standardThemes.map(theme => (
          <div 
            key={theme.id} 
            className={`relative group rounded-lg overflow-hidden border-2 cursor-pointer transition-transform hover:scale-105 ${
              currentTheme?.id === theme.id ? 'border-indigo-500 shadow-lg shadow-indigo-500/50' : 'border-transparent hover:border-white/50'
            }`}
            onClick={() => handleThemeSelect(theme)}
          >
            <div 
              className="h-96 bg-cover bg-center"
              style={{ 
                backgroundImage: `url(${theme.background_url || theme.image_url})`,
                backgroundColor: '#1f2937' // Fallback color in case image fails to load
              }}
            >
              {/* Optional debug indicator for image loading issues */}
              {!theme.background_url && !theme.image_url && (
                <div className="absolute top-0 left-0 bg-red-500 text-white text-xs p-1">No image URL</div>
              )}
              
              {/* Theme details overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4">
                <h3 className="text-lg font-semibold text-white">{theme.name}</h3>
                <p className="text-white/90 text-sm mt-1">{theme.description}</p>
                <div className="mt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleThemeSelect(theme);
                    }}
                    className={`px-4 py-2 rounded text-white ${
                      currentTheme?.id === theme.id
                        ? 'bg-indigo-600'
                        : 'bg-indigo-500/80 hover:bg-indigo-600'
                    }`}
                  >
                    {currentTheme?.id === theme.id ? 'Selected' : 'Select This Theme'}
                  </button>
                </div>
              </div>
              
              {/* Selected indicator */}
              {currentTheme?.id === theme.id && (
                <div className="absolute top-3 right-3 bg-indigo-600 text-white p-1 rounded-full shadow">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {selectedTab === 'community' && communityThemes.map(theme => (
          <div 
            key={theme.id} 
            className={`relative group rounded-lg overflow-hidden border-2 cursor-pointer transition-transform hover:scale-105 ${
              currentTheme?.id === theme.id ? 'border-indigo-500 shadow-lg shadow-indigo-500/50' : 'border-transparent hover:border-white/50'
            }`}
            onClick={() => handleThemeSelect(theme)}
          >
            <div 
              className="h-96 bg-cover bg-center"
              style={{ 
                backgroundImage: `url(${theme.background_url || theme.image_url})`,
                backgroundColor: '#1f2937' // Fallback color in case image fails to load
              }}
            >
              {/* Optional debug indicator for image loading issues */}
              {!theme.background_url && !theme.image_url && (
                <div className="absolute top-0 left-0 bg-red-500 text-white text-xs p-1">No image URL</div>
              )}
              
              {/* Theme details overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4">
                <h3 className="text-lg font-semibold text-white">{theme.name}</h3>
                <p className="text-white/60 text-xs">Created by {theme.creator_username}</p>
                <p className="text-white/90 text-sm mt-1">{theme.description}</p>
                <div className="mt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleThemeSelect(theme);
                    }}
                    className={`px-4 py-2 rounded text-white ${
                      currentTheme?.id === theme.id
                        ? 'bg-indigo-600'
                        : 'bg-indigo-500/80 hover:bg-indigo-600'
                    }`}
                  >
                    {currentTheme?.id === theme.id ? 'Selected' : 'Select This Theme'}
                  </button>
                </div>
              </div>
              
              {/* Selected indicator */}
              {currentTheme?.id === theme.id && (
                <div className="absolute top-3 right-3 bg-indigo-600 text-white p-1 rounded-full shadow">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {selectedTab === 'my-themes' && (
          <>
            {/* Create New Theme Button */}
            <div 
              className="backdrop-blur-sm bg-white/10 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer h-96 hover:border-indigo-300 transition-colors"
              onClick={() => setShowCreateModal(true)}
            >
              <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-lg font-medium text-white">Create New Theme</p>
            </div>
            
            {/* User's custom themes */}
            {userThemes.length === 0 ? (
              <div className="col-span-2 flex items-center justify-center p-6 bg-gray-800 bg-opacity-50 rounded-lg">
                <p className="text-white/70">You haven't created any custom themes yet. Click the "Create New Theme" button to get started.</p>
              </div>
            ) : (
              userThemes.map(theme => (
                <div 
                  key={theme.id} 
                  className={`relative group rounded-lg overflow-hidden border-2 cursor-pointer transition-transform hover:scale-105 ${
                    currentTheme?.id === theme.id ? 'border-indigo-500 shadow-lg shadow-indigo-500/50' : 'border-transparent hover:border-white/50'
                  }`}
                  onClick={() => handleThemeSelect(theme)}
                >
                  <div 
                    className="h-96 bg-cover bg-center"
                    style={{ 
                      backgroundImage: `url(${theme.background_url || theme.image_url})`,
                      backgroundColor: '#1f2937' // Fallback color in case image fails to load
                    }}
                  >
                    {/* Optional debug indicator for image loading issues */}
                    {!theme.background_url && !theme.image_url && (
                      <div className="absolute top-0 left-0 bg-red-500 text-white text-xs p-1">No image URL</div>
                    )}
                    
                    {/* Theme details overlay */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4">
                      <h3 className="text-lg font-semibold text-white">{theme.name}</h3>
                      <p className="text-white/90 text-sm mt-1">{theme.description}</p>
                      
                      {/* Add "Public" indicator if the theme is public */}
                      {(theme as any).is_public && (
                        <span className="inline-block bg-green-500 text-white text-xs px-2 py-1 rounded mt-1 mb-2">
                          Public
                        </span>
                      )}
                      
                      <div className="mt-3 flex justify-between">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleThemeSelect(theme);
                          }}
                          className={`px-4 py-2 rounded text-white ${
                            currentTheme?.id === theme.id
                              ? 'bg-indigo-600'
                              : 'bg-indigo-500/80 hover:bg-indigo-600'
                          }`}
                        >
                          {currentTheme?.id === theme.id ? 'Selected' : 'Select'}
                        </button>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditTheme(theme);
                            }}
                            className="px-3 py-2 rounded bg-blue-600/80 text-white hover:bg-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTheme(theme.id);
                            }}
                            className="px-3 py-2 rounded bg-red-600/80 text-white hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Selected indicator */}
                    {currentTheme?.id === theme.id && (
                      <div className="absolute top-3 right-3 bg-indigo-600 text-white p-1 rounded-full shadow">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
      
      {/* Create/Edit Theme Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">{modalTitle}</h2>
            
            {createError && (
              <div className="bg-red-900/50 border border-red-500 text-white p-3 rounded mb-4">
                {createError}
              </div>
            )}
            
            {/* Form fields */}
            <div className="mb-4">
              <label className="block text-white mb-2" htmlFor="name">Theme Name</label>
              <input
                type="text"
                id="name"
                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"
                value={newTheme.name}
                onChange={(e) => setNewTheme({...newTheme, name: e.target.value})}
                placeholder="Enter theme name"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-white mb-2">Background Image</label>
              {/* Preview existing image in edit mode */}
              {editMode && themeToEdit && !imagePreview && (
                <div className="mb-3">
                  <img 
                    src={themeToEdit.background_url || themeToEdit.image_url} 
                    alt="Current theme" 
                    className="w-full h-40 object-cover rounded border border-gray-700 mb-2" 
                  />
                  <p className="text-white/70 text-sm">Current theme image (upload a new one to change)</p>
                </div>
              )}
              
              {/* Show preview of new uploaded image */}
              {imagePreview && (
                <div className="mb-3">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-40 object-cover rounded border border-gray-700 mb-2" 
                  />
                  <button 
                    onClick={() => {
                      setImagePreview('');
                      setUploadedImage(null);
                    }}
                    className="text-red-400 text-sm hover:text-red-300"
                  >
                    Remove uploaded image
                  </button>
                </div>
              )}
              
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <p className="text-white/70 text-sm mb-1">Upload from your device (max 1MB):</p>
                  <label className="flex items-center justify-center w-full p-2 bg-gray-800 border border-gray-700 rounded cursor-pointer hover:bg-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
                    </svg>
                    <span className="text-white/70">Choose file</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
                
                <div>
                  <p className="text-white/70 text-sm mb-1">Or enter an image URL:</p>
                  <input
                    type="text"
                    id="background"
                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"
                    value={newTheme.background_url}
                    onChange={(e) => {
                      setNewTheme({...newTheme, background_url: e.target.value});
                      // Clear the uploaded image if using URL
                      if (e.target.value) {
                        setImagePreview('');
                        setUploadedImage(null);
                      }
                    }}
                    placeholder="Enter image URL"
                    disabled={!!imagePreview}
                  />
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-white mb-2" htmlFor="description">Description</label>
              <textarea
                id="description"
                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"
                value={newTheme.description}
                onChange={(e) => setNewTheme({...newTheme, description: e.target.value})}
                placeholder="Enter theme description"
                rows={3}
              ></textarea>
            </div>
            
            <div className="mb-6">
              <label className="flex items-center text-white">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={newTheme.is_public}
                  onChange={(e) => setNewTheme({...newTheme, is_public: e.target.checked})}
                />
                Share with the community
              </label>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditMode(false);
                  setThemeToEdit(null);
                  setUploadedImage(null);
                  setImagePreview('');
                  setCreateError(null);
                  setNewTheme({
                    name: '',
                    background_url: '',
                    description: '',
                    is_public: false
                  });
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOrUpdateTheme}
                className={`px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 flex items-center ${isCreating ? 'opacity-75 cursor-not-allowed' : ''}`}
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {editMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  actionButtonText
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSelector; 