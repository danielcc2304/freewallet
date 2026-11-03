import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { recipeDeclarations } from './helpers/compileModuleStyles';
import { PortfolioCompositionDetailStyle as layoutStyle } from '../src/components/dashboard/ui/PortfolioCompositionDetail.styles';
import { compositionStyle } from '../src/components/dashboard/CompositionParts.styles';
import { HeatmapDetailStyle } from '../src/components/charts/HeatmapDetail.styles';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const source = read('src/components/dashboard/PortfolioComposition.tsx');
const tree = ts.createSourceFile('PortfolioComposition.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const className = (node: ts.JsxElement) =>
    node.openingElement.attributes.properties
        .find((p) => ts.isJsxAttribute(p) && ['className', 'appearance'].includes(p.name.getText(tree)))
        ?.getText(tree) || '';
const layoutChildren: ts.JsxElement[] = [];
const visit = (node: ts.Node) => {
    if (ts.isJsxElement(node) && className(node).includes('portfolio-composition__content')) {
        node.children.forEach((child) => {
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
    assert.ok(
        layoutChildren.some((child) => className(child).includes(`portfolio-composition__${name}`)),
        `${name} must be a separate grid child`,
    );
}
const fundDetails: ts.JsxElement[] = [];
const inspectDetails = (node: ts.Node) => {
    if (
        ts.isJsxElement(node) &&
        node.openingElement.tagName.getText(tree) === 'CompositionDisclosure' &&
        node.openingElement.attributes.properties.some(
            (p) =>
                ts.isJsxAttribute(p) && p.name.getText(tree) === 'variant' && p.initializer?.getText(tree) === '"fund"',
        )
    )
        fundDetails.push(node);
    ts.forEachChild(node, inspectDetails);
};
inspectDetails(tree);
assert.ok(fundDetails.length > 0, 'Fund breakdown remains an optional disclosure');
for (const detail of fundDetails) {
    assert.ok(
        !detail.openingElement.attributes.properties.some(
            (p) => ts.isJsxAttribute(p) && p.name.getText(tree) === 'open',
        ),
        'Fund disclosures start closed',
    );
}
const disclosure = read('src/components/dashboard/CompositionParts.tsx');
assert.match(disclosure, /<details/);
assert.match(disclosure, /<summary>/);
assert.doesNotMatch(disclosure, /open\s*=\s*\{?true/);
for (const part of ['consolidated', 'distributions'] as const) {
    const declarations = await recipeDeclarations(layoutStyle(`portfolio-composition__${part}`));
    assert.ok(declarations.some((d) => d.property === 'grid-column' && d.value === '1 / -1'));
}
const layout = await recipeDeclarations(layoutStyle('portfolio-composition__content'));
assert.ok(layout.some((d) => d.property === 'grid-template-areas' && d.value === '"donut" "heatmap"'));
const disclosureStyles = await recipeDeclarations(compositionStyle('portfolio-composition__breakdown-groups'));
assert.ok(disclosureStyles.some((d) => d.context.includes('summary:focus-visible') && d.property === 'outline'));
const heatmap = read('src/components/charts/Heatmap.tsx');
assert.match(heatmap, /flex: `\$\{child.weight\} 1 96px`/);
assert.match(heatmap, /hoveredItem\s*===\s*child.id/);
const heatmapStyles = await recipeDeclarations(HeatmapDetailStyle('heatmap__item--child'));
assert.ok(heatmapStyles.some((d) => d.property === 'min-width' && /min\(96px,\s*100%\)/.test(d.value)));
assert.ok(heatmapStyles.some((d) => d.property === 'overflow-wrap' && d.value === 'anywhere'));
console.log(
    'Fund breakdown structure passed: independent grid sections, accessible disclosures, mobile ordering, readable child cells and hover identity. This is not a browser visual test.',
);
