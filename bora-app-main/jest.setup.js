jest.mock('expo-constants', () => ({
  expoConfig: {
    hostUri: '192.168.1.100:8081',
  },
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);