import * as fs from 'fs';
import * as readline from 'readline';
import { JMDictBuilder } from "./jmdict-builder";
import { JMDictValidator } from './jmdict-validator';

export abstract class JMDictParser { 
    private static _regexLibrary: {[key: string]: RegExp} = {
        'single-tag': /^\s*<(\/)?\s*([A-Za-z0-9:_]+)\s*((?:[A-Za-z0-9:_]+="[^"]+"\s*)*)\s*(\/)?>\s*$/,
        'tag-with-content': /^\s*<\s*([A-Za-z0-9:_]+)\s*((?:[A-Za-z0-9:_]+="[^"]+"\s*)*)\s*>\s*(.+)\s*<\/\s*\1\s*>\s*$/,
    }
    
    public static parseJSON(filename: string, func: (d: any) => void) {
        if (fs.existsSync(filename)) {
            const stream = fs.createReadStream(filename);
            const reader = readline.createInterface(stream);
            
            let dictionary: { entry: any[] } = { entry: [] };

            reader.on('line', l => { 
                if (l.startsWith(' ')) {
                    let entry = <string>l;
                    entry = entry.trim();
                    entry = entry.substring(0, entry.length - 1);
                    
                    dictionary.entry.push(JSON.parse(entry));
                }
            });
            
            reader.on('close', () => { 
                if (dictionary.entry.length > 0) {
                    func(dictionary);
                }
            });

            return;
        }

        func(null);
        return;
    }

    public static parseXML(filename: string, func: (d: any) => void) {

        if (fs.existsSync(filename)) {
    
            const stream = fs.createReadStream(filename);
            const reader = readline.createInterface(stream);
            
            const validator = new JMDictValidator();
            let builder: JMDictBuilder = undefined;
            let dictionary: any;

            let lineNo = 0;
            reader.on('line', l => { 

                lineNo++;

                if (builder === undefined) {
                    if (validator.parseXML(l)) {
                        const def = validator.getDefinition();
                        builder = new JMDictBuilder(def);
                    }
                }

                try {
                    let tag = this.getTag(lineNo, l);

                    if (tag) {
                        builder.nextTag(tag);
                        return;
                    }
                }
                catch(err) {
                    console.error(err.message);
                    reader.close();
                }
            });
            
            reader.on('close', () => { 
                dictionary = builder.get();

                if (dictionary != null) {
                    func(dictionary);
                }
            });

            return;
        }

        func(null);
        return;
    }
    
    private static getEntity(s: string): EntityDetails {
        const matches = this._regexLibrary['entity'].exec(s);
        
        if (matches == null) {
            return null;
        }

        const key = matches[1];
        const value = matches[2];
        
        return key && value ? { key, value } : null;
    }

    private static getTag(l: number, s: string): TagDetails {
        let singleTag = this._regexLibrary['single-tag'].exec(s);
        if (singleTag != null && singleTag[0] != null) {
            return {
                line: l,
                name: singleTag[2],
                inner: null,
                attr: this.getAttributes(singleTag[3]),
                opening: !singleTag[1],
                closing: singleTag[1] === '/' || singleTag[4] != null,
            }
        }

        let tagWithContent = this._regexLibrary['tag-with-content'].exec(s);
        if (tagWithContent != null && tagWithContent[0] != null) {
            return {
                line: l,
                name: tagWithContent[1],
                inner: tagWithContent[3],
                attr: this.getAttributes(tagWithContent[2]),
                opening: true,
                closing: true,
            }
        }
    }

    private static getAttributes(s: string): {[key: string]: string} {
        let attrRegex = /([A-Za-z0-9:_]+)="([^"]+)"/g;
        let attr: {[key: string]: string} = {};

        let match;
        while (match = attrRegex.exec(s)) {
            attr[match[1]] = match[2];
        }

        return attr;
    }
}

export class TagDetails {
    line: number;
    name: string;
    inner: string;
    attr: {[key: string]: string};
    opening: boolean;
    closing: boolean;
}

class EntityDetails {
    key: string;
    value: string;
}
