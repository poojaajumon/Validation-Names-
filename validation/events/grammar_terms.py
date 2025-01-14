import frappe
import language_tool_python

def correct_grammar(doc, method):
    if doc.terms:
        try:
            tool = language_tool_python.LanguageTool('en-US')
       
            matches = tool.check(doc.terms)
            corrected_text = language_tool_python.utils.correct(doc.terms, matches)
          
            if corrected_text != doc.terms:
                doc.terms = corrected_text
                # frappe.msgprint("Grammar corrected successfully.")
        except Exception as e:
          
            frappe.msgprint(f"An error occurred: {str(e)}")
