'use strict';

const path = require('path');
const fs = require('fs');
const {pathToNAS} = require('./config').config;
const logger = require('./winston');

exports.existsOrder = (contractNumber, index, isNAS) => {

  logger.info('fn existsOrder()');
  logger.info('----------------');
  logger.info(`contractNumber: ${contractNumber}`);
  logger.info(`index: ${index}`);
  logger.info(`isNAS: ${isNAS}`);

  if (isNAS) {
    const docxFileNAS = `${pathToNAS}/${contractNumber}-${index}.docx`;
    logger.info(`isNAS. docxFileNAS: ${docxFileNAS}`);
    if (fs.existsSync(docxFileNAS)) {
      logger.info(`fs.existsSync(docxFileNAS): ${docxFileNAS}`);
      return docxFileNAS;
    }

    const docFileNAS = `${pathToNAS}/${contractNumber}-${index}.doc`;
    logger.info(`isNAS. docxFileNAS: ${docFileNAS}`);
    if (fs.existsSync(docFileNAS)) {
      logger.info(`fs.existsSync(docxFileNAS): ${docFileNAS}`);
      return docFileNAS;
    }

    logger.info('isNAS. Это null');

    return null;

  } else {
    const docxFile = path.join(__dirname, `../public/docs/${contractNumber}-${index}.docx`);
    logger.info(`docxFile: ${docxFile}`);
    if (fs.existsSync(docxFile)) {
      logger.info(`fs.existsSync(docxFile): ${docxFile}`);
      return `\\\\localhost\\intercoms\\public\\docs\\${contractNumber}-${index}.docx`;
    }

    const docFile = path.join(__dirname, `../public/docs/${contractNumber}-${index}.doc`);
    logger.info(`docFile: ${docFile}`);
    if (fs.existsSync(docFile)) {
      logger.info(`fs.existsSync(docFile): ${docFile}`);
      return `\\\\localhost\\intercoms\\public\\docs\\${contractNumber}-${index}.doc`;
    }

    logger.info('Это null');

    return null
  }
}