import { JMDictParser } from "./services/jmdict/jmdict-parser";
import { JMDictStringifier } from "./services/jmdict/jmdict-stringifier";

for (const dict of [
    'JMdict',
    'JMdict_e',
    'JMnedict', 
    'kanjidic2',
]) {
    JMDictParser.parseXML(`./content/${dict}.xml`, d => { 
        if (!d.entry)
            d.entry = d.character

        console.log(d.entry.length);
        JMDictStringifier.export(`./content/${dict}.json`, d);
    });
}
