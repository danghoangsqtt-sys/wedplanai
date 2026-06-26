import { generateLocalMarketReport } from './services/localMarketService';
import { UserProfile } from './types';

// Mock import.meta
(global as any).import = { meta: { env: { VITE_GEMINI_API_KEY: process.env.VITE_GEMINI_API_KEY } } };

const mockUser: UserProfile = {
  uid: 'test-user',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: '',
  role: 'USER',
  isActive: true,
  allowCustomApiKey: false,
  enableCloudStorage: true
};

async function test() {
  try {
    console.log('Testing generateLocalMarketReport...');
    const result = await generateLocalMarketReport(
      'Hà Nội',
      ['gold'], // Just one category to test
      mockUser
    );
    console.log('Success:', JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error('Error occurred:');
    console.error(error.message);
    if (error.stack) console.error(error.stack);
  }
}

test();
