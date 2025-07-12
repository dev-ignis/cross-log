import typescript from 'rollup-plugin-typescript2';

// Main entry point configuration
const mainConfig = {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      exports: 'named',
      sourcemap: true
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true
    },
    {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'UniversalLogger',
      exports: 'named',
      sourcemap: true
    }
  ],
  plugins: [
    typescript({
      typescript: require('typescript'),
      clean: true
    })
  ],
  external: []
};

// Adapter configurations
const adapters = ['edge', 'next', 'node', 'browser'];

const adapterConfigs = adapters.map(adapter => ({
  input: `src/adapters/${adapter}.ts`,
  output: [
    {
      file: `dist/adapters/${adapter}.js`,
      format: 'cjs',
      exports: 'named',
      sourcemap: true
    },
    {
      file: `dist/adapters/${adapter}.esm.js`,
      format: 'esm',
      sourcemap: true
    }
  ],
  plugins: [
    typescript({
      typescript: require('typescript'),
      clean: false // Don't clean on adapter builds
    })
  ],
  external: []
}));

// Export all configurations
export default [mainConfig, ...adapterConfigs];