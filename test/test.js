const assert = require('assert');
const dss = require('../dss');
const fs = require('fs');
const path = require('path');

[ 'css', 'scss' ].forEach((ext) => {

    describe(`Core tests - ${ext}`, () => {

        it('should should parse the data', () => {
            const file = fs.readFileSync(path.join(__dirname, `data/${ext}/button.scss`), 'utf8');

            dss.parse(file, {}, (parsed) => {
                const data = parsed.blocks[0];

                assert.strictEqual(data.name, 'Button');
                assert.strictEqual(data.description, 'Your standard form button.');
                assert.strictEqual(data.state[0].name, ':hover');
                assert.strictEqual(data.state[0].description, 'Highlights when hovering.');
                assert.strictEqual(data.state[1].name, ':disabled');
                assert.strictEqual(data.state[1].description, 'Dims the button when disabled.');
                assert.strictEqual(data.state[2].name, '.primary');
                assert.strictEqual(data.state[2].description, 'Indicates button is the primary action.');
                assert.strictEqual(data.state[3].name, '.smaller');
                assert.strictEqual(data.example.type, null);
                assert.strictEqual(data.example.example,
                    '   <span>\n' +
                    '     <button>This is a button</button>\n' +
                    '   </span>'
                );
                assert.strictEqual(data.example.escaped,
                    '   &lt;span&gt;\n' +
                    '     &lt;button&gt;This is a button&lt;/button&gt;\n' +
                    '   &lt;/span&gt;'
                );
            });
        });

        it('multiline example is correctly parsed when not as last parser', () => {
            const file = fs.readFileSync(path.join(__dirname, `data/${ext}/example-not-last.scss`), 'utf8');

            dss.parse(file, {}, (parsed) => {
                const data = parsed.blocks[0];

                assert.strictEqual(data.name, 'Button');
                assert.strictEqual(data.description, 'Your standard form button.');
                assert.strictEqual(data.example.type, null);
                assert.strictEqual(data.example.example,
                    '   <span>\n' +
                    '     <button>This is a button</button>\n' +
                    '   </span>'
                );
                assert.strictEqual(data.example.escaped,
                    '   &lt;span&gt;\n' +
                    '     &lt;button&gt;This is a button&lt;/button&gt;\n' +
                    '   &lt;/span&gt;'
                );
            });
        });

        it('multiline description is correctly parsed', () => {
            const file = fs.readFileSync(path.join(__dirname, `data/${ext}/multi-line-description.scss`), 'utf8');

            dss.parse(file, {}, (parsed) => {
                const data = parsed.blocks[0];

                assert.strictEqual(data.name, 'Multi Line description');
                assert.strictEqual(data.description, 'Your standard form button.\nsecond row test');
            });
        });

        it('description with the @ symbol is correctly parsed', () => {
            const file = fs.readFileSync(path.join(__dirname, `data/${ext}/description-with-special-symbol.scss`), 'utf8');

            dss.parse(file, {}, (parsed) => {
                const data = parsed.blocks[0];

                assert.strictEqual(data.name, 'Special character "@" description test.');
                assert.strictEqual(data.description, 'Your standard description with an @ in it\nsecond row test');
            });
        });

        it('should should parse all annotations', () => {
            const file = fs.readFileSync(path.join(__dirname, `data/${ext}/all-annotations.scss`), 'utf8');

            dss.parse(file, {}, (parsed) => {
                const data = parsed.blocks[0];

                assert.strictEqual(data.name, 'Button');
                assert.strictEqual(data.description, 'Your standard form button.');
                assert.strictEqual(data.state[0].name, ':hover');
                assert.strictEqual(data.state[0].description, 'Highlights when hovering.');
                assert.strictEqual(data.state[1].name, ':disabled');
                assert.strictEqual(data.state[1].description, 'Dims the button when disabled.');
                assert.strictEqual(data.state[2].name, '.primary');
                assert.strictEqual(data.state[2].description, 'Indicates button is the primary action.');
                assert.strictEqual(data.state[3].name, '.smaller');
                assert.strictEqual(data.example.type, 'html');
                assert.strictEqual(data.example.example, '<button>This is a button</button>');
                assert.strictEqual(data.example.escaped, '&lt;button&gt;This is a button&lt;/button&gt;');
                assert.strictEqual(data.deprecated, '123.321');
                assert.strictEqual(data.deprecatedDescription, 'This is deprecated.');
                assert.strictEqual(data.group, 'buttons');
                assert.strictEqual(data.type, 'color');
                assert.strictEqual(data.subtype, 'text-color');
                assert.strictEqual(data.key, '$button-bg');
                assert.strictEqual(data.param[0].type, '{string}');
                assert.strictEqual(data.param[0].name, 'par1');
                assert.strictEqual(data.param[0].description, 'parmOne description');
                assert.strictEqual(data.param[1].type, '{function}');
                assert.strictEqual(data.param[1].name, 'par2');
                assert.strictEqual(data.param[1].description, 'paramTwo description');
                assert.strictEqual(data.param[2].type, null);
                assert.strictEqual(data.param[2].name, 'par3');
                assert.strictEqual(data.param[2].description, 'paramThree description');
                assert.strictEqual(data.param[3].type, null);
                assert.strictEqual(data.param[3].name, 'par4');
                assert.strictEqual(data.param[3].description, null);
                assert.strictEqual(data.returns[0].type, '{number}');
                assert.strictEqual(data.returns[0].name, null);
                assert.strictEqual(data.returns[0].description, 'return description');
                assert.strictEqual(data.returns[1].type, null);
                assert.strictEqual(data.returns[1].name, null);
                assert.strictEqual(data.returns[1].description, 'no type - return description');
            });
        });

        it('should should parse and include key values', () => {
            const file = fs.readFileSync(path.join(__dirname, `data/${ext}/all-key-types.scss`), 'utf8');

            dss.parse(file, {}, (parsed) => {
                const blocks = parsed.blocks;

                assert.strictEqual(blocks[0].name, 'Button');
                assert.strictEqual(blocks[0].description, 'Button description');
                assert.strictEqual(blocks[0].type, 'mytype');
                assert.strictEqual(blocks[0].key, 'myKey');

                assert.strictEqual(blocks[1].name, 'Grid');
                assert.strictEqual(blocks[1].type, 'variable');
                assert.strictEqual(blocks[1].key, '$grid-bg');

                assert.strictEqual(blocks[2].name, 'Spacing');
                assert.strictEqual(blocks[2].type, 'variable');
                assert.strictEqual(blocks[2].key, '$spacing');

                assert.strictEqual(blocks[3].name, 'Decimal Round');
                assert.strictEqual(blocks[3].type, 'function');
                assert.strictEqual(blocks[3].key, 'decimal-round');

                assert.strictEqual(blocks[4].name, 'k-d-flex');
                assert.strictEqual(blocks[4].type, 'selector');
                assert.strictEqual(blocks[4].key, '.k-d-flex');

                assert.strictEqual(blocks[5].name, 'k-resize-none');
                assert.strictEqual(blocks[5].type, null);
                assert.strictEqual(blocks[5].key, null);

                assert.strictEqual(blocks[6].name, 'Resize Both');
                assert.strictEqual(blocks[6].type, 'selector');
                assert.strictEqual(blocks[6].key, '.k-resize-both');
            });
        });

        it('multiple examples are correctly parsed', () => {
            const file = fs.readFileSync(path.join(__dirname, `data/${ext}/multiple-examples.scss`), 'utf8');

            dss.parse(file, {}, (parsed) => {
                const data = parsed.blocks[0];

                assert.strictEqual(data.example[0].type, 'md');
                assert.strictEqual(data.example[0].example,
                    ' <span>\n' +
                    '     <button>This is a button</button>\n' +
                    ' </span>'
                );
                assert.strictEqual(data.example[0].escaped,
                    ' &lt;span&gt;\n' +
                    '     &lt;button&gt;This is a button&lt;/button&gt;\n' +
                    ' &lt;/span&gt;'
                );

                assert.strictEqual(data.example[1].type, null);
                assert.strictEqual(data.example[1].example,
                    ' <div>\n' +
                    '     <span>This is a span</span>\n' +
                    ' </div>'
                );
                assert.strictEqual(data.example[1].escaped,
                    ' &lt;div&gt;\n' +
                    '     &lt;span&gt;This is a span&lt;/span&gt;\n' +
                    ' &lt;/div&gt;'
                );
            });
        });

        it('description without annotations are parsed', () => {
            const file = fs.readFileSync(path.join(__dirname, `data/${ext}/description-without-annotation.scss`), 'utf8');

            dss.parse(file, {}, (parsed) => {
                const data0 = parsed.blocks[0];
                const data1 = parsed.blocks[1];
                const data2 = parsed.blocks[2];
                const data3 = parsed.blocks[3];

                assert.strictEqual(data0.description, 'Your standard description.');
                assert.strictEqual(data1.description, 'Description with additional comments.');
                assert.strictEqual(data2.description, 'Description override.');
                assert.strictEqual(data3.description, 'Multi-line description\n ```json\n     {\n         "test": true\n     }\n ```');
            });
        });

    });

});
