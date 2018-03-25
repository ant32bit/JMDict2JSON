import * as fs from 'fs';

export abstract class JMDictStringifier {
    public static export(filename: string, dictionary: any) {
        if (dictionary == null) {
            return;
        }

        fs.open(filename, 'w', (err, fd) => {
            fs.write(fd, '[\n', () => {});
            
            for (const entry of dictionary.entry) {
                fs.write(fd, `  ${JSON.stringify(entry)},\n`, () => {});
            }

            fs.write(fd, ']\n', () => {});
        });
    }
}
