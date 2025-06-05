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
    '!src/**/*.d.ts',
    '!src/**/__tests__/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
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