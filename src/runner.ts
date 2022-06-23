import * as inquirer from 'inquirer';
import * as fs from 'fs-extra';
import * as path from 'path';
import _ from 'lodash';
import { RushProjectConfig } from './types';
import { addRushProject } from './add-rush-project';
import { Logger } from '@agros/logger';
import { runCommand } from '@agros/utils';

export const runner = async () => {
    const logger = new Logger();
    const PROCESS_CWD = process.cwd();
    const TARGET_FOLDER = (process.argv[2] || '').replace(/^packages\//gi, '');
    const TEMPLATE_DIR = path.resolve(__dirname, '../template');
    const TARGET_DIR = path.resolve(PROCESS_CWD, 'packages', TARGET_FOLDER);
    const packageConfig = {};

    if (!TARGET_FOLDER) {
        logger.error('The target folder name must be specified', new Error());
        process.exit(1);
    }

    const userConfig = await inquirer.prompt([
        {
            name: 'name',
            message: 'Project name',
        },
        {
            name: 'version',
            message: 'Project initial version',
            default: '0.0.0',
        },
        {
            name: 'description',
            message: 'Package description',
            default: '',
        },
        {
            name: 'shouldPublish',
            type: 'confirm',
            message: 'Should this package available to be published',
            default: true,
        },
    ]);

    const {
        name,
        version,
        description,
    } = userConfig;

    const userPackageConfig = {
        name,
        version,
        description,
    };

    try {
        _.merge(
            packageConfig,
            fs.readJsonSync(path.resolve(TEMPLATE_DIR, 'package.json._')),
            userPackageConfig,
        );
    } catch (e) {
        logger.error('Failed to read content of default package.json', new Error());
        process.exit(1);
    }

    if (fs.existsSync(TARGET_DIR) && !fs.statSync(TARGET_DIR).isDirectory()) {
        logger.error('There is already a file at ' + TARGET_DIR + ', please remove it and retry', new Error());
        process.exit(1);
    }

    if (!fs.existsSync(TARGET_DIR)) {
        fs.mkdirpSync(TARGET_DIR);
    }

    try {
        fs.writeFileSync(
            path.resolve(TARGET_DIR, 'package.json'),
            JSON.stringify(packageConfig, null, 4) + '\n',
            {
                encoding: 'utf-8',
            },
        );
    } catch (e) {
        logger.error('Failed to write file package.json', new Error());
        process.exit(1);
    }

    [
        'tsconfig.json._',
    ].forEach((fileName) => {
        try {
            fs.writeFileSync(
                path.resolve(TARGET_DIR, fileName.slice(0, -2)),
                fs.readFileSync(path.resolve(TEMPLATE_DIR, fileName)).toString(),
                {
                    encoding: 'utf-8',
                },
            );
        } catch (e) {
            logger.error('Failed to write file: ' + fileName, new Error());
            process.exit(1);
        }
    });

    try {
        fs.mkdirpSync(path.resolve(TARGET_DIR, 'src'));
    } catch (e) {
        logger.warning('Failed to create dir: src');
    }

    try {
        const rushProjectConfig: RushProjectConfig = {
            packageName: userConfig.name,
            projectFolder: `packages/${TARGET_FOLDER}`,
            shouldPublish: userConfig.shouldPublish,
        };
        const rushConfigFilePath = path.resolve(PROCESS_CWD, 'rush.json');
        const rushConfigFileContent = fs.readFileSync(rushConfigFilePath).toString();
        const newContent = await addRushProject(rushConfigFileContent, rushProjectConfig);

        fs.writeFileSync(
            rushConfigFilePath,
            newContent,
            {
                encoding: 'utf-8',
            },
        );
    } catch (e) {
        logger.warning('Failed to update rush.json');
    }

    const stopLoggingRushUpdate = logger.loadingLog('Running `rush update`');

    try {
        runCommand('rush', ['update'], {
            stdio: 'ignore',
        });
    } catch (e) {
        stopLoggingRushUpdate('warning', 'Failed to run `rush update`');
    }

    logger.info('Project initialized at ' + TARGET_DIR);
};
