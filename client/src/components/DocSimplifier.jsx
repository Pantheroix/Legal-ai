import { useMemo, useState } from "react";

function BulletList({ items, emptyText = "No items available." }) {
  if (!items || items.length === 0) {
    return <p className="text-secondary mb-0">{emptyText}</p>;
  }

  return (
    <ul className="mb-0 ps-3">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="mb-1">
          {item}
        </li>
      ))}
    </ul>
  );
}

function DocSimplifier() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [question, setQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [qaResult, setQaResult] = useState(null);

  const canUpload = useMemo(() => {
    return Boolean(selectedFile) && !isUploading;
  }, [selectedFile, isUploading]);

  async function handleUpload(event) {
    event.preventDefault();
    if (!selectedFile) return;

    setUploadError("");
    setAnalysisResult(null);
    setQaResult(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("document", selectedFile);

      const response = await fetch("/api/docs/upload", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to process the uploaded document.");
      }

      setAnalysisResult(payload);
    } catch (error) {
      setUploadError(error.message || "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleAskQuestion(event) {
    event.preventDefault();
    if (!analysisResult?.documentId) return;
    const trimmed = question.trim();
    if (!trimmed) return;

    setIsAsking(true);
    setQaResult(null);
    setUploadError("");

    try {
      const response = await fetch(`/api/docs/${analysisResult.documentId}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "Could not answer your question.");
      }
      setQaResult(payload);
    } catch (error) {
      setUploadError(error.message || "Question request failed.");
    } finally {
      setIsAsking(false);
    }
  }

  return (
    <div className="d-flex flex-column gap-4">
      <div
        className="rounded-4 p-4 p-md-5 bg-white"
        style={{ border: "1px solid #d8e4ff" }}
      >
        <h3 className="h4 mb-2" style={{ color: "#1d3557" }}>
          Legal Document Simplifier
        </h3>
        <p className="text-secondary mb-4">
          Upload a legal PDF to generate a simplified explanation, key clauses,
          obligations, rights, risks, and procedural guidance using local AI.
        </p>

        <form onSubmit={handleUpload} className="row g-3 align-items-end">
          <div className="col-12 col-lg-8">
            <label htmlFor="legalPdf" className="form-label fw-semibold mb-1">
              Upload legal PDF
            </label>
            <input
              id="legalPdf"
              type="file"
              accept="application/pdf,.pdf"
              className="form-control"
              onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
            />
          </div>
          <div className="col-12 col-lg-4 d-grid">
            <button type="submit" className="btn btn-primary fw-semibold" disabled={!canUpload}>
              {isUploading ? "Processing..." : "Upload & Analyze"}
            </button>
          </div>
        </form>

        {selectedFile && (
          <p className="small text-secondary mt-2 mb-0">
            Selected file: <strong>{selectedFile.name}</strong>
          </p>
        )}

        {uploadError && (
          <div className="alert alert-danger mt-3 mb-0" role="alert">
            {uploadError}
          </div>
        )}
      </div>

      {analysisResult?.analysis && (
        <div
          className="rounded-4 p-4 p-md-5 bg-white"
          style={{ border: "1px solid #d8e4ff" }}
        >
          <div className="d-flex flex-wrap justify-content-between gap-2 mb-4">
            <h4 className="h5 mb-0" style={{ color: "#1d3557" }}>
              Structured Legal Guidance
            </h4>
            <span className="badge text-bg-light border">
              Chunks indexed: {analysisResult?.stats?.chunks ?? "-"}
            </span>
          </div>

          <section className="mb-4">
            <h5 className="h6 text-uppercase text-primary mb-2">Simplified Summary</h5>
            <p className="mb-0">{analysisResult.analysis.simplified_summary}</p>
          </section>

          <section className="mb-4">
            <h5 className="h6 text-uppercase text-primary mb-2">Key Legal Points</h5>
            <BulletList items={analysisResult.analysis.key_legal_points} />
          </section>

          <section className="mb-4">
            <h5 className="h6 text-uppercase text-primary mb-2">Important Clauses</h5>
            {analysisResult.analysis.important_clauses?.length ? (
              <div className="d-flex flex-column gap-2">
                {analysisResult.analysis.important_clauses.map((clause, index) => (
                  <div
                    key={`${clause.title}-${index}`}
                    className="rounded-3 p-3"
                    style={{ backgroundColor: "#f8fbff", border: "1px solid #e1ebff" }}
                  >
                    <p className="fw-semibold mb-1">{clause.title}</p>
                    <p className="mb-1">{clause.explanation}</p>
                    <p className="small mb-0 text-secondary">Reference: {clause.citation}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-secondary mb-0">No important clauses found.</p>
            )}
          </section>

          <section className="mb-4">
            <h5 className="h6 text-uppercase text-primary mb-2">Obligations & Rights</h5>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <div
                  className="rounded-3 p-3 h-100"
                  style={{ backgroundColor: "#f8fbff", border: "1px solid #e1ebff" }}
                >
                  <p className="fw-semibold mb-2">Your Obligations</p>
                  <BulletList
                    items={analysisResult.analysis.obligations_and_rights?.obligations}
                    emptyText="No obligations identified."
                  />
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div
                  className="rounded-3 p-3 h-100"
                  style={{ backgroundColor: "#f8fbff", border: "1px solid #e1ebff" }}
                >
                  <p className="fw-semibold mb-2">Your Rights</p>
                  <BulletList
                    items={analysisResult.analysis.obligations_and_rights?.rights}
                    emptyText="No rights identified."
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="mb-4">
            <h5 className="h6 text-uppercase text-primary mb-2">Possible Risks or Warnings</h5>
            <BulletList items={analysisResult.analysis.possible_risks_or_warnings} />
          </section>

          <section className="mb-4">
            <h5 className="h6 text-uppercase text-primary mb-2">Legal Procedure</h5>
            <p className="mb-2">{analysisResult.analysis.legal_procedure?.overview}</p>
            <BulletList items={analysisResult.analysis.legal_procedure?.stages} />
          </section>

          <section className="mb-4">
            <h5 className="h6 text-uppercase text-primary mb-2">Next Actions</h5>
            <BulletList items={analysisResult.analysis.next_actions} />
          </section>

          <section>
            <h5 className="h6 text-uppercase text-primary mb-2">
              Citations from Uploaded Document
            </h5>
            {analysisResult.analysis.citations?.length ? (
              <ul className="list-group list-group-flush">
                {analysisResult.analysis.citations.map((citation, index) => (
                  <li key={`${citation.chunk_id}-${index}`} className="list-group-item px-0">
                    <p className="mb-1 small fw-semibold text-secondary">{citation.chunk_id}</p>
                    <p className="mb-0">{citation.quote}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-secondary mb-0">No citations available.</p>
            )}
          </section>
        </div>
      )}

      {analysisResult?.documentId && (
        <div
          className="rounded-4 p-4 p-md-5 bg-white"
          style={{ border: "1px solid #d8e4ff" }}
        >
          <h4 className="h5 mb-3" style={{ color: "#1d3557" }}>
            Ask Follow-up Questions
          </h4>
          <form onSubmit={handleAskQuestion} className="d-flex flex-column flex-md-row gap-2">
            <input
              type="text"
              className="form-control"
              placeholder="Example: What termination clauses should I be careful about?"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              disabled={isAsking}
            />
            <button
              type="submit"
              className="btn btn-outline-primary"
              disabled={isAsking || !question.trim()}
            >
              {isAsking ? "Asking..." : "Ask"}
            </button>
          </form>

          {qaResult?.answer && (
            <div
              className="rounded-3 p-3 mt-3"
              style={{ backgroundColor: "#f8fbff", border: "1px solid #e1ebff" }}
            >
              <h5 className="h6 mb-2">AI Answer</h5>
              <p className="mb-3">{qaResult.answer}</p>
              {qaResult.citations?.length ? (
                <>
                  <p className="small fw-semibold text-secondary mb-1">References</p>
                  <ul className="mb-0 ps-3">
                    {qaResult.citations.map((citation, index) => (
                      <li key={`${citation.chunk_id}-${index}`}>
                        <strong>{citation.chunk_id}:</strong> {citation.quote}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DocSimplifier;
