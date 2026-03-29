const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'frontend/src/pages/Recommendations.jsx');
let content = fs.readFileSync(file, 'utf8');

// The file has two definitions of TICKER_ITEMS
const regex = /const TICKER_ITEMS = \[.*?\];/gs;
const matches = content.match(regex);
if (matches && matches.length > 1) {
    // Keep the first one, remove the others
    let count = 0;
    content = content.replace(regex, (match) => {
        count++;
        return count === 1 ? match : '';
    });
    fs.writeFileSync(file, content, 'utf8');
    console.log("Removed duplicate TICKER_ITEMS. Count:", matches.length);
} else {
    console.log("No duplicate TICKER_ITEMS found.");
}
