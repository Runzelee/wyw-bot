var replaceIllegalChar = (arg, isHTML) => {
    for (let i = 0; i < arg.length; i++) {
        while (arg[i].includes('\n')) {
            arg[i] = arg[i].replace('\n', '');
        }
        while (arg[i].includes('(')) {
            arg[i] = arg[i].replace('(', '（');
        }
        while (arg[i].includes(')')) {
            arg[i] = arg[i].replace(')', '）');
        }
        while (arg[i].includes('.')) {
            arg[i] = arg[i].replace('.', '。');
        }
        while (arg[i].includes(';')) {
            arg[i] = arg[i].replace(';', '；');
        }
        while (arg[i].includes('[')) {
            arg[i] = arg[i].replace('[', '【');
        }
        while (arg[i].includes(']')) {
            arg[i] = arg[i].replace(']', '】');
        }
        while (arg[i].includes('-')) {
            arg[i] = arg[i].replace('-', '');
        }
        while (arg[i].includes('"')) {
            arg[i] = arg[i].replace('"', '');
        }
        if (isHTML) {
            while (arg[i].includes('<p>')) {
                arg[i] = arg[i].replace('<p>', '');
            }
            while (arg[i].includes('</p>')) {
                arg[i] = arg[i].replace('</p>', '\n');
            }
            while (arg[i].includes('<br>')) {
                arg[i] = arg[i].replace('<br>', '\n');
            }
            while ((/<[\s\S]*>/).test(arg[i])) {
                arg[i] = arg[i].replace(/<[\s\S]*>/, '');
            }
            //提前分号已经替换过
            while (arg[i].includes('&nbsp；')) {
                arg[i] = arg[i].replace('&nbsp；', ' ');
            }
        }
    }
    return arg;
}

module.exports = replaceIllegalChar;