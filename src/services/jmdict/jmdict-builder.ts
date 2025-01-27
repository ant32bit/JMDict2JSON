import { TagDetails } from "./jmdict-parser";

const structure_JMdict_e: BuilderStructure_RootDefinition = {
    root: "JMdict",
    elements: {
        "JMdict": {
            "entry": { allowMany: true }
        },
        "entry": {
            "ent_seq": { required: true },
            "k_ele": { allowMany: true },
            "r_ele": { required: true, allowMany: true },
            "sense": { required: true, allowMany: true }
        },
        "k_ele": {
            "keb": { required: true },
            "ke_inf": { allowMany: true },
            "ke_pri": { allowMany: true },
        },
        "r_ele": {
            "reb": { required: true },
            "re_nokanji": { allowMany: false },
            "re_restr": { allowMany: true },
            "re_inf": { allowMany: true },
            "re_pri": { allowMany: true },
        },
        "sense": {
            "stagk": { allowMany: true },
            "stagr": { allowMany: true },
            "pos": { allowMany: true },
            "xref": { allowMany: true },
            "ant": { allowMany: true },
            "field": { allowMany: true },
            "misc": { allowMany: true },
            "s_inf": { allowMany: true },
            "lsource": { allowMany: true },
            "dial": { allowMany: true },
            "gloss": { allowMany: true }
        },
        "lsource": {
            "xml:lang": { attribute: true, default: 'eng' },
            "ls_type": { attribute: true, default: 'full' },
            "ls_wasei": { attribute: true },
        },
        "gloss": {
            "xml:lang": { attribute: true, default: 'eng' },
            "g_gend": { attribute: true },
            "g_type": { attribute: true },
            "pri": { allowMany: true }
        }
    },
    entities: {}
};

const structure_JMnedict: BuilderStructure_RootDefinition = {
    root: "JMnedict",
    elements: {
        "JMnedict": {
            "entry": { allowMany: true }
        },
        "entry": {
            "ent_seq": { required: true },
            "k_ele": { allowMany: true },
            "r_ele": { required: true, allowMany: true },
            "trans": { required: true, allowMany: true }
        },
        "k_ele": {
            "keb": { required: true },
            "ke_inf": { allowMany: true },
            "ke_pri": { allowMany: true },
        },
        "r_ele": {
            "reb": { required: true },
            "re_nokanji": { allowMany: false },
            "re_restr": { allowMany: true },
            "re_inf": { allowMany: true },
            "re_pri": { allowMany: true },
        },
        "lsource": {
            "xml:lang": { attribute: true, default: 'eng' },
            "ls_type": { attribute: true, default: 'full' },
            "ls_wasei": { attribute: true },
        },
        "gloss": {
            "xml:lang": { attribute: true, default: 'eng' },
            "g_gend": { attribute: true },
            "g_type": { attribute: true },
            "pri": { allowMany: true }
        },
        "trans": {
            "trans_det": { allowMany: true },
            "name_type": { allowMany: true }
        }
    },
    entities: {}
}


export class JMDictBuilder {
    private stack: BuilderReadStackContainer[] = [];
    private final: any = null;

    private contentTag = 'xml:content';
    
    constructor(private structure: BuilderStructure_RootDefinition) {}

    public get(): any {
        return this.final;
    }

    public nextTag(tag: TagDetails) {
        if (tag.opening) {
            if (tag.name === this.structure.root) {
                if (this.final != null || this.stack.length > 0) {
                    throw new Error(`Line ${tag.line}: Cannot have more than one root element.`);
                }
            }
            else {
                if (this.stack.length === 0) {
                    throw new Error(`Line ${tag.line}: Found root "${tag.name}" element. Root element must be "${this.structure.root}".`);
                }

                const parent = this._stackPeekElement();
                const childDefinition = this.structure.elements[parent][tag.name];
                if (childDefinition == null || childDefinition.attribute) {
                    throw new Error(`Line ${tag.line}: "${tag.name}" is not a valid child element of "${parent}".`);
                }

                if (!childDefinition.allowMany && this._stackPeekElementHas(tag.name)) {
                    throw new Error(`Line ${tag.line}: "${parent}" cannot contain more than one "${tag.name}" element.`);
                }
            }

            const elementDef = this.structure.elements[tag.name];
            const element = {};

            for(const attr of Object.keys(tag.attr)) {
                if (elementDef[attr] && elementDef[attr].attribute) {
                    element[attr] = tag.attr[attr];
                }
                else {
                    throw new Error(`Line ${tag.line}: Unexpected attribute "${attr}" on "${tag.name}" element.`);
                }
            }

            if (tag.inner) {
                element[this.contentTag] = tag.inner;
            }

            this.stack.push(new BuilderReadStackContainer(tag.name, element));
        }

        if (tag.closing) {
            const container = this.stack.pop();
            if (container.element !== tag.name) {
                throw new Error(`Line ${tag.line}: Unmatched closing "${tag.name}".`);
            }

            if (this.structure.elements[container.element]) {
                for(let child of Object.keys(this.structure.elements[container.element])) {
                    const def = this.structure.elements[container.element][child];
                    if (def.required && !container.obj[child]) {
                        throw new Error(`Line ${tag.line}: "${tag.name}" is missing required "${child}" ${def.attribute ? "attribute" : "child"}.`)
                    }
                }
            }
            else {
                container.obj = container.obj[this.contentTag];   
            }          

            const parent = this._stackPeekElement();
            if (parent == null) {
                this.final = container.obj;
            }
            else {
                const childDefinition = this.structure.elements[parent][container.element];
                if (childDefinition.allowMany) {
                    const parentContainer = this.stack.pop();
                    if (!parentContainer.obj[container.element]) {
                        parentContainer.obj[container.element] = [];
                    }

                    parentContainer.obj[container.element].push(container.obj);
                    this.stack.push(parentContainer);
                }
                else {
                    // "|| null" esures that elements with no inner are preserved in stringification
                    this._stackAddToLastElement(container.element, container.obj || null);
                }
            }
        }
    }

    private _stackPeekElement(): string {
        return this.stack.length > 0 ?
            this.stack[this.stack.length - 1].element :
            null;
    }

    private _stackPeekElementHas(tag: string): boolean {
        return this.stack.length > 0 ? 
            this.stack[this.stack.length - 1].obj[tag] != null :
            false;
    }

    private _stackAddToLastElement(key: string, value: any) {
        if (this.stack.length > 0) {
            this.stack[this.stack.length - 1].obj[key] = value;
        }
    }
}

class BuilderReadStackContainer {
    element: string;
    obj: any;

    constructor(element: string, obj: any) {
        this.element = element;
        this.obj = obj;
    }
}

type BuilderStructure_RootDefinition = {
    root: string;
    elements: {
        [element: string]: { // element tags
            [element: string]: { // children
                required?: boolean;
                allowMany?: boolean;
                attribute?: boolean;
                default?: string;
            }
        }
    };
    entities: {[name: string]: string};
}
