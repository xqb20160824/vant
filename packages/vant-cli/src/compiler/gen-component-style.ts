/**
 * Build style entry of all components
 */

import { join, relative } from 'path';
import { outputFileSync } from 'fs-extra';
import { getComponents, replaceExt } from '../common';
import { CSS_LANG, getCssBaseFile } from '../common/css';
import {
  ES_DIR,
  SRC_DIR,
  LIB_DIR,
  STYPE_DEPS_JSON_FILE
} from '../common/constant';

function getDeps(component: string): string[] {
  const styleDepsJson = require(STYPE_DEPS_JSON_FILE);

  if (styleDepsJson.map[component]) {
    return [...styleDepsJson.map[component], component];
  }

  return [];
}

function getPath(component: string, ext = '.css') {
  return join(ES_DIR, `${component}/index${ext}`);
}

function getRelativePath(component: string, style: string, ext: string) {
  return relative(join(ES_DIR, `${component}/style`), getPath(style, ext));
}

const OUTPUT_CONFIG = [
  {
    dir: ES_DIR,
    template: (dep: string) => `import '${dep}';`
  },
  {
    dir: LIB_DIR,
    template: (dep: string) => `require('${dep}');`
  }
];

function genEntry(params: {
  ext: string;
  filename: string;
  component: string;
  baseFile: string | null;
}) {
  const { ext, filename, component, baseFile } = params;
  const deps = getDeps(component);
  const depsPath = deps.map(dep => getRelativePath(component, dep, ext));

  OUTPUT_CONFIG.forEach(({ dir, template }) => {
    const outputDir = join(dir, component, 'style');
    const outputFile = join(outputDir, filename);

    let content = '';

    if (baseFile) {
      const compiledBaseFile = replaceExt(baseFile.replace(SRC_DIR, dir), ext);
      content += template(relative(outputDir, compiledBaseFile));
      content += '\n';
    }

    content += depsPath.map(template).join('\n');

    outputFileSync(outputFile, content);
  });
}

export function genComponentStyle() {
  const components = getComponents();
  const baseFile = getCssBaseFile();

  components.forEach(component => {
    genEntry({
      baseFile,
      component,
      filename: 'index.js',
      ext: '.css'
    });

    if (CSS_LANG !== 'css') {
      genEntry({
        baseFile,
        component,
        filename: CSS_LANG + '.js',
        ext: '.' + CSS_LANG
      });
    }
  });
}
