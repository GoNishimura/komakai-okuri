// config-overrides.js
module.exports = function override(config, env) {
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'javascript/auto',
      use: ['file-loader'],
    });
  
    return config;
  };
  