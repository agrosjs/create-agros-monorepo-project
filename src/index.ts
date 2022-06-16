import * as inquirer from 'inquirer';

inquirer.prompt([
    {
        name: 'name',
        message: 'Name for this package',
    },
    {
        name: 'version',
        message: 'Version for this package',
        default: '0.1.0',
    },
    {
        name: 'description',
        message: 'Description for this package',
        default: '',
    },
]).then((data = {}) => {
    console.log(process.cwd);
    console.log(process.argv);
});
