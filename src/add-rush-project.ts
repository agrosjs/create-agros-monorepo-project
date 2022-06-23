import { visit } from 'jsonc-parser';
import { RushProjectConfig } from './types';

export const addRushProject = async (content: string, config: RushProjectConfig) => {
    const {
        endLine,
        offset,
    } = await new Promise((resolve, reject) => {
        try {
            let projectsArrayStartLine = 0;
            const gotArrayStartLineStack = [];
            visit(content, {
                onObjectProperty: (property, offset, length, startLine) => {
                    if (property === 'projects') {
                        projectsArrayStartLine = startLine;
                    }
                },
                onArrayBegin: (offset, length, startLine) => {
                    gotArrayStartLineStack.push(startLine);
                },
                onArrayEnd: (offset, length, startLine, startCharacter) => {
                    const currentArrayStartLine = gotArrayStartLineStack.pop();
                    if (currentArrayStartLine === projectsArrayStartLine) {
                        resolve({
                            offset: startCharacter,
                            endLine: startLine,
                        });
                    }
                },
            });
        } catch (e) {
            reject(e);
        }
    });

    console.log(offset);

    const newProjectConfig = JSON.stringify(config, null, 4)
        .split('\n')
        .map((line) => `${new Array(offset + 4).fill(' ').join('')}${line}`)
        .join('\n');
    const newContent = content.split(/\n|\r\n|\r/);

    newContent.splice(endLine - 1, 1, newContent[endLine - 1].concat(','));
    newContent.splice(endLine, 0, ...newProjectConfig.split('\n'));

    return newContent.join('\n');
};
