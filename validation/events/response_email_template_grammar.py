import frappe
import language_tool_python

def correct_grammar(doc, method):
    if doc.response:
        try:
            # Initialize the language tool
            tool = language_tool_python.LanguageTool('en-US')
            
            # Check grammar and generate corrections
            matches = tool.check(doc.response)
            corrected_text = language_tool_python.utils.correct(doc.response, matches)
            
            # # Debug messages
            # frappe.msgprint(f"Original: {doc.response}")
            # frappe.msgprint(f"Corrected: {corrected_text}")
            
            # Apply corrections if there are changes
            if corrected_text != doc.response:
                doc.response = corrected_text
                # frappe.msgprint("Grammar corrected successfully.")
        except Exception as e:
            # Handle and display any errors
            frappe.msgprint(f"An error occurred: {str(e)}")
