using System;
using System.Text;
using System.IO;
using System.Collections.Generic;
using System.Linq;

public class Program
{
    public static void Main(string[] args)
    {
        if (args.Length == 0) 
        {
            Console.WriteLine("Please specify a directory.");
            return;
        }

        Console.WriteLine("Building...");

        string rootPath = args[0];
        string componentsPath = Path.Combine(rootPath, "src");
        string outputPath = Path.Combine(rootPath, "dist", "bundle.js");

        var output = new StringBuilder();
        foreach (FileInfo fi in new DirectoryInfo(componentsPath).GetFiles()) 
        {
            if (fi.Extension == ".vue") 
            {
                output.AppendLine(new VueLoader(fi.FullName).GetJavaScript());
            }
            else if (fi.Extension == ".js") 
            {
                output.AppendLine(RemoveJsExports(fi.FullName));
            }
            else if (fi.Extension == ".ts") 
            {
                output.AppendLine(TsToJs(fi.FullName));
            }
        }
        
        File.WriteAllText(outputPath, output.ToString());

        Console.WriteLine("Done!");
    }

    public static string RemoveJsExports(string filename) 
    {
        // Remove "export"s from JavaScript file
        List<string> lines = File.ReadAllText(filename).Replace("\r\n", "\n").Split('\n').ToList();

        StringBuilder output = new StringBuilder();
        foreach (string line in lines) 
        {
            if (line.StartsWith("export function")) 
            {
                output.AppendLine(line.Substring(7)); // remove "export" from start of line
            } 
            else 
            {
                output.AppendLine(line); // no changes
            }
        }

        return output.ToString();
    }

    public static string TsToJs(string filename)
    {
        StringBuilder output = new StringBuilder();
        using (var file = File.OpenText(filename))
        {
            while (!file.EndOfStream)
            {
                string line = file.ReadLine();

                if (line.StartsWith("export function")) 
                    line = line.Substring(7); // remove "export" from start of line

                line = VueLoader.RemoveTypeScriptFromLine(line);
                if (line != null) // RemoveTypeScriptFromLine will return null if a line should be skipped
                    output.AppendLine(line);
            }
        }
        return output.ToString();
    }


    public class VueLoader
    {
        string _filename;
        string _componentName;



        public VueLoader(string filename)
        {
            //if (filename[1] != ':') // If filename hasn't already been mapped (e.g. C:\inetpub\wwwroot\)...
            //    filename = HttpContext.Current.Server.MapPath(filename); // ...then map it

            _filename = filename;
            FileInfo fi = new FileInfo(_filename);

            if (!fi.Name.Contains('-'))
                throw new Exception("Component name doesn't contain a dash '-'. (Vue component names should always be multi-word)");

            _componentName = fi.Name.Substring(0, fi.Name.Length - fi.Extension.Length);

            this.LoadSFC();
        }



        string _parsedScript;
        string _parsedStyle;

