/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  verbose: true,
  clearMocks: true,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(?:.pnpm/)?((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|nativewind|react-native-css-interop|@tanstack|zustand|react-native-mmkv|lucide-react-native|class-variance-authority|clsx|tailwind-merge))',
  ],
};
