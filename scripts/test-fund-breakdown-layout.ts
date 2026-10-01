import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const source = read('src/components/dashboard/PortfolioComposition.tsx');
const tree = ts.createSourceFile('PortfolioComposition.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const className = (node: ts.JsxElement) => node.openingElement.attributes.properties.find(p => ts.isJsxAttribute(p) && p.name.getText(tree) === 'className')?.getText(tree) || '';
const layoutChildren: ts.JsxElement[] = [];
const visit = (node: ts.Node) => {
    if (ts.isJsxElement(node) && className(node).includes('portfolio-composition__content')) {
        node.children.forEach(child => {
            if (ts.isJsxElement(child)) layoutChildren.push(child);
            else if (ts.isJsxExpression(child) && child.expression && ts.isBinaryExpression(child.expression)) {
                let element = child.expression.right;
                while (ts.isParenthesizedExpression(element)) element = element.expression;
                if (ts.isJsxElement(element)) layoutChildren.push(element);
            }
        });
    }
    ts.forEachChild(node, visit);
};
visit(tree);
for (const name of ['heatmap', 'donut', 'consolidated', 'distributions']) {
    assert.ok(layoutChildren.some(child => className(child).includes(`portfolio-composition__${name}`)), `${name} must be a separate grid child`);
}
assert.match(source, /<details key=\{isin\}/);
assert.match(source, /<summary>\{fund.name\}/);
assert.match(source, /Porcentajes sobre el fondo/);
const css = read('src/components/dashboard/PortfolioComposition.css');
assert.match(css, /\.portfolio-composition__consolidated \{ grid-column: 1 \/ -1;/);
assert.match(css, /\.portfolio-composition__distributions \{ grid-column: 1 \/ -1;/);
assert.match(css, /grid-template-areas: "donut" "heatmap"/);
assert.match(css, /summary:focus-visible/);
const heatmap = read('src/components/charts/Heatmap.tsx');
assert.match(heatmap, /flex: `\$\{child.weight\} 1 96px`/);
assert.match(heatmap, /hoveredItem === child.id/);
const heatmapCss = read('src/components/charts/Heatmap.css');
assert.match(heatmapCss, /min-width: min\(96px, 100%\)/);
assert.match(heatmapCss, /overflow-wrap: anywhere/);
console.log('Fund breakdown structure passed: independent grid sections, accessible disclosures, mobile ordering, readable child cells and hover identity. This is not a browser visual test.');
