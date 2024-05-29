const active = 'cs,de,es,fr,it,ja,nl,tr'.split(',');

const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'your-directory'); // replace 'your-directory' with your target directory

function listFilesSync(directory, callback) {
  try {
    const files = fs.readdirSync(directory);

    files.forEach((file) => {
      const filePath = path.join(directory, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        // If the file is a directory, recurse into the directory
        listFilesSync(filePath, callback);
      } else {
        // If the file is not a directory, print its path
        callback(filePath);
      }
    });
  } catch (err) {
    console.error('Error reading directory:', err);
  }
}

const simplePath = p => p ? p.split(/pages./)[1].replace('\\', '/') : 'missing.adoc';
const allEn = [];
listFilesSync(`en/modules/ROOT/pages`, filePath => allEn.push(simplePath(filePath).replace('.adoc', '')));
for (const lang of active) {
    const orphans = [];
    const translations = {};
    listFilesSync(`${lang}/modules/ROOT/pages`, filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        const pageEn = content.match(/:page-en:(.*)/);
        if (!pageEn) {
            orphans.push(simplePath(filePath));
        } else {
           translations[pageEn[1].trim()] = filePath;
        }
    });
    const nav = fs.readFileSync('en/modules/ROOT/nav.adoc', 'utf8');
    const localNav = nav.replace(/xref:(.+?).adoc/g, function(match, contents) {
            return "xref:" + simplePath(translations[contents]);
    });
    const missing = [];
    for (const enPage of allEn) {
      if (!translations[enPage]) {
        missing.push(enPage);
      }
    }
    fs.writeFileSync(`${lang}/modules/ROOT/nav.adoc`, localNav, 'utf8');
    fs.writeFileSync(`${lang}/modules/ROOT/pages/missing.adoc`, '= Missing translations\n\n * '
    + missing.join('\n * ') + '\n == Extra translations \n\n * '
    + orphans.join('\n * '), 'utf8');
}