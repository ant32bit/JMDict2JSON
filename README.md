# JMDict2JSON
*A node app for converting the JMdict XML dictionary to JSON.*

##### Usage
After running `npm install` in root, run `npm run start`. If using VS Code, F5 will also run the app in debug mode.

##### Input
JMdict is an open-source Japanese dictionary provided by Monash University and updated and maintained by the Electronic Dictionary Research and Development Group.

JMdict.xml is not included in this repo (it's 100Mb+!!!). You can download it from Monash University: http://ftp.monash.edu/pub/nihongo/00INDEX.html#dic_fil

Once downloaded, place the file in a `./content` directory in the root and run as per the usage above.

##### Output
The app converts the JMdict file to JSON maintaining the structure of the XML entry. (See the example conversion below).

The entire file is valid JSON array of entries, but due to its size, it will not be parseable by most parsers. To work around this, the file is parseable as JSON line by line. the opening and closing square brackets are on the first and last line, and every line in the middle is a valid JSON dictionary entry followed by a comma.

`JMDictParser.parseJSON()` has been provided as an example of reading from JSON line-by-line.

##### About the project
- The project is provided under GNU General Public License. This is to ensure anyone can use it, but this repository benefits from any updates anyone does to the project. If you have an improvement, please make a pull request.

- The project was built to serve my purpose, which was a JSON equivalent of JMDict. It is a quick fix, so there is definitely room for improvements. Things I want to (eventually) fix: 

  - The structure of the JSON comes from a manually created version of the JMdict dtd. This can and should be recreated from the actual dtd to ensure that the project continues to work with future versions of JMdict.

  - The project reads the xml line by line and expects the a single tag on each line as the JMdict.xml file is provided. I don't expect it to change, but the app should be able to handle xml elements over multiple lines or multiple elements of a single line.

---
##### Example conversion

XML entry in JMDict.xml
```
<entry>
  <ent_seq>1318970</ent_seq>
  <k_ele>
    <keb>辞書</keb>
    <ke_pri>ichi1</ke_pri>
    <ke_pri>news1</ke_pri>
    <ke_pri>nf10</ke_pri>
  </k_ele>
  <r_ele>
    <reb>じしょ</reb>
    <re_pri>ichi1</re_pri>
    <re_pri>news1</re_pri>
    <re_pri>nf10</re_pri>
  </r_ele>
  <sense>
    <pos>&n;</pos>
    <gloss>dictionary</gloss>
    <gloss>lexicon</gloss>
  </sense>
  <sense>
    <xref>辞表</xref>
    <misc>&arch;</misc>
    <gloss>letter of resignation</gloss>
  </sense>
  <sense>
    <gloss xml:lang="dut">woordenboek</gloss>
    <gloss xml:lang="dut">lexicon</gloss>
    <gloss xml:lang="dut">dictionaire</gloss>
    <gloss xml:lang="dut">{i.h.b.} woordentolk</gloss>
    <gloss xml:lang="dut">thesaurus</gloss>
  </sense>
</entry>
```

JSON entry converted by JMDict2JSON
```
{
    "ent_seq":"1318970",
    "k_ele": [
        {
            "keb":"辞書",
            "ke_pri": [
                "ichi1",
                "news1",
                "nf10"
            ]
        }
    ],
    "r_ele": [
        {
            "reb":"じしょ",
            "re_pri": [
                "ichi1",
                "news1",
                "nf10"
            ]
        }
    ],
    "sense": [
        {
            "pos": ["&n;"],
            "gloss": [
                { "xml:content":"dictionary" },
                { "xml:content":"lexicon" }
            ]
        },
        {
            "xref":["辞表"],
            "misc":["&arch;"],
            "gloss": [
                {"xml:content":"letter of resignation"}
            ]
        },
        {
            "gloss":[
                {
                    "xml:lang":"dut",
                    "xml:content":"woordenboek"
                },
                {
                    "xml:lang":"dut",
                    "xml:content":"lexicon"
                },
                {
                    "xml:lang":"dut",
                    "xml:content":"dictionaire"
                },
                {
                    "xml:lang":"dut",
                    "xml:content":"{i.h.b.} woordentolk"
                },
                {
                    "xml:lang":"dut",
                    "xml:content":"thesaurus"
                }
            ]
        }
    ]
}
```

