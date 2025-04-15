const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/components/old_components/CommentSection.js',
  'src/components/old_components/CreateEvent.js',
  'src/components/old_components/CreatePost.js',
  'src/components/old_components/EventDisplay.js',
  'src/components/old_components/NotificationSystem.js',
  'src/components/old_components/PostsFeed.js',
  'src/components/old_components/Timeline.js',
  'src/components/old_components/TimelineList.js',
  'src/components/old_components/TimelineManager.js',
  'src/components/old_components/TimelinePosts.js',
  'src/components/old_components/TimelineView.js'
];

const replacements = {
  'http://localhost:5000/api': '/api',
  'http://localhost:5000': ''
};

filesToUpdate.forEach(file => {
  const filePath = path.resolve(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    Object.entries(replacements).forEach(([search, replace]) => {
      content = content.replace(new RegExp(search, 'g'), replace);
    });
    
    // Add import for api if not present
    if (!content.includes('import api from')) {
      content = content.replace(/import React/g, 'import React\nimport api from \'../utils/api\';\n');
    }
    
    // Replace axios calls with api calls
    content = content.replace(/axios\.(get|post|put|delete)/g, 'api.$1');
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated: ${file}`);
  }
});
