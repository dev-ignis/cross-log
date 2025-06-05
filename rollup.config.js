import typescript from 'rollup-plugin-typescript2';

export default {
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