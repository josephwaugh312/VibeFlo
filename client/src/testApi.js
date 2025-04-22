// Simple test script to directly test the API endpoint
const testForgotPassword = async () => {
  try {
    console.log('Testing forgot-password endpoint...');
    const response = await fetch('http://localhost:5001/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);

    try {
      const data = await response.json();
      console.log('Response data:', data);
    } catch (e) {
      console.error('Error parsing JSON:', e);
      const text = await response.text();
      console.log('Response text:', text);
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
};

testForgotPassword();

// Export for potential use in browser console
if (typeof window !== 'undefined') {
  window.testForgotPassword = testForgotPassword;
} 