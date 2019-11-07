/*
 *    Copyright 2019 Alex (Oleksandr) Pustovalov
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

import path from 'path-browserify';
import template from 'lodash/template';
import { repairPath } from '../../utils/fileUtils';
import { checkFileExists } from '../utils';
import { format } from '../../utils/textUtils';

const templateContent = `
// @param {SampleFunctionInputOptionsTypes from ./<%= fileName %>.props.js}
export const sampleFunction = (options) => dispatch => {
  // do something here with options;
  const { text, extraOptions } = options;
  // and pass them forward to the dispatcher
  const dispatchOptions = {
    text,
    extraOptions: {
      extraFlag: extraOptions.extraFlag,
    }
  };
  // @param {SampleFunctionDispatchTypes from ./<%= fileName %>.props.js}
  dispatch('optionsFromInput', dispatchOptions);
};
`;

const templateContentProps = `
import PropTypes from 'prop-types';

export const SampleFunctionInputOptionsTypes = {
  // text value
  text: PropTypes.string,
  // extra specific logic options for some processing
  extraOptions: PropTypes.shape({
    extraFlag: PropTypes.bool,
  }),
};

export const SampleFunctionDispatchTypes = {
  // text value
  text: PropTypes.string,
  // extra options after some processing
  extraOptions: PropTypes.shape({
    extraFlag: PropTypes.bool,
  }),
};
`;

const templateContentReadme = `
## Description

It's a template for a new list of the reusable functions.

### __sampleFunction__
 
Tell here what this function is for and how to use it.

*Input:*
* __text__ - {string} an input text
* __extraOptions__ {object} an object of the specific function settings
    * __extraFlag__ {boolean} a flag for the function inner logic 

*Dispatch \`optionsFromInput\`:*
* __text__ - {string} a text value
* __extraOptions__ {object} an object of the specific dispatch settings
    * __extraFlag__ {boolean} a flag for the dispatch inner logic
`;

export async function createFiles (fileName, dirName, destDirPath, fileExtension) {
  const fileObjects = [];
  let fileExists;
  const functionsFilePath = repairPath(path.join(destDirPath, dirName, `${fileName}.funcs${fileExtension}`));
  fileExists = await checkFileExists(functionsFilePath);
  if (fileExists) {
    throw Error(`The file with the "${fileName}.funcs${fileExtension}" name already exists.`);
  }
  const functionsPropsFilePath = repairPath(path.join(destDirPath, dirName, `${fileName}.props${fileExtension}`));
  fileExists = await checkFileExists(functionsPropsFilePath);
  if (fileExists) {
    throw Error(`The file with the "${fileName}.props${fileExtension}" name already exists.`);
  }
  const functionsReadmeFilePath = repairPath(path.join(destDirPath, dirName, `${fileName}.md`));
  fileExists = await checkFileExists(functionsReadmeFilePath);
  if (fileExists) {
    throw Error(`The file with the "${fileName}.md" name already exists.`);
  }
  fileObjects.push({
    filePath: functionsFilePath,
    fileData: format(template(templateContent)({fileName}))
  });
  fileObjects.push({
    filePath: functionsPropsFilePath,
    fileData: format(template(templateContentProps)({fileName}))
  });
  fileObjects.push({
    filePath: functionsReadmeFilePath,
    fileData: template(templateContentReadme)({fileName})
  });
  return fileObjects;
}
