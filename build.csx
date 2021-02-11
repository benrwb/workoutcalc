using System;
using System.Text;
using System.IO;
using System.Collections.Generic;
using System.Linq;

public class Program
{
    public static void Main(string[] args)
    {
        Console.WriteLine("Building...");

        string rootPath = args[0];
        string componentsPath = Path.Combine(rootPath, "src");
        string outputPath = Path.Combine(rootPath, "dist", "bundle.js");

        var output = new StringBuilder();
        foreach (FileInfo fi in new DirectoryInfo(componentsPath).GetFiles()) 
        {
            if (fi.Extension == ".vue") 
            {
                output.Append(new NaiveVueCompiler(fi.FullName).Parse());
            }
            else if (fi.Extension == ".js") 
            {
                output.Append(RemoveJsExports(fi.FullName));
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
            } else 
            {
                output.AppendLine(line); // no changes
            }
        }

        return output.ToString();
    }


    public class NaiveVueCompiler
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
        
        string _filename;
        string _componentName;
        List<string> _lines;

        public NaiveVueCompiler(string filename)
        {
            _filename = filename;
            FileInfo fi = new FileInfo(_filename);

            if (!fi.Name.Contains('-'))
                throw new Exception("Component name doesn't contain a dash '-'. (Vue component names should always be multi-word)");

            _componentName = fi.Name.Substring(0, fi.Name.Length - fi.Extension.Length);
            _lines = File.ReadAllText(filename).Replace("\r\n", "\n").Split('\n').ToList();
        }


        public string Parse()
        {
            StringBuilder output = new StringBuilder();
            List<string> templateLines = new List<string>();

            bool in_template = false,
                 in_components = false;

            foreach (string line in _lines)
            {
                var trimmedLine = line.Trim();

                if (trimmedLine == "<template>")
                {
                    in_template = true;
                    continue;
                }

                if (trimmedLine == "</template>")
                {
                    in_template = false;
                    continue;
                }

                if (in_template) 
                {
                    templateLines.Add(line);
                    continue;
                }
                
                if (trimmedLine.StartsWith("<script") || trimmedLine.StartsWith("</script>"))
                    continue; // ignore <script> tags

                if (trimmedLine.StartsWith("import ") && line.Contains(" from "))
                    continue; // ignore imports

                // Change export to Vue.component
                int offset = line.IndexOf("export default Vue.extend({"); // Vue 2 TypeScript
                if (offset == -1)
                {
                    offset = line.IndexOf("export default {"); // JavaScript
                }
                if (offset != -1) 
                {
                    string leftpad = new string(' ', offset);
                    output.AppendLine(leftpad + "Vue.component('" + _componentName + "', {");
                    output.AppendLine(leftpad + "    template: " + BuildTemplateString(templateLines) + ",");
                    continue;
                }

                if (line == "}") {
                    // This is required when "export default {" has been used.
                    // Because we changed it to "Vue.component({", we need to add
                    // a matching closing bracket at the end of the component.
                    output.AppendLine("});"); 
                    continue;
                }

                if (trimmedLine == "components: {") 
                {
                    in_components = true;
                    continue;
                }

                if (in_components)
                {
                    if (line.Contains("}"))
                        in_components = false;
                    continue; // skip "components:" section
                }

                output.AppendLine(line);
            }

            return output.ToString();
        }

        private string BuildTemplateString(List<string> templateLines)
        {
            return string.Join("\n+",
                templateLines.Select(
                    line => "\"" + line.Replace("\"", "\\\"") + "\""
                )
            );
        }
    }
}
