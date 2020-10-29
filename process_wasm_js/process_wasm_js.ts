import { readFileSync, writeFileSync } from "fs";
import { parseModule } from "esprima";
import { generate } from "escodegen";
import {
  Node,
  MemberExpression,
  Identifier,
  Pattern,
  VariableDeclaration,
  Expression,
} from "estree";
import { ancestor as walkAncestors, AncestorVisitors } from "acorn-walk";

const EXPORTS = [
  "_malloc",
  "_free",
  "_enc_init",
  "_enc_free",
  "_enc_encode",
  "_enc_flush",
  "_enc_get_pcm",
  "_enc_get_out_buf",
  "HEAP32",
  "HEAPF32",
  "HEAPU8",
];

function changeExportToMember(node: Identifier) {
  const oldNode = { ...node };
  const newNode = (node as unknown) as MemberExpression;
  newNode.type = "MemberExpression";
  newNode.object = { type: "Identifier", name: "Module" };
  newNode.computed = true;
  newNode.property = {
    type: "Literal",
    value: node.name,
    raw: `'${node.name}'`,
  };
}

const walkConfig: AncestorVisitors<void> = {
  MemberExpression(node: MemberExpression) {
    if (
      node.property.type === "Identifier" &&
      node.property.name === "exports" &&
      node.object.type === "MemberExpression" &&
      node.object.property.type === "Identifier" &&
      node.object.property.name === "instance" &&
      node.object.object.type === "Identifier" &&
      node.object.object.name === "output"
    ) {
      node.object = {
        type: "LogicalExpression",
        operator: "||",
        left: node.object,
        right: node.object.object,
      };
    }
  },
  Pattern(node: Pattern, ancestors: Node[] | void) {
    if (
      node.type === "Identifier" &&
      EXPORTS.includes(node.name) &&
      ancestors &&
      ancestors[ancestors.length - 2].type !== "VariableDeclarator"
    ) {
      changeExportToMember(node);
    }
  },
  Expression(node: Expression) {
    if (node.type === "Identifier" && EXPORTS.includes(node.name)) {
      changeExportToMember(node);
    }
  },
  VariableDeclaration(node: VariableDeclaration) {
    node.declarations = node.declarations.filter(
      (child) =>
        child.id.type !== "Identifier" || !EXPORTS.includes(child.id.name)
    );
  },
};

const file = process.argv[2];

if (file) {
  const ast = parseModule(readFileSync(file, "utf8"), {});
  walkAncestors(ast, walkConfig);
  writeFileSync(file, generate(ast));
}
