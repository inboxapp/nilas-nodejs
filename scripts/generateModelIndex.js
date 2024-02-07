const fs = require('fs');
const path = require('path');

const comment = '// This file is generated by scripts/generateModelIndex.js\n';
const modelsDir = path.join(__dirname, '..', 'src', 'models');
let indexContent = '';

fs.readdirSync(modelsDir).forEach(file => {
  if (file.endsWith('.ts') && file !== 'index.ts') {
    const modelName = file.replace('.ts', '.js');
    indexContent += `export * from './${modelName}';\n`;
  }
});

fs.writeFileSync(path.join(modelsDir, 'index.ts'), comment + indexContent);
