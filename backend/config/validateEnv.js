/**
 * Environment Variable Validation
 * Validates that all required environment variables are set on startup
 * Prevents the application from starting with missing critical configuration
 */

const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'NODE_ENV',
  'PORT'
];

const recommendedEnvVars = [
  'ALLOWED_ORIGINS',
  'EMAIL_USER',
  'EMAIL_PASSWORD',
  'FRONTEND_URL'
];

const validateEnv = () => {
  console.log('🔍 Validating environment variables...');
  
  const missing = [];
  const missingRecommended = [];
  
  // Check required variables
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });
  
  // Check recommended variables
  recommendedEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missingRecommended.push(varName);
    }
  });
  
  // Fail if required variables are missing
  if (missing.length > 0) {
    console.error('❌ FATAL ERROR: Missing required environment variables:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n📝 Please check your .env file and ensure all required variables are set.');
    console.error('   See backend/.env.example for reference.\n');
    process.exit(1);
  }
  
  // Validate JWT_SECRET length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.error('❌ FATAL ERROR: JWT_SECRET must be at least 32 characters long!');
    console.error(`   Current length: ${process.env.JWT_SECRET.length}`);
    console.error('   Generate a strong secret with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"\n');
    process.exit(1);
  }
  
  // Validate MONGODB_URI format
  if (process.env.MONGODB_URI && !process.env.MONGODB_URI.startsWith('mongodb')) {
    console.error('❌ FATAL ERROR: MONGODB_URI appears to be invalid.');
    console.error('   It should start with "mongodb://" or "mongodb+srv://"\n');
    process.exit(1);
  }
  
  // Warn about missing recommended variables
  if (missingRecommended.length > 0) {
    console.warn('⚠️  WARNING: Missing recommended environment variables:');
    missingRecommended.forEach(varName => {
      console.warn(`   - ${varName}`);
    });
    console.warn('   Some features may not work correctly.\n');
  }
  
  // Validate production-specific requirements
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.ALLOWED_ORIGINS) {
      console.error('❌ FATAL ERROR: ALLOWED_ORIGINS must be set in production!');
      console.error('   This is a critical security requirement for CORS.\n');
      process.exit(1);
    }
    
    if (process.env.ALLOWED_ORIGINS.includes('localhost')) {
      console.warn('⚠️  WARNING: ALLOWED_ORIGINS contains localhost in production mode.');
      console.warn('   This may be a security risk.\n');
    }
  }
  
  console.log('✅ Environment validation passed\n');
};

module.exports = validateEnv;
