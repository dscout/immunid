
module.exports = function(config) {
  config.set({

    basePath: '',

    frameworks: ['browserify', 'mocha', 'chai-sinon'],

    files: [
      'test/**/*.js'
    ],

    exclude: [],

    client: {
      mocha: {
        ui: 'bdd'
      }
    },

    browserify: {
      debug: true
    },

    preprocessors: {
      'test/**/*.js': ['browserify']
    },

    reporters: ['progress'],

    port: 9876,

    colors: true,

    logLevel: config.LOG_INFO,

    autoWatch: true,

    browsers: ['Firefox'],

    singleRun: false
  });
};
