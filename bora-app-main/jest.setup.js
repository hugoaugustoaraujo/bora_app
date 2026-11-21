jest.mock('react-native', () => ({
  Platform: {
    OS: 'web',
  },
}));

jest.mock('expo-constants', () => ({
  expoConfig: {
    hostUri: '192.168.1.100:8081',
  },
}));