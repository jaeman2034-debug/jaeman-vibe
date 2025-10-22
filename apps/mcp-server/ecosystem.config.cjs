module.exports = {
  apps: [{
    name: 'yagovibe-mcp-server',
    script: 'dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 7331
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 7331
    },
    // PM2 configuration
    max_memory_restart: '500M',
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    // Logging
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    // Health monitoring
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'dist'],
    // Auto restart on file changes (dev only)
    watch_options: {
      followSymlinks: false
    }
  }]
};
