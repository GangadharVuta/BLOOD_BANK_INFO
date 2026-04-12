module.exports = {
  apps: [
    {
      name: 'bloodbank-api',
      script: 'server.js',
      cwd: './blood-bank-node',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      
      // Error & Out Logs
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      
      // Restart strategies
      max_memory_restart: '1G',
      max_restarts: 10,
      min_uptime: '10s',
      
      // Shutdown & restart
      kill_timeout: 5000,
      listen_timeout: 10000,
      shutdown_with_message: true,
      
      // Monitoring
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.git'],
      
      // Auto restart on file changes in development
      // watch: ['server.js', 'configs/', 'app/'],
      // ignore_watch: ['node_modules', 'logs'],
      // watch_delay: 1000,
    },
    
    // Optional: Cron job for backups
    {
      name: 'bloodbank-backup',
      script: './scripts/backup.sh',
      cron_restart: '0 2 * * *', // Every night at 2 AM
      autorestart: false,
      max_memory_restart: '500M'
    }
  ],
  
  // Deploy configuration
  deploy: {
    production: {
      user: 'deployment',
      host: 'api.bloodconnect.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-org/blood-bank-api.git',
      path: '/var/www/bloodbank-api',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production'
    }
  }
};
