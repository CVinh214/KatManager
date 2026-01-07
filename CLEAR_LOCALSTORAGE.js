// Clear localStorage script - Run in browser console
// Paste this into browser console at http://localhost:3000

console.log('🧹 Clearing all localStorage...');
console.log('Before clear:', Object.keys(localStorage));
localStorage.clear();
console.log('After clear:', Object.keys(localStorage));
console.log('✅ Done! Now refresh the page.');
