import * as inquirer from 'inquirer';
import * as fs from 'fs-extra';
import * as path from 'path';
import _ from 'lodash';
import { RushProjectConfig } from './types';
import { addRushProject } from './add-rush-project';

inquirer.prompt([
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
]).then((data = {}) => {
    const PROCESS_CWD = process.cwd();
    const TARGET_FOLDER = (process.argv[2] || '').replace(/^packages\//gi, '');
    const TEMPLATE_DIR = path.resolve(__dirname, '../template');
    const TARGET_DIR = path.resolve(PROCESS_CWD, 'packages', TARGET_FOLDER);
    const packageConfig = {};
    const logError = (message: string) => {
        console.log('\x1b[31m' + message + '\x1b[0m');
    };
    const logSuccess = (message: string) => {
        console.log('\x1b[32m' + message + '\x1b[0m');
    };
    const logWarning = (message: string) => {
        console.log('\x1b[33m' + message + '\x1b[0m');
    };

    if (!TARGET_FOLDER) {
        logError('The target folder name must be specified');
        process.exit(1);
    }

    const {
        name,
        version,
        description,
    } = data;

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
        logError('Failed to read content of default package.json');
        process.exit(1);
    }

    if (fs.existsSync(TARGET_DIR) && !fs.statSync(TARGET_DIR).isDirectory()) {
        logError('There is already a file at ' + TARGET_DIR + ', please remove it and retry');
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
        logError('Failed to write file package.json');
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
            logError('Failed to write file: ' + fileName);
            process.exit(1);
        }
    });

    try {
        fs.mkdirpSync(path.resolve(TARGET_DIR, 'src'));
    } catch (e) {
        logWarning('Failed to create dir: src');
    }

    try {
        const rushProjectConfig: RushProjectConfig = {
            packageName: data.name,
            projectFolder: `packages/${TARGET_FOLDER}`,
            shouldPublish: data.shouldPublish,
        };
        const rushConfigFilePath = path.resolve(PROCESS_CWD, 'rush.json');
        const rushConfigFileContent = fs.readFileSync(rushConfigFilePath).toString();

        addRushProject(rushConfigFileContent, rushProjectConfig).then((newContent) => {
            fs.writeFileSync(
                rushConfigFilePath,
                newContent,
                {
                    encoding: 'utf-8',
                },
            );
        }).catch((e) => {
            logWarning('Failed to update rush.json');
        });
    } catch (e) {
        logWarning('Failed to update rush.json');
    }

    logSuccess('Project initialized at ' + TARGET_DIR);
});
