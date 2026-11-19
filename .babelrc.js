module.exports = {
  presets: ['next/babel'],
  plugins: [
    [
      '@stylexjs/babel-plugin',
      {
        dev: process.env.NODE_ENV === 'development',
        debug: false,
        enableDebugDataProp: false,
        runtimeInjection: true,
        unstable_moduleResolution: {
          type: 'commonJS',
          rootDir: '.',
          themeFileExtension: '.stylex.ts',
        },
      },
    ],
  ],
};
