import { FiniteStateMachine } from "../../models/finite-state-machine";
import { JMDictBuilder } from "./jmdict-builder";

export class JMDictValidator {
    private static _regexLibrary: {[key: string]: RegExp} = {
        'doctype': /^\s*<!DOCTYPE\s+([^\s]+)\s+\[\s*$/,
        'doctype_close': /^\s*\]\s*>\s*/,
        'element': /^\s*<!ELEMENT\s+([^\s]+)\s+([^>]+)>\s*$/,
        'attribute': /^\s*<!ATTLIST\s+([^\s]+)\s*([^\s]+)\s*([^\s]+)\s*([^>]+)>\s*$/,
        'entity': /^\s*<!ENTITY\s+([^\s]+)\s+"([^"]+)"\s*>\s*$/
    }

    private static _finiteStateMachines: {[key: string]: FiniteStateMachine} = {
        'element': new FiniteStateMachine('start', {
            start: [
                {match: /^\(/, token: 'open', next: 'a'}
            ],
            a: [
                {match: /^#PCDATA/, token: 'name', next: 'b'},
                {match: /^[a-zA-z:_]+/, token: 'name', next: 'c'}
            ],
            b: [
                {match: /^[\|\,]/, token: 'continuation', next: 'a'},
                {match: /^\)/, token: 'close', next: 'd'}
            ],
            c: [
                {match: /^[*+?]/, token: 'modifier', next: 'b'},
                {match: /^/, next: 'b'}
            ],
            d: [
                {match: /^[*+?]/, token: 'modifier', next: 'end'},
                {match: /^/, next: 'end'}
            ]
        })
    }

    private defined: boolean = false;
    private definition: BuilderStructure_RootDefinition = {
        root: undefined,
        elements: {},
        entities: {}
    };

    private f_types = [this.doctype.bind(this), this.element.bind(this), this.attribute.bind(this), this.entity.bind(this), this.doctype_close.bind(this)]

    public parseXML(line: string): boolean {
        if (this.defined)
            return true;

        for (const f_type of this.f_types) {
            if (f_type(line))
                return this.defined;
        }

        return false;
    }

    public getDefinition(): BuilderStructure_RootDefinition {
        if (this.defined) 
            return this.definition;

        return undefined;
    }

    private doctype(s: string): boolean {
        if (this.definition.root !== undefined)
            return false;

        const matches = JMDictValidator._regexLibrary['doctype'].exec(s);
        
        if (matches == null) {
            return false;
        }

        const root = matches[1];
        this.definition.root = root;
        return true;
    }

    private element(s: string): boolean {
        const matches = JMDictValidator._regexLibrary['element'].exec(s);
        
        if (matches == null) {
            return false;
        }

        const parent = matches[1];
        const def = matches[2];

        const tokens = JMDictValidator._finiteStateMachines['element'].parse(def);

        const children: {name: string, definition: BuilderStructure_ChildDefinition }[] = [];

        let definitionFinished = false;
        let overrideRequired = false;
        let currentTag: string | undefined = undefined;
        let currentDefinition: BuilderStructure_ChildDefinition | undefined = undefined;
        
        for (const token of tokens) {
            if (token.type === 'open') {
                continue;
            }

            if (token.type === 'close') {
                if (currentTag)
                    children.push({name: currentTag, definition: currentDefinition});

                definitionFinished = true;
                continue;
            }

            if (token.type === 'continuation') {
                if (token.value === '|') {
                    overrideRequired = true;
                    continue;
                }

                if (token.value === ',') {
                    children.push({name: currentTag, definition: currentDefinition});
                    currentTag = undefined;
                    currentDefinition = undefined;
                }
            }

            if (token.type === 'name') {
                if (token.value === '#PCDATA') {
                    overrideRequired = true;
                    continue;
                }

                currentTag = token.value;
                currentDefinition = {
                    allowMany: false,
                    required: true
                };
            }

            if (token.type === 'modifier') {
                if (definitionFinished) {
                    overrideRequired = true;
                    continue;
                }

                switch(token.value) {
                    case '*': 
                        currentDefinition.allowMany = true;
                        currentDefinition.required = false;
                        break;

                    case '+':
                        currentDefinition.allowMany = true;
                        currentDefinition.required = true;
                        break;
                    
                    case '?':
                        currentDefinition.allowMany = false;
                        currentDefinition.required = false;
                }
            }
        }

        if (children.length > 0) {
            if (this.definition.elements[parent] == undefined) {
                this.definition.elements[parent] = {}
            }

            for (const child of children) {
                if (overrideRequired)
                    child.definition.required = false;
                this.definition.elements[parent][child.name] = child.definition
            }
        }
        
        return true;
    }

    private attribute(s: string): boolean {
        const matches = JMDictValidator._regexLibrary['attribute'].exec(s);
        
        if (matches == null) {
            return false;
        }

        const parent = matches[1];
        const name = matches[2];
        const type = matches[3];
        const defaultValue = matches[4];

        if (this.definition.elements[parent] == null)
            this.definition.elements[parent] = {};

        this.definition.elements[parent][name] = {
            attribute: true
        }

        if (defaultValue === '#REQUIRED') {
            this.definition.elements[parent][name].required = true;
        }
        else if (defaultValue !== '#IMPLIED') {
            this.definition.elements[parent][name].default = defaultValue.substring(1, defaultValue.length - 1)
        }

        return true;
    }

    private entity(s: string): boolean {
        const matches = JMDictValidator._regexLibrary['entity'].exec(s);
        
        if (matches == null) {
            return false;
        }

        const name = matches[1];
        const value = matches[2];

        this.definition.entities[name] = value;

        return true;
    }

    private doctype_close(s: string): boolean {
        if (!JMDictValidator._regexLibrary["doctype_close"].test(s))
            return false;

        this.defined = true;
        return true;
    }
}

type BuilderStructure_ChildDefinition = {
    required?: boolean;
    allowMany?: boolean;
    attribute?: boolean;
    default?: string;
}

type  BuilderStructure_RootDefinition = {
    root: string;
    elements: {
        [tag: string]: { // element tags
            [name: string]: BuilderStructure_ChildDefinition
        }
    };
    entities: {[name: string]: string};
}
