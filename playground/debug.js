/* eslint-disable */
const dss = require('../dss');
const fs = require('fs');
const path = require('path');

const file = fs.readFileSync(path.join(__dirname, 'data/all-annotations.scss'), 'utf8');
//const file = fs.readFileSync(path.join(__dirname, 'data/button.scss'), 'utf8');
//const file = fs.readFileSync(path.join(__dirname, 'data/vars.scss'), 'utf8');

dss.parse(file, {}, (parsed) => {
    const data = parsed.blocks[0];
    debugger

    console.log(data);
});
