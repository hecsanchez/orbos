export default {
  testRunner: {
    args: { config: 'e2e/ipad-e2e/jest.config.ts' },
    jest: { setupTimeout: 120000 },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath:
        'apps/ipad/ios/build/Build/Products/Debug-iphonesimulator/Orbos.app',
      build:
        'cd apps/ipad && npx expo run:ios --configuration Debug',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: { type: 'iPad Pro (12.9-inch) (6th generation)' },
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
  },
};
