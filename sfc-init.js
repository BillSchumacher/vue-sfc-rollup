#! /usr/bin/env node

const path = require('path');
const fs = require('fs');
const readlineSync = require('readline-sync');
const ejs = require('ejs');

// Helpers for creating kebab-case/PascalCase versions of string
const pascalify = (str) => {
  const camelized = str.replace(/-([a-z])/g, c => c[1].toUpperCase());
  return camelized.charAt(0).toUpperCase() + camelized.slice(1);
};
const kebabcase = string => string.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/\s+/g, '-').toLowerCase();

// Helper to replace vars in files
const replaceVars = function replaceVars(str, vars) {
  return ejs.render(str, vars);
};

// Helper to ensure directory exists before writing file to it
const ensureDirectoryExists = (filePath) => {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExists(dirname);
  return fs.mkdirSync(dirname);
};

// Prompt whether job is for single component or library of components
console.log('Is this a single component or a library?'); // eslint-disable-line no-console
const modeOptions = [
  'Single Component',
  'Library',
];
const modeIdx = readlineSync.keyInSelect(modeOptions, 'Select one:', {
  cancel: false,
});
const mode = [
  'component',
  'library',
][modeIdx];

// Prompt user for input to populate template files
const npmName = readlineSync.question(`What is the npm name of your ${mode}? `);
let kebabName = kebabcase(npmName);
if (mode === 'component') {
  const componentName = readlineSync.question(`What is the kebab-case tag name for your component? (${kebabcase(npmName)}) `, {
    defaultInput: kebabcase(npmName),
  });
  kebabName = componentName;
}
const savePath = readlineSync.questionPath(`Enter a location to save the ${mode} files: (./${kebabName}) `, {
  defaultInput: path.join(process.cwd(), kebabName),
  exists: false,
  isDirectory: true,
  create: true,
});

// Stop prompting for input, start processing
const componentNamePascal = pascalify(kebabName);
const vars = {
  npmName,
  componentNamePascal,
  componentName: kebabName,
};
const newFiles = {
  package: '',
  rollupConfig: '',
  indexjs: '',
  component: '',
};
const paths = {
  package: path.join(savePath, 'package.json'),
  rollupConfig: path.join(savePath, 'build', 'rollup.config.js'),
  indexjs: path.join(savePath, 'src', 'index.js'),
  component: null,
};

// Single component mode
if (mode === 'component') {
  newFiles.package = replaceVars(
    fs.readFileSync(path.join(__dirname, 'templates', 'single', 'package.json')).toString(),
    vars,
  );
  newFiles.rollupConfig = replaceVars(
    fs.readFileSync(path.join(__dirname, 'templates', 'single', 'build', 'rollup.config.js')).toString(),
    vars,
  );
  newFiles.indexjs = replaceVars(
    fs.readFileSync(path.join(__dirname, 'templates', 'single', 'src', 'index.js')).toString(),
    vars,
  );
  newFiles.component = replaceVars(
    fs.readFileSync(path.join(__dirname, 'templates', 'single', 'src', 'component.vue')).toString(),
    vars,
  );
  paths.component = path.join(savePath, 'src', `${kebabName}.vue`);
}

// Library mode
if (mode === 'library') {
  newFiles.package = replaceVars(
    fs.readFileSync(path.join(__dirname, 'templates', 'library', 'package.json')).toString(),
    vars,
  );
  newFiles.rollupConfig = replaceVars(
    fs.readFileSync(path.join(__dirname, 'templates', 'library', 'build', 'rollup.config.js')).toString(),
    vars,
  );
  newFiles.indexjs = replaceVars(
    fs.readFileSync(path.join(__dirname, 'templates', 'library', 'src', 'index.js')).toString(),
    vars,
  );
  newFiles.component = replaceVars(
    fs.readFileSync(path.join(__dirname, 'templates', 'library', 'src', 'component.vue')).toString(),
    vars,
  );
  paths.component = path.join(savePath, 'src', `${kebabName}-sample.vue`);
}

Object.keys(paths).forEach((key) => {
  ensureDirectoryExists(paths[key]);
  fs.writeFileSync(paths[key], newFiles[key]);
});

// Display completion messages
let completeMessage;
if (mode === 'component') {
  completeMessage = `
Init is complete, your files have been generated and saved into the directory you specified above.
Within that directory, use src/${kebabName}.vue as a starting point for your SFC.
When you're ready, run \`npm run build\` to generate the redistributable versions.

`;
}
if (mode === 'library') {
  completeMessage = `
Init is complete, your files have been generated and saved into the directory you specified above.
Within that directory, you will find a sample SFC at src/${kebabName}-sample.vue. All vue files in
that directory prefixed with \`${kebabName}-\` will be automatically added to your library.
When you're ready, run \`npm run build\` to generate the redistributable versions.

`;
}
// eslint-disable-next-line no-console
console.log(completeMessage);
