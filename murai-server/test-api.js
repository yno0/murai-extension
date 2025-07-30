// Test script to verify the detected words API endpoint
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const API_BASE_URL = 'http://localhost:3000/api';

// Test data
const testData = {
  word: 'test-word',
  context: 'This is a test context with the inappropriate word',
  url: 'http://test.com',
  patternType: 'Profanity',
  language: 'English',
  severity: 'medium',
  siteType: 'Website'
};

async function testDetectedWordsAPI() {
  try {
    console.log('Testing detected words API endpoint...');
    
    // First, we need to login to get a token
    console.log('1. Testing login...');
    console.log('Login URL:', `${API_BASE_URL}/auth/login`);
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      console.error('Login failed:', loginResponse.status, await loginResponse.text());
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('Login successful, got token');
    
    // Test the detected words endpoint
    console.log('2. Testing detected words endpoint...');
    const response = await fetch(`${API_BASE_URL}/users/detected-words`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Success! Response:', result);
    } else {
      const errorText = await response.text();
      console.error('❌ Failed! Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testDetectedWordsAPI();