        private void LoadSFC()
        {
            List<string> templateLines = new List<string>();
            List<string> scriptLines = new List<string>();
            List<string> styleLines = new List<string>();

            bool inTemplate = false;
            bool inScript = false;
            bool inStyle = false;

            using (StreamReader file = File.OpenText(_filename))
            {
                bool inComponentsSection = false;

                while (!file.EndOfStream)
                {
                    string line = file.ReadLine();
                    string trimmedLine = line.Trim();

                    if (trimmedLine == "<template>")
                    {
                        inTemplate = true;
                    }
                    else if (trimmedLine == "</template>")
                    {
                        inTemplate = false;
                    }
                    else if (trimmedLine.StartsWith("<script")) // e.g. <script> or <script lang="ts">
                    {
                        inScript = true;
                    }
                    else if (trimmedLine == "</script>")
                    {
                        inScript = false;
                    }
                    else if (trimmedLine == "<style>")
                    {
                        inStyle = true;
                    }
                    else if (trimmedLine == "</style>")
                    {
                        inStyle = false;
                    }
                    else
                    {
                        if (((inTemplate ? 1 : 0)
                             + (inScript ? 1 : 0)
                              + (inStyle ? 1 : 0)) > 1)
                            throw new Exception("Multiple sections detected. Failed to parse SFC.");

                        if (inTemplate)
                        {
                            templateLines.Add(line);
                        }
                        else if (inScript)
                        {
                            string s = ParseSfcScriptLine(line, ref inComponentsSection);
                            if (s != null) // ParseSfcScriptLine will return null if a line should be skipped
                                scriptLines.Add(s);
                        }
                        else if (inStyle)
                        {
                            styleLines.Add(line);
                        }
                    }
                }
            }

            // Check for parsing errors
            List<string> errors = new List<string>();

            if (templateLines.Count == 0)
                errors.Add("<template> not found");

            if (scriptLines.Count == 0)
                errors.Add("<script> not found");
                
            int exportDefaultIdx = -1;
            bool needToFixClosingBrace = false;
            if (scriptLines.Count > 0)
            {
                // Look for start of component ("export default" line)
                for (int i = 0; i < scriptLines.Count; i++)
                {
                    string trimmedLine = scriptLines[i].Trim();
                    if (trimmedLine == "export default {")
                    {
                        exportDefaultIdx = i;
                        needToFixClosingBrace = true;
                        break;
                    }
                    else if (trimmedLine == "export default Vue.extend({")
                    {
                        exportDefaultIdx = i;
                        needToFixClosingBrace = false;
                        break;
                    }
                }
                if (exportDefaultIdx == -1)
                    errors.Add("Start of component not found (export default)");

                // Look for end of component
                if (!new[] { "}", "})", "});" }.Contains(scriptLines.Last().Trim()))
                    errors.Add("End of component not found");
            }
            if (errors.Count > 0)
                throw new Exception("Unable to parse component '" + _filename + "': \n\n" + string.Join("\n", errors));


            // Fix start of component
            scriptLines[exportDefaultIdx] = "Vue.component('" + _componentName + "', {";
            scriptLines.Insert(exportDefaultIdx + 1, "    template: " + BuildTemplateString(templateLines) + ",");

            // Fix end of component
            if (needToFixClosingBrace) 
            {
                scriptLines[scriptLines.Count - 1] = "});";
            }


            _parsedScript = string.Join(Environment.NewLine, scriptLines);
            _parsedStyle = string.Join(Environment.NewLine, styleLines);
        }


       

        // Write HTML output
//         public HtmlString Parse()
//         {
//             string style = string.IsNullOrWhiteSpace(_parsedStyle) ? "" :
// $@"<style>
// {_parsedStyle}
// </style>";
//             return new System.Web.HtmlString(
// $@"{style}
// <script>
// {_parsedScript}
// </script>
// ");
//         }

        public string GetJavaScript()
        {
            // Possible future TODO: Add support for <style> tag
            // Maybe using code like this:
            //     ------------------------------------------------------------------------------
            //     var customStyles = document.createElement('style'); 
            //     customStyles.appendChild(document.createTextNode(
            //        'body { background-color: ' + localStorage.getItem('background-color') + '}'
            //     ));
            //     document.documentElement.insertBefore(customStyles); 
            //     ------------------------------------------------------------------------------
            // See https://stackoverflow.com/questions/9345003/can-i-inject-a-css-file-programmatically-using-a-content-script-js-file
        
            return _parsedScript;
        }


        private string BuildTemplateString(List<string> templateLines)
        {
            // Convert template to JavaScript string
            return string.Join("\n+",
                templateLines.Select(
                    line => "\"" + line
                        .Replace("\\", "\\\\") // replace \ with \\ (e.g. if "\n" is used in JS expression in the template)
                        .Replace("\"", "\\\"") // replace " with \"
                    + "\""
                )
            );
            // FUTURE TODO (when IE 11 is no longer in use) : Use ES6 template literal instead :-
            // FUTURE // return "`" + string.Join(Environment.NewLine, templateLines)
            // FUTURE //     .Replace("\\", "\\\\") // replace \ with \\ (e.g. if "\n" is used in JS expression in the template)
            // FUTURE //     .Replace("`", "\\`") // replace ` with \`
            // FUTURE // + "`";
        }


