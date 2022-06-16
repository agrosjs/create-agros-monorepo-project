import * as inquirer from 'inquirer';
import * as fs from 'fs-extra';
import * as path from 'path';
import _ from 'lodash';

inquirer.prompt([
    {
        name: 'name',
        message: 'Project name',
    },
    {
        name: 'version',
        message: 'Project initial version',
        default: '0.1.0',
    },
    {
        name: 'description',
        message: 'Package description',
        default: '',
    },
]).then((data = {}) => {
    const PROCESS_CWD = process.cwd();
    const TARGET_FOLDER = process.argv[2] || '';
    const TEMPLATE_DIR = path.resolve(__dirname, '../template');
    const TARGET_DIR = path.resolve(PROCESS_CWD, TARGET_FOLDER);
    const packageConfig = {};

    try {
        _.merge(
            packageConfig,
            fs.readJsonSync(path.resolve(TEMPLATE_DIR, 'package.json._')),
            data,
        );
    } catch (e) {
        console.log('Failed to read content of default package.json');
        process.exit(1);
    }

    if (fs.existsSync(TARGET_DIR) && !fs.statSync(TARGET_DIR).isDirectory()) {
        console.log('There is already a file at ' + TARGET_DIR + ', please remove it and retry');
        process.exit(1);
    }

    if (!fs.existsSync(TARGET_DIR)) {
        fs.mkdirpSync(TARGET_DIR);
    }

    try {
        fs.writeFileSync(
            path.resolve(TARGET_DIR, 'package.json'),
            JSON.stringify(packageConfig, null, 4),
            {
                encoding: 'utf-8',
            },
        );
    } catch (e) {
        console.log('Failed to write file package.json');
        process.exit(1);
    }

    [
        'tsconfig.json._',
        'tsconfig.package.json._',
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
            console.log('Failed to write file', fileName);
        }
    });

    console.log('Project initialized at ', TARGET_DIR);
});
