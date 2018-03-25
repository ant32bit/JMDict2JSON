import { JMDictParser } from "./services/jmdict/jmdict-parser";
import { JMDictStringifier } from "./services/jmdict/jmdict-stringifier";


JMDictParser.parse('./content/JMdict.xml', d => { 
    console.log(d.entry.length); 
    
    JMDictStringifier.export('./content/JMdict.json', d);
});

