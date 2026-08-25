import dotenv from 'dotenv'
import app from './app.js'

// Load environment configurations
dotenv.config()

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`==================================================`)
  console.log(`FreelanceHub Server Scaffold Listening on Port: ${PORT}`)
  console.log(`Health Check: http://localhost:${PORT}/api/v1/health`)
  console.log(`==================================================`)
})
