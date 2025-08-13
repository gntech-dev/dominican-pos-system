// PM2 Ecosystem Configuration for POS Dominicana
module.exports = {
  apps: [
    {
      name: 'pos-dominicana',
      script: './node_modules/.bin/next',
      args: 'start',
      cwd: './',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      
      // Restart configuration
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10,
      
      // Logging
      log_file: './logs/pos-dominicana.log',
      error_file: './logs/pos-dominicana-error.log',
      out_file: './logs/pos-dominicana-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Monitoring
      autorestart: true,
      watch: false, // Don't watch files in production
      ignore_watch: ['node_modules', 'logs', 'uploads'],
      
      // Health monitoring
      kill_timeout: 5000,
      listen_timeout: 8000,
      
      // Environment-specific configurations
      env_variables: {
        TZ: 'America/Santo_Domingo'
      }
    },
    
    // Background job processor (if needed)
    {
      name: 'pos-dominicana-jobs',
      script: './scripts/job-processor.js',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        JOB_TYPE: 'background'
      },
      
      // Restart configuration
      max_memory_restart: '500M',
      restart_delay: 10000,
      max_restarts: 5,
      
      // Logging
      log_file: './logs/pos-jobs.log',
      error_file: './logs/pos-jobs-error.log',
      out_file: './logs/pos-jobs-out.log',
      merge_logs: true,
      
      // Cron restart (restart daily at 3 AM)
      cron_restart: '0 3 * * *',
      autorestart: true,
      watch: false
    }
  ],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'pos',
      host: ['your-server.com'],
      port: '22',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/pos-dominicana.git',
      path: '/var/www/pos-dominicana',
      'pre-deploy': 'git fetch --all',
      'post-deploy': 'npm ci --only=production && npx prisma migrate deploy && npx prisma generate && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'ls -la'
    },
    
    staging: {
      user: 'pos',
      host: ['staging-server.com'],
      port: '22',
      ref: 'origin/develop',
      repo: 'git@github.com:yourusername/pos-dominicana.git',
      path: '/var/www/pos-dominicana-staging',
      'post-deploy': 'npm ci && npx prisma migrate deploy && npx prisma generate && npm run build && pm2 reload ecosystem.config.js --env staging'
    }
  }
}
