from flask import Flask, request, send_file, jsonify
from docxtpl import DocxTemplate
import os
import uuid
import subprocess
import tempfile

app = Flask(__name__)

@app.route("/generate", methods=["POST"])
def generate_certificate():
    try:
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400

        data = request.get_json()
        if not data:
            return jsonify({"error": "Empty JSON body"}), 400

        # Ensure template exists
        template_path = os.path.join("templates", "Bonafide_Certificate.docx")
        if not os.path.exists(template_path):
            return jsonify({"error": f"Template not found at {template_path}"}), 500

        # Create temporary directory for generated files
        with tempfile.TemporaryDirectory() as tmpdir:
            uid = str(uuid.uuid4())[:8]
            rollno = data.get("rollno", "student")

            output_docx = os.path.join(tmpdir, f"{rollno}_{uid}.docx")
            output_pdf = os.path.join(tmpdir, f"{rollno}_{uid}.pdf")

            # Render DOCX
            doc = DocxTemplate(template_path)
            doc.render(data)
            doc.save(output_docx)

            # Convert to PDF
            try:
                from docx2pdf import convert   # Windows only
                convert(output_docx, output_pdf)
            except Exception:
                # Fallback: LibreOffice (Linux deployment)
                subprocess.run([
                    "libreoffice",
                    "--headless",
                    "--convert-to", "pdf",
                    output_docx,
                    "--outdir", tmpdir
                ], check=True)

            # Send back the PDF
            return send_file(output_pdf, as_attachment=True)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    # run API on http://127.0.0.1:5000/generate
    app.run(host="0.0.0.0", port=5000, debug=True)
