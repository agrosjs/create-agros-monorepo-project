import * as inquirer from 'inquirer';

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
    console.log(process.cwd());
    console.log(process.argv);
});
