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
  const STORAGE_KEY = "legal-ai-document";
  const [analysisResult, setAnalysisResult] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    try {
      return JSON.parse(saved);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  });
  const [analysisStreamText, setAnalysisStreamText] = useState("");
  const [question, setQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [qaResult, setQaResult] = useState(null);
  const BACKEND = import.meta.env.VITE_BACKEND_ORIGIN || "";

  const canUpload = useMemo(() => {
    return Boolean(selectedFile) && !isUploading;
  }, [selectedFile, isUploading]);

  async function handleUpload(event) {
    event.preventDefault();
    if (!selectedFile) return;

    setUploadError("");
    setAnalysisResult(null);
    setAnalysisStreamText("");
    setQaResult(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("document", selectedFile);

      const response = await fetch(`${BACKEND}/api/docs/upload?stream=true`, {
        method: "POST",
        headers: { Accept: "text/event-stream" },
        body: formData,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(
          payload?.error || "Failed to process the uploaded document.",
        );
      }

      if (!response.body) {
        throw new Error("Server did not return a streaming response.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let eventType = null;
      let eventData = "";
      let partialJson = "";

      const flushEvent = () => {
        const data = eventData.trim();
        eventData = "";
        if (!data) return;

        if (eventType === "done") {
          try {
            const payload = JSON.parse(data);
            setAnalysisResult(payload);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
            setAnalysisStreamText("");
          } catch (error) {
            setUploadError(
              error.message || "Failed to parse streamed analysis result.",
            );
          }
        } else {
          partialJson += data;
          setAnalysisStreamText(partialJson);

          const parsed = tryParseAnalysisJson(partialJson);
          if (parsed) {
            setAnalysisResult((prev) => ({
              ...(prev || {}),
              analysis: parsed,
            }));
          }
        }

        eventType = null;
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith("event:")) {
            eventType = line.slice(6).trim();
            continue;
          }

          if (line.startsWith("data:")) {
            eventData += line.slice(5).trim() + "\n";
            continue;
          }

          if (line === "") {
            flushEvent();
          }
        }
      }

      if (buffer.trim()) {
        if (buffer.startsWith("event:")) {
          eventType = buffer.slice(6).trim();
        } else if (buffer.startsWith("data:")) {
          eventData += buffer.slice(5).trim() + "\n";
        }
        flushEvent();
      }
    } catch (error) {
      setUploadError(error.message || "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  function tryParseAnalysisJson(text) {
    if (!text) return null;

    try {
      return JSON.parse(text);
    } catch {
      const fenceMatch = text.match(/```json\s*([\s\S]*?)\s*```/i);
      if (fenceMatch?.[1]) {
        try {
          return JSON.parse(fenceMatch[1]);
        } catch {
          return null;
        }
      }

      const firstBrace = text.indexOf("{");
      const lastBrace = text.lastIndexOf("}");
      if (firstBrace >= 0 && lastBrace > firstBrace) {
        try {
          return JSON.parse(text.slice(firstBrace, lastBrace + 1));
        } catch {
          return null;
        }
      }

      return null;
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
      const response = await fetch(
        `${BACKEND}/api/docs/${analysisResult.documentId}/query`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: trimmed,
            vectorRecord: analysisResult.vectorRecord,
          }),
        },
      );
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
        // className="rounded-4 p-4 p-md-5 bg-white"
        // style={{ border: "1px solid #d8e4ff" }}
        className="doc-card"
      >
        <h3 className="section-title" style={{ color: "#1d3557" }}>
          Legal Document Simplifier
        </h3>
        <p className="section-subtitle">
          Upload a legal PDF to generate a simplified explanation, key clauses,
          obligations, rights, risks, and procedural guidance using local AI.
        </p>

        <form onSubmit={handleUpload} className="upload-form">
          <div className="upload-left">
            <label htmlFor="legalPdf" className="upload-label">
              Upload legal PDF
            </label>

            <div className="file-upload-wrapper">
              <label htmlFor="legalPdf" className="custom-file-upload">
                Choose PDF
              </label>

              <span className="file-name">
                {selectedFile ? selectedFile.name : "No file selected"}
              </span>

              <input
                id="legalPdf"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) =>
                  setSelectedFile(event.target.files?.[0] || null)
                }
                hidden
              />
            </div>
          </div>

          <button type="submit" className="upload-btn" disabled={!canUpload}>
            {isUploading ? "Processing..." : "Upload & Analyze"}
          </button>
        </form>

        {selectedFile && (
          <p className="small text-secondary mt-2 mb-0">
            Selected file: <strong>{selectedFile.name}</strong>
          </p>
        )}

        {uploadError && (
          <div className="error-box" role="alert">
            {uploadError}
          </div>
        )}

        {analysisStreamText && (
          <div className="streaming-box mt-3">
            <h6 className="text-primary">Generating analysis...</h6>
            <pre
              className="streaming-output"
              style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
            >
              {analysisStreamText}
            </pre>
          </div>
        )}
      </div>

      {analysisResult?.analysis && (
        <div
          // className="rounded-4 p-4 p-md-5 bg-white"
          // style={{ border: "1px solid #d8e4ff" }}
          className="doc-card"
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
            <h5 className="h6 text-uppercase text-primary mb-2">
              Simplified Summary
            </h5>
            <p className="mb-0">{analysisResult.analysis.simplified_summary}</p>
          </section>

          <section className="mb-4">
            <h5 className="h6 text-uppercase text-primary mb-2">
              Key Legal Points
            </h5>
            <BulletList items={analysisResult.analysis.key_legal_points} />
          </section>

          <section className="mb-4">
            <h5 className="h6 text-uppercase text-primary mb-2">
              Important Clauses
            </h5>
            {analysisResult.analysis.important_clauses?.length ? (
              <div className="d-flex flex-column gap-2">
                {analysisResult.analysis.important_clauses.map(
                  (clause, index) => (
                    <div
                      key={`${clause.title}-${index}`}
                      className="rounded-3 p-3"
                      style={{
                        backgroundColor: "#f8fbff",
                        border: "1px solid #e1ebff",
                      }}
                    >
                      <p className="fw-semibold mb-1">{clause.title}</p>
                      <p className="mb-1">{clause.explanation}</p>
                      <p className="small mb-0 text-secondary">
                        Reference: {clause.citation}
                      </p>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <p className="text-secondary mb-0">No important clauses found.</p>
            )}
          </section>

          <section className="mb-4">
            <h5 className="h6 text-uppercase text-primary mb-2">
              Obligations & Rights
            </h5>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <div
                  className="rounded-3 p-3 h-100"
                  style={{
                    backgroundColor: "#f8fbff",
                    border: "1px solid #e1ebff",
                  }}
                >
                  <p className="fw-semibold mb-2">Your Obligations</p>
                  <BulletList
                    items={
                      analysisResult.analysis.obligations_and_rights
                        ?.obligations
                    }
                    emptyText="No obligations identified."
                  />
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="rounded-3 p-3 h-100 info-card">
                  <p className="fw-semibold mb-2">Your Rights</p>
                  <BulletList
                    items={
                      analysisResult.analysis.obligations_and_rights?.rights
                    }
                    emptyText="No rights identified."
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="mb-4">
            <h5 className="h6 text-uppercase text-primary mb-2">
              Possible Risks or Warnings
            </h5>
            <BulletList
              items={analysisResult.analysis.possible_risks_or_warnings}
            />
          </section>

          <section className="mb-4">
            <h5 className="h6 text-uppercase text-primary mb-2">
              Legal Procedure
            </h5>
            <p className="mb-2">
              {analysisResult.analysis.legal_procedure?.overview}
            </p>
            <BulletList
              items={analysisResult.analysis.legal_procedure?.stages}
            />
          </section>

          <section className="mb-4">
            <h5 className="h6 text-uppercase text-primary mb-2">
              Next Actions
            </h5>
            <BulletList items={analysisResult.analysis.next_actions} />
          </section>

          <section>
            <h5 className="h6 text-uppercase text-primary mb-2">
              Citations from Uploaded Document
            </h5>
            {analysisResult.analysis.citations?.length ? (
              <ul className="list-group list-group-flush">
                {analysisResult.analysis.citations.map((citation, index) => (
                  <li
                    key={`${citation.chunk_id}-${index}`}
                    className="list-group-item px-0"
                  >
                    <p className="mb-1 small fw-semibold text-secondary">
                      {citation.chunk_id}
                    </p>
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
          <form
            onSubmit={handleAskQuestion}
            className="d-flex flex-column flex-md-row gap-2"
          >
            <input
              type="text"
              class="form-control"
              aria-label="default input example"
              className="custom-input"
              placeholder="Example: What termination clauses should I be careful about?"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              disabled={isAsking}
            />
            <button
              type="submit"
              className="btn btn-info"
              disabled={isAsking || !question.trim()}
            >
              {isAsking ? "Asking..." : "Ask"}
            </button>
          </form>

          {qaResult?.answer && (
            <div className="ai-answer-box mt-3">
              <h5 className="h6 mb-2">AI Answer</h5>
              <p className="mb-3">{qaResult.answer}</p>
              {qaResult.citations?.length ? (
                <>
                  <p className="small fw-semibold text-secondary mb-1">
                    References
                  </p>
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
