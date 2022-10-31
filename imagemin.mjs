import imagemin from 'imagemin';
import mozjpeg from 'imagemin-mozjpeg';
import pngquant from 'imagemin-pngquant';
import svgo from 'imagemin-svgo';
import {deleteAsync as del} from 'del';
import fs from 'fs';

const config = {
  quality: 85,
};

const getParam = (searchString) => {
  const args = process.argv.slice(2);
  const param = args.find(arg => arg.startsWith(searchString));
  if (param) {
    const arr = param.split('=');
    if (arr.length === 1) return true;
    else if (arr.length === 2) return arr[1];
  }

  return null;
};

const readFolders = (dir) => {
  return new Promise((resolve) => {
    const folders = [];
    fs.readdir(dir, (error, files) => {
      files.forEach((item) => {
        if (fs.lstatSync(`${dir}${item}`).isDirectory()) folders.push(`${dir}${item}`);
      });
      resolve(folders);
    });
  });
};

const minimize = async (folder) => {
  const distFolder = folder.replace('./src/', '').replace('./src', '');
  const qLow = (config.quality - 10 > 1) ? (config.quality - 10) / 100 : 0.1;
  const qHigh = (config.quality + 10 < 100) ? (config.quality + 10) / 100 : 1;
  await imagemin([`${folder}/*.(jpg|JPG|jpeg|JPEG|png|PNG|svg|SVG)`], {
    destination: `dist/${distFolder}`,
    plugins: [
      mozjpeg({ progressive: true, quality: config.quality }),
      pngquant({ speed: 6, quality: [qLow, qHigh] }),
      svgo({
        plugins: [
          {removeViewBox: false},
          {removeDimensions: true},
          {removeStyleElement: true}
        ]
      })
    ]
  });
  console.info(`optimized ${folder}`);
}

const imageminFolder = async (src) => {
  const folders = await readFolders(`${src}/`);

  folders.forEach(async (folder) => {
    await minimize(folder);
    imageminFolder(folder);
  });
}

(async () => {
  let q = getParam('q');
  if (!Number.isNaN(q)) q = Number.parseInt(q);
  else q = null;

  if (q < 100 && q > 0) config.quality = q;
  console.info('delete dist');
  await del('./dist/**/*');
  minimize('./src');
  imageminFolder('./src');
})();
