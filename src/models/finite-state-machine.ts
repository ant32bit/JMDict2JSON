export type Token = {type: string, value: string}
export type FSMDefinition = {[key: string]: {match: RegExp, token?: string, next: string}[]}

export class FiniteStateMachine {
    constructor(private start: string, private definiton: FSMDefinition) {}

    public parse(content: string): Token[] {
        let current = this.start;
        let parseStr = content;
        const tokens: Token[] = [];
        parseStr = parseStr.trimStart();
        while (parseStr.length > 0) {
            
            if (!this.definiton[current]) {
                throw new FSMTraversalError(current, content, content.length - parseStr.length);
            }

            let parsed = false;
            for (const path of this.definiton[current]) {
                const match = path.match.exec(parseStr);
                if (match) {
                    if (path.token)
                        tokens.push({type: path.token, value: match[0]});
                    
                    parseStr = parseStr.substring(match[0].length);
                    current = path.next;
                    parsed = true;
                    break;
                }
            }

            if (!parsed)
                throw new FSMTraversalError(current, content, content.length - parseStr.length);

            parseStr = parseStr.trimStart();
        }

        return tokens;
    }
}

export class FSMTraversalError extends Error {
    constructor(public currentState: string, public content: string, public position: number) {
        super();
        this.message = "Cannot traverse FSM";
    }
}