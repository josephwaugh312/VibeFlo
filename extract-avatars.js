const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Define the input grid images
const grids = [
  {
    name: 'grid1',
    path: path.join(__dirname, 'avatar-grid-1.jpg'),
    width: 4,  // Number of columns
    height: 3, // Number of rows
    avatars: [
      'cube', 'blue-hair', 'red-hair', 'hooded',
      'dark-hair', 'purple-hair', 'horns', 'play',
      'dark-eyes', 'purple-cap', 'yellow-hair', 'white-hair'
    ]
  },
  {
    name: 'grid2',
    path: path.join(__dirname, 'avatar-grid-2.jpg'),
    width: 4,  // Number of columns
    height: 3, // Number of rows
    avatars: [
      'power', 'hoodie', 'glasses', 'red-serious',
      'headphones', 'orange-girl', 'cat', 'strawberry',
      'ghost', 'fox-girl', 'red-eyes', 'smirk'
    ]
  }
];

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, 'client', 'public', 'assets', 'avatars');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Process each grid
async function processGrids() {
  for (const grid of grids) {
    console.log(`Processing grid: ${grid.name}`);
    
    try {
      // Get image dimensions
      const image = sharp(grid.path);
      const metadata = await image.metadata();
      
      const cellWidth = Math.floor(metadata.width / grid.width);
      const cellHeight = Math.floor(metadata.height / grid.height);
      
      console.log(`Grid dimensions: ${metadata.width}x${metadata.height}, Cell: ${cellWidth}x${cellHeight}`);
      
      // Extract each avatar
      for (let row = 0; row < grid.height; row++) {
        for (let col = 0; col < grid.width; col++) {
          const index = row * grid.width + col;
          if (index >= grid.avatars.length) continue;
          
          const avatarName = grid.avatars[index];
          const left = col * cellWidth;
          const top = row * cellHeight;
          
          console.log(`Extracting ${avatarName} from position (${left}, ${top})`);
          
          await image
            .extract({ left, top, width: cellWidth, height: cellHeight })
            .toFile(path.join(outputDir, `${avatarName}.png`));
        }
      }
      
      console.log(`Completed processing grid: ${grid.name}`);
    } catch (error) {
      console.error(`Error processing grid ${grid.name}:`, error);
    }
  }
}

processGrids()
  .then(() => console.log('All avatars extracted successfully!'))
  .catch(err => console.error('Error extracting avatars:', err)); 