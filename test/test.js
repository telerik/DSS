const assert = require('assert');
const dss = require('../dss');
const fs = require('fs');
const path = require('path');

describe('Core tests', function() {
    it('should should parse the data', function() {
        const file = fs.readFileSync(path.join(__dirname, 'data/button.scss'), 'utf8');

        dss.parse(file, {}, function(parsed) {
            var data = parsed.blocks[0];

            assert.strictEqual(data.name, "Button");
            assert.strictEqual(data.description, "Your standard form button.");
            assert.strictEqual(data.state[0].name, ":hover");
            assert.strictEqual(data.state[0].description, "Highlights when hovering.");
            assert.strictEqual(data.state[1].name, ":disabled");
            assert.strictEqual(data.state[1].description, "Dims the button when disabled.");
            assert.strictEqual(data.state[2].name, ".primary");
            assert.strictEqual(data.state[2].description, "Indicates button is the primary action.");
            assert.strictEqual(data.state[3].name, ".smaller");
            assert.strictEqual(data.markup.example, "<button>This is a button</button>");
            assert.strictEqual(data.markup.escaped, "&lt;button&gt;This is a button&lt;/button&gt;");
        });
    });
});
