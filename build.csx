using System;
using System.Text;
using System.IO;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

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
        string outputPath = Path.Combine(rootPath, "docs", "bundle.js");

        var output = new StringBuilder();
        /* for Vue 3, `app` has to be defined first, 
         * so that we can use app.component() to define components below */ 
        output.AppendLine("const app = Vue.createApp();");
        /* Vue 2.7 or Vue 3: define composition API functions (to avoid having to prefix them with `Vue.`) */
        output.Append(@"
const nextTick = Vue.nextTick;
const ref = Vue.ref;
const watch = Vue.watch;
const computed = Vue.computed;
const reactive = Vue.reactive;
const onMounted = Vue.onMounted;
const onBeforeUnmount = Vue.onBeforeUnmount;
const defineComponent = Vue.defineComponent;
const toRef = Vue.toRef;
    ");

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
            if (line.StartsWith("export ")) 
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

                if (line.StartsWith("export "))
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
		bool _vue3;


        public VueLoader(string filename)
        {
            //if (filename[1] != ':') // If filename hasn't already been mapped (e.g. C:\inetpub\wwwroot\)...
            //    filename = HttpContext.Current.Server.MapPath(filename); // ...then map it

            _filename = filename;
            FileInfo fi = new FileInfo(_filename);

            _componentName = fi.Name.Substring(0, fi.Name.Length - fi.Extension.Length);

            if (!(_componentName.Contains('-') // contains hyphen
               || _componentName.Where(c => char.IsUpper(c)).Count() >= 2 // contains at least 2 uppercase characters
            ))
                throw new Exception("Component name needs to be either kebab-case or PascalCase ('" + _componentName + "')");
            // "In most projects, component names should always be PascalCase in single-file 
            //  components and string templates - but kebab-case in DOM templates."
            // -- https://vuejs.org/v2/style-guide/

            _vue3 = true;

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

                    // Note that we're using 'line', not 'trimmedLine', in the checks below.
                    // The main reason for this is the </template> tag.
                    // The template itself can contain template tags, e.g.
                    //     <template v-if="someCondition">
                    //          {{ someText }}
                    //     </template>
                    // If we looked for trimmedLine == "</template>" to find the end of the template,
                    // then it would match the section above, and the template would be cut off early
                    // ({{someText}} would be the last line)
                    // So we match line == "</template>" instead, which means the </template> tag
                    // has to appear on a line by itself, without any surrounding whitespace.

                    if (line == "<template>")
                    {
                        inTemplate = true;
                    }
                    else if (line == "</template>")
                    {
                        inTemplate = false;
                    }
                    else if (line == "<script>" || line == "<script lang=\"ts\">")
                    {
                        inScript = true;
                    }
                    else if (line == "</script>")
                    {
                        inScript = false;
                    }
                    else if (line == "<style>")
                    {
                        inStyle = true;
                    }
                    else if (line == "</style>")
                    {
                        inStyle = false;
                    }
                    else
                    {
                        if (((inTemplate ? 1 : 0)
                             + (inScript ? 1 : 0)
                              + (inStyle ? 1 : 0)) > 1)
                            throw new Exception("Multiple sections detected. Failed to parse SFC."); // check there is no whitespace around </template> tag

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
            
            if (_vue3)
                errors.AddRange(CheckForVue3Errors(templateLines, scriptLines));

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
                    else if (trimmedLine == "export default Vue.extend({") // Vue 2
                    {
                        exportDefaultIdx = i;
                        needToFixClosingBrace = false;
                        break;
                    }
                    else if (trimmedLine == "export default defineComponent({") // Vue 3
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
            scriptLines[exportDefaultIdx] = (_vue3 ? "app" : "Vue") + ".component('" + _componentName + "', {";
            // ^^^ Note (12/Aug/22): Originally I tried assigning components to variables
            //                       and then referencing them in the components: section,
            //                       e.g. var NumberInput = { template: `...
            //                            var GridRow = { components: { NumberInput }, template: `...
            //                       However I kept getting "failed to resolve component" errors.
            //                       I discovered this was because the order in which the components
            //                       appear is important, i.e. if a component tries to reference 
            //                       another component that isn't defined until lower down in the
            //                       file, then it will fail. 
            //                       I thought of 2 possible solutions:
            //                       (1) automatically build a dependency tree (complicated!)
            //                       (2) manually build a dependency tree; create a list of all
            //                           components in the app; include this list as part of the 
            //                           build process, with child components listed first
            //                           (so that they appear before components that use them)
            //                       Neither of these seemed ideal (both would create more work),
            //                       so I decided to register them using app.component instead.
            scriptLines.Insert(exportDefaultIdx + 1, "    template: " + BuildTemplateString(templateLines) + ",");

            // Fix end of component
            if (needToFixClosingBrace) 
            {
                scriptLines[scriptLines.Count - 1] = "});";
            }


            _parsedScript = string.Join(Environment.NewLine, scriptLines);
            _parsedStyle = string.Join(Environment.NewLine, styleLines);
        }


       
        private List<string> CheckForVue3Errors(List<string> templateLines, List<string> scriptLines)
        {
            List<string> errors = new List<string>();

            if (templateLines.First().Trim().StartsWith("<!--"))
                errors.Add("Template starts with a comment: `this.$el` will not work");

            if (templateLines.Last().Trim().EndsWith("-->"))
                errors.Add("Template ends with a comment: `this.$el` will not work");

            var valueMatch = new Regex(@"(this|self)\.value[.);,[ \r\n]"); // match `this.value` or `self.value` followed by a full stop, closing bracket, semicolon, etc.

            bool beforeDestroy = false, beforeUnmount = false;

            foreach (string line in scriptLines) 
            {
                if (line.Contains("$emit('input'") || line.Contains("$emit(\"input\""))
                    errors.Add("Emits `input` event (should be `update:modelValue`)");

                string trimmedLine = line.Trim();
                if ((trimmedLine.StartsWith("value:") || trimmedLine.StartsWith("'value':") || trimmedLine.StartsWith("\"value\":"))
                    && line.Contains("for use with v-model"))
                    errors.Add("Use of `value` prop (should be `modelValue`)");

                if (valueMatch.IsMatch(line))
                    errors.Add("Use of `this.value` or `self.value` (should be `.modelValue`)");

                if (trimmedLine.StartsWith("beforeDestroy: function") || trimmedLine.StartsWith("beforeDestroy() {"))
                    beforeDestroy = true;

                if (trimmedLine.StartsWith("beforeUnmount: function") || trimmedLine.StartsWith("beforeUnmount() {"))
                    beforeUnmount = true;
            }

            if (beforeDestroy && !beforeUnmount)
                errors.Add("`beforeDestroy` lifecycle option has been renamed to `beforeUnmount`");

            return errors;
        }

        // Write HTML output
//        public HtmlString Parse()
//        {
//            string style = string.IsNullOrWhiteSpace(_parsedStyle) ? "" :
// $@"<style>
// {_parsedStyle}
// </style>";
//             return new System.Web.HtmlString(
// $@"{style}
// <script>
// {_parsedScript}
// </script>
// ");
//        }

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
        
            // Add styles
            string styles = "";
            if (!string.IsNullOrWhiteSpace(_parsedStyle)) 
            {
                styles = @"
                {   // this is wrapped in a block because there might be more than 
                    // one component with styles, in which case we will have 
                    // multiple 'componentStyles' variables and don't want them to clash!
                    const componentStyles = document.createElement('style');
                    componentStyles.textContent = `" + _parsedStyle + @"`;
                    document.head.appendChild(componentStyles);
                }";
            }

            return _parsedScript + styles;
        }


        private string BuildTemplateString(List<string> templateLines)
        {
            // Convert template to JavaScript string
            return string.Join("\n+",
                templateLines.Select(
                    line => "\""
                    + line.Replace("\\", "\\\\") // replace \ with \\ (e.g. if "\n" is used in JS expression in the template)
                          .Replace("\"", "\\\"") // replace " with \"
                    + "\\n" // preserve newlines in template string (e.g. so that "white-space: pre-line" works correctly)
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
            string savedComment = ""; // comment will be restored later.
                                      // This is important because // does not always denote a comment.
                                      // For example if it appears in the middle of a string, e.g. "this is // not a comment"
                                      // or as part of a regular expression, e.g. str.replace(/\//g, '/' + zeroWidthSpace);
            int commentIdx = line.IndexOf("//");
            if (commentIdx != -1) // if found
            {
                while (commentIdx > 0 && char.IsWhiteSpace(line[commentIdx - 1]))
                    commentIdx--; // include preceding whitespace as part of the comment
                savedComment = line.Substring(commentIdx);
                line = line.Substring(0, commentIdx);
            }

            string trimmedLine = line.Trim();
            if (trimmedLine.Length == 0)
                return null; // remove empty lines
            // NOTE: ANY TIME 'line' IS UPDATED, 'trimmedLine' MUST BE UPDATED TOO !


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
                bool dataObjOrArray = asIdx > 4 && new[] { ": {}", ": []" }.Contains(line.Substring(asIdx - 4, 4))
                                   || asIdx > 6 && new[] { ": null" }.Contains(line.Substring(asIdx - 6, 6));
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
                                    else if (c != '?') // don't include question mark for optional parameters (e.g. "dateformat?: string")
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

            return line + savedComment;
        }



        private static bool isVariableName(string str)
        {
            char[] allowedChars = new[] { '_', '$', '[', ']', '.' };
            // _ and $ are included because JavaScipt variable names are allowed to contain those 2 characters.
            // [ ] are included to catch the following:
            //   "AttachmentListItem[]" (in data:)
            // Angle brackets are also allowed, e.g.
            //   "Array<AttachmentListItem>" (in data:)
            //   "PropType<InitialData>" (in props:) See https://frontendsociety.com/using-a-typescript-interfaces-and-types-as-a-prop-type-in-vuejs-508ab3f83480
            //   "PropType<TableRow[]>" (in props:)  and https://github.com/vuejs/vue/pull/6856
            // '.' is allowed for namespace-prefixed types, such as ZXing.BrowserCodeReader

            bool insideAngleBracket = false;
            foreach (char c in str)
            {
                if (c == '<')
                    insideAngleBracket = true;
                else if (c == '>')
                    insideAngleBracket = false;
                else if (!(char.IsLetterOrDigit(c) || allowedChars.Contains(c) || 
                    (insideAngleBracket && c == ' '))) // space is allowed, but only inside angle brackets (e.g. InstanceType<typeof ComponentName>)
                    return false;
            }
            return true;
        }

    }
}
