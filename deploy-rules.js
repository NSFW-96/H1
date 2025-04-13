// A script to help deploy Firestore rules

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Preparing to deploy Firestore rules...');

// Check if Firebase CLI is installed
exec('firebase --version', (error) => {
  if (error) {
    console.error('Firebase CLI is not installed. Please install it using:');
    console.error('npm install -g firebase-tools');
    process.exit(1);
  }

  // Path to the rules file
  const rulesPath = path.join(__dirname, 'src', 'lib', 'firebase', 'firestore.rules');
  
  // Check if rules file exists
  if (!fs.existsSync(rulesPath)) {
    console.error('Rules file not found at:', rulesPath);
    process.exit(1);
  }

  console.log('Rules file found. Deploying rules...');
  
  // Deploy the rules
  exec('firebase deploy --only firestore:rules', (deployError, stdout, stderr) => {
    if (deployError) {
      console.error('Error deploying rules:', deployError);
      console.error(stderr);
      process.exit(1);
    }
    
    console.log(stdout);
    console.log('Firestore rules deployed successfully!');
  });
}); 