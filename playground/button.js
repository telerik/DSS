/* eslint-disable */
const dss = require('../dss');
const fs = require('fs');
const path = require('path');


const file = fs.readFileSync(path.join(__dirname, 'data/button.scss'), 'utf8');

dss.parse(file, {}, function(parsed) {
    const data = parsed.blocks[0];

    console.log(data);
});
