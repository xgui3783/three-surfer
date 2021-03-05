import serve from 'rollup-plugin-serve'
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs'
import { terser } from "rollup-plugin-terser"

const isProduction = process.env.NDOE_ENV === 'production'
export default {
  input: "src/main.ts",
  output: {
    file: "dist/bundle.js",
    format:"umd",
    name: 'ThreeSurfer'
  },
  watch: {
    include: [
      'src/**/*'
    ]
  },
  plugins: [
    (!isProduction) && serve('dist'),
    typescript({lib: ["es5", "es6", "dom"], target: "es5"}),
    commonjs(),
    isProduction && terser()
  ]
}