        private string ParseSfcScriptLine(string line, ref bool inComponentsSection)
        {
            string trimmedLine = line.Trim();

            // BEGIN Remove "components" option
            if (trimmedLine.StartsWith("components: {"))
            {
                if (trimmedLine.EndsWith("},"))
                {
                    // All one one line, e.g. 
                    //     components: { studentAttachmentsPanel2 },
                    return null; // skip this line only
                }
                else
                {
                    // Multiple lines, e.g. 
                    //     components: {
                    //         StudentAttachmentsPanel
                    //     },
                    inComponentsSection = true;
                    // Skip this line and all future lines
                    // until finding a line that ends with "},"
                    return null;
                }
            }
            if (inComponentsSection)
            {
                if (trimmedLine.EndsWith("},"))
                {
                    inComponentsSection = false;
                }
                return null;
            }
            // END Remove "components" option

            return RemoveTypeScriptFromLine(line);
        }

        public static string RemoveTypeScriptFromLine(string line)
        {
            // Remove comments
            // (note: this doesn't include /* C-style comments! */)
            int commentIdx = line.IndexOf("//");
            if (commentIdx != -1)
            {
                line = line.Substring(0, commentIdx).TrimEnd();
            }

            // NOTE: ANY TIME 'line' IS UPDATED, 'trimmedLine' MUST BE UPDATED TOO !
            string trimmedLine = line.Trim();
            if (trimmedLine.Length == 0)
                return null; // remove empty lines


            // Remove imports
            // Note that import statements don't necessarily contain 'from', e.g. import '../js/@types/jqueryui';
            if (trimmedLine.StartsWith("import ") &&
                (trimmedLine.EndsWith("'") || trimmedLine.EndsWith("';") || trimmedLine.EndsWith("\"") || trimmedLine.EndsWith("\";")))
                return null;


            // Remove TypeScript function typing (annotated return types)
            // (required for some 'computed' return values, for type-checking to work properly)
            //   See https://vuejs.org/v2/guide/typescript.html#Annotating-Return-Types
            int functionIdx = line.IndexOf("function");
            if (functionIdx != -1)
            {
                int closingBracketIdx = line.LastIndexOf(")");
                if (closingBracketIdx != -1)
                {
                    int colonIdx = line.IndexOf(":", closingBracketIdx);
                    if (colonIdx != -1)
                    {
                        int openCurlyBraceIdx = line.IndexOf("{", colonIdx);
                        if (openCurlyBraceIdx != -1)
                        {
                            if (line[openCurlyBraceIdx - 1] == ' ') { openCurlyBraceIdx--; } // include space if present (looks tidier)
                            line = line.Substring(0, colonIdx) + line.Substring(openCurlyBraceIdx);
                            trimmedLine = line.Trim();
                            // e.g. replace "filteredList: function (): any[] {"
                            //         with "filteredList: function () {"
                        }
                    }
                }
            }


            // Remove TypeScript "as" casting
            //
            //  * TypeScript supports two types of casting, 
            //    via either angle brackets or the "as" keyword:
            // 
            //       "as" casting:
            //           Example 1 (methods) var element = event.target as HTMLElement;   
            //           Example 2 (data)    : {} as InitialData
            //           Example 3 (props)   : Object as PropType<InitialData>              
            //           Example 4 (props)   : Array as PropType<TableRow[]>                      
            //       
            //       Note that casting with angle brackets <> is *not* supported:
            //           e.g.
            //           Example 1  var element = <HTMLElement>event.target; // won't work
            //           Example 2  : <InitialData>{} // won't work
            //  
            //  * The cast needs to be ***at the end of the line***
            //  * The line must start with 'var', 'const' or 'let'
            //    OR "as" must be preceded by one of the following:
            //    ": []"    ": {}"   ": Array"    ": Object"
            //
            int asIdx = line.LastIndexOf(" as ");
            if (asIdx != -1)
            {
                bool dataObjOrArray = asIdx > 4 && new[] { ": {}", ": []" }.Contains(line.Substring(asIdx - 4, 4));
                bool propObject = asIdx > 8 && line.Substring(asIdx - 8, 8) == ": Object";
                bool propArray = asIdx > 7 && line.Substring(asIdx - 7, 7) == ": Array";

                if (dataObjOrArray || propObject || propArray
                    || trimmedLine.StartsWith("var") || trimmedLine.StartsWith("const") || trimmedLine.StartsWith("let"))
                {
                    int startIndex = asIdx + 4; // +4 to skip past " as "
                    int endIndex = line.Length - 1;
                    string restOfLine = line.Substring(startIndex, length: endIndex - startIndex + 1).Trim();

                    if (isVariableName(restOfLine.TrimEnd(new[] { ',', ';' }))) // don't pass ',' or ';' to isVariableName()
                    {
                        bool addComma = restOfLine.EndsWith(",");
                        bool addSemicolon = restOfLine.EndsWith(";");
                        line = line.Substring(0, asIdx)
                            + (addComma ? "," : "")
                            + (addSemicolon ? ";" : "");
                        trimmedLine = line.Trim();
                    }
                }
            }


            // Function parameter typing
            // e.g. success: function (msg: GetListReturn) {
            //  * Line contains "function"
            //  * Line contains opening bracket '('
            //  * Line ends with ") {"
            //  * Function parameters contains ":"
            functionIdx = line.IndexOf("function");
            if (functionIdx != -1)
            {
                // Console.WriteLine("OLD:" + line);
                if (trimmedLine.EndsWith(") {"))
                {
                    // Search for the opening bracket
                    //   Sometimes it comes straight after "function", 
                    //   and sometimes it doesn't:
                    //     e.g. success: function (name: string)
                    //      vs  function showName(name: string)
                    int startFrom = line.IndexOf('(', functionIdx);
                    if (startFrom != -1)
                    {
                        startFrom += 1; // Move past opening bracket
                        string funcParams = line.Substring(startFrom, line.LastIndexOf(')') - startFrom);
                        if (funcParams.Contains(":"))
                        {
                            
                            StringBuilder output = new StringBuilder();
                            bool inType = false;
                            foreach (char c in funcParams)
                            {
                                if (!inType)
                                {
                                    if (c == ':')
                                        inType = true;
                                    else
                                        output.Append(c);
                                }
                                else
                                { // if 'inType' is true...
                                    if (c == ',' || c == ')')
                                    {
                                        // The only 2 characters that can end the type definition 
                                        // are the next parameter ',' or the end of the parameter list ')'
                                        // (Although in practice we shouldn't come across ')' 
                                        //  because it isn't included in 'funcParams' string)
                                        output.Append(c);
                                        inType = false;
                                    }
                                }
                            }
                            line = line.Substring(0, startFrom)
                                          + output.ToString()
                                          + line.Substring(line.LastIndexOf(')'));
                            trimmedLine = line.Trim();
                            // Console.WriteLine("NEW: --->" + line.Substring(5));
                        }
                    }
                }
            }

            return line;
        }



        private static bool isVariableName(string str)
        {
            char[] allowedChars = new[] { '_', '$', '[', ']', '<', '>' };
            // _ and $ are included because JavaScipt variable names are allowed to contain those 2 characters.
            // [ ] < > are included to catch the following:
            //   "AttachmentListItem[]" (in data:)
            //   "Array<AttachmentListItem>" (in data:)
            //   "PropType<InitialData>" (in props:) See https://frontendsociety.com/using-a-typescript-interfaces-and-types-as-a-prop-type-in-vuejs-508ab3f83480
            //   "PropType<TableRow[]>" (in props:)  and https://github.com/vuejs/vue/pull/6856

            foreach (char c in str)
            {
                if (!char.IsLetterOrDigit(c) && !allowedChars.Contains(c))
                    return false;
            }
            return true;
        }

    }
}
