// Server file to run cron jobs alongside Next.js
// This would typically run in a separate process or container

import 'dotenv/config'
// import { setupCronJobs } from './lib/cron'

console.log('Starting cron server...')
// setupCronJobs()

console.log('Cron server running. Press Ctrl+C to stop.')

// Keep the process alive
process.on('SIGINT', () => {
  console.log('\nStopping cron server...')
  process.exit(0)
})
