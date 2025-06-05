module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  globals: {
    'ts-jest': {
      tsconfig: {
        target: 'ES2018',
        module: 'commonjs',
        lib: ['ES2018', 'DOM'],
        strict: true,
        moduleResolution: 'node',
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        types: ['node', 'jest']
      }
    }
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  projects: [
    {
      displayName: 'unit-tests',
      testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
      testEnvironment: 'node',
      preset: 'ts-jest',
      transform: {
        '^.+\\.ts$': 'ts-jest'
      },
      globals: {
        'ts-jest': {
          tsconfig: {
            target: 'ES2018',
            module: 'commonjs',
            lib: ['ES2018', 'DOM'],
            strict: true,
            moduleResolution: 'node',
            allowSyntheticDefaultImports: true,
            esModuleInterop: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true,
            resolveJsonModule: true,
            types: ['node', 'jest']
          }
        }
      }
    },
    {
      displayName: 'integration-tests',
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
      testEnvironment: 'node',
      preset: 'ts-jest',
      transform: {
        '^.+\\.ts$': 'ts-jest'
      },
      globals: {
        'ts-jest': {
          tsconfig: {
            target: 'ES2018',
            module: 'commonjs',
            lib: ['ES2018', 'DOM'],
            strict: true,
            moduleResolution: 'node',
            allowSyntheticDefaultImports: true,
            esModuleInterop: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true,
            resolveJsonModule: true,
            types: ['node', 'jest']
          }
        }
      }
    }
  ]
};