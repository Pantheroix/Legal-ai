import { useMemo, useState } from "react";
import { useTranslation } from "../i18n/LanguageContext";
import "../css/SchemeFinder.css";
const quickFilters = [
  { value: "Women Entrepreneurs", labelKey: "scheme.filter.women" },
  { value: "Students", labelKey: "scheme.filter.students" },
  { value: "Farmers", labelKey: "scheme.filter.farmers" },
  { value: "Senior Citizens", labelKey: "scheme.filter.seniors" },
  { value: "Startups", labelKey: "scheme.filter.startups" },
  { value: "Housing", labelKey: "scheme.filter.housing" },
];

const states = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

const categories = [
  { value: "Education", labelKey: "scheme.category.education" },
  { value: "Health", labelKey: "scheme.category.health" },
  { value: "Agriculture", labelKey: "scheme.category.agriculture" },
  { value: "Housing", labelKey: "scheme.category.housing" },
];

const languageNames = {
  en: "English",
  hi: "Hindi",
  kn: "Kannada",
};

function SchemeFinder() {
  const { language, t } = useTranslation();
  const [query, setQuery] = useState("");
  const [state, setState] = useState("");
  const [category, setCategory] = useState("");
  const [schemes, setSchemes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const canSearch = useMemo(() => {
    return Boolean(query.trim() || state || category) && !isLoading;
  }, [category, isLoading, query, state]);

  async function searchSchemes(searchOverrides = {}) {
    const nextQuery = searchOverrides.prompt ?? query;
    const nextState = searchOverrides.state ?? state;
    const nextCategory = searchOverrides.category ?? category;

    if (!nextQuery.trim() && !nextState && !nextCategory) return;

    setIsLoading(true);
    setError("");
    setWarning("");
    setHasSearched(true);

    try {
      const response = await fetch("/api/schemes/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: nextQuery,
          state: nextState,
          category: nextCategory,
          language: languageNames[language] || "English",
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error || t("scheme.searchError"));
      }

      setSchemes(Array.isArray(payload?.schemes) ? payload.schemes : []);
      setWarning(payload?.warning || "");
    } catch (searchError) {
      setSchemes([]);
      setWarning("");
      setError(searchError.message || t("scheme.searchError"));
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    searchSchemes();
  }

  function handleQuickFilter(filter) {
    setQuery(filter);
    searchSchemes({ prompt: filter });
  }

  return (
    <div className="scheme-page">
      <div className="scheme-header">

        <h1 className="scheme-title">
          {t("scheme.title")}
        </h1>

        <p className="scheme-subtitle">
          {t("scheme.subtitle")}
        </p>

      </div>

      <form
  className="scheme-search-card"
  onSubmit={handleSubmit}
>
        <div className="scheme-form">
          <div className="scheme-field">
            <label className="scheme-label">{t("scheme.searchLabel")}</label>
            <input
              type="text"
              className="scheme-input"
              placeholder={t("scheme.searchPlaceholder")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="scheme-field">
            <label className="scheme-label">{t("scheme.state")}</label>
            <select
              className="scheme-select"
              value={state}
              onChange={(event) => setState(event.target.value)}
            >
              <option value="" disabled>
                {t("scheme.selectState")}
              </option>
              {states.map((stateName) => (
                <option key={stateName} value={stateName}>
                  {stateName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label fw-semibold mb-1">{t("scheme.category")}</label>
            <select
              className="form-select"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="" disabled>
                {t("scheme.category")}
              </option>
              {categories.map((categoryOption) => (
                <option key={categoryOption.value} value={categoryOption.value}>
                  {t(categoryOption.labelKey)}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-2 d-grid">
            <button
              type="submit"
              className="scheme-btn"
              disabled={!canSearch}
            >
              {isLoading ? t("scheme.searching") : t("scheme.find")}
            </button>
          </div>
        </div>

        <div className="quick-tags">
          {quickFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className="quick-tag"
              style={{
                border: "1px solid #c9d9ff",
                backgroundColor: "#ffffff",
                color: "#1d3557",
              }}
              onClick={() => handleQuickFilter(filter.value)}
            >
              {t(filter.labelKey)}
            </button>
          ))}
        </div>
      </form>

      {error && (
        <div className="error-box" role="alert">
          {error}
        </div>
      )}

      {warning && (
        <div className="alert alert-warning mb-0" role="alert">
          {warning}
        </div>
      )}

      {hasSearched && !isLoading && !error && schemes.length === 0 && (
        <div className="rounded-4 p-3 p-md-4 bg-white" style={{ border: "1px solid #e1e8f6" }}>
          <p className="mb-0 text-secondary">{t("scheme.noResults")}</p>
        </div>
      )}

      <div className="scheme-results">
       <div className="d-flex flex-column gap-4">
          {schemes.map((scheme, index) => (
            <div
              key={scheme.id || `${scheme.name}-${index}`}
              className="scheme-card"
              
            >
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
                <div>
                  <h2 className="scheme-card-title">{scheme.name}</h2>
                  <span className="scheme-category">
                    {scheme.category || scheme.ministry || t("scheme.category")}
                  </span>
                </div>
                {scheme.official_url && (
                  <a
                    href={scheme.official_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline-primary btn-sm"
                  >
                    {t("scheme.viewDetails")}
                  </a>
                )}
              </div>
              {scheme.ministry && (
                <p className="small fw-semibold text-secondary mb-2">
                  {scheme.ministry}
                </p>
              )}
              <p className="scheme-description">{scheme.description}</p>
              <div className="d-flex flex-column gap-3">
                {Array.isArray(scheme.eligibility) && scheme.eligibility.length > 0 && (
                  <div>
                    <p className="fw-semibold mb-1">{t("scheme.eligibilityTitle")}</p>
                    <ul className="mb-0 ps-3">
                      {scheme.eligibility.map((item, itemIndex) => (
                        <li key={`${item}-${itemIndex}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {Array.isArray(scheme.benefits) && scheme.benefits.length > 0 && (
                  <div>
                    <p className="fw-semibold mb-1">{t("scheme.benefits")}</p>
                    <div className="d-flex flex-wrap gap-2">
                      {scheme.benefits.map((benefit, benefitIndex) => (
                        <span
                          key={`${benefit}-${benefitIndex}`}
                          className="badge text-bg-light border"
                        >
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {scheme.how_to_apply && (
                  <div
                    className="rounded-3 p-3"
                    style={{
                      backgroundColor: "#f6f9ff",
                      border: "1px dashed #b7caff",
                    }}
                  >
                    <p className="fw-semibold mb-1">{t("scheme.howToApply")}</p>
                    <p className="mb-0 text-secondary">{scheme.how_to_apply}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div>
          <div
            className="eligibility-card"
        
          >
            <h5 className="mb-3">{t("scheme.eligibilityTitle")}</h5>
            <ul className="list-group list-group-flush">
              <li className="list-group-item px-0">
                {t("scheme.eligibility.income")}
              </li>
              <li className="list-group-item px-0">
                {t("scheme.eligibility.aadhaar")}
              </li>
              <li className="list-group-item px-0">{t("scheme.eligibility.residence")}</li>
              <li className="list-group-item px-0">
                {t("scheme.eligibility.documents")}
              </li>
            </ul>

            <div
              className="rounded-3 p-3 mt-3"
              style={{
                backgroundColor: "#f6f9ff",
                border: "1px dashed #b7caff",
              }}
            >
              <p className="fw-semibold mb-1">{t("scheme.proTip")}</p>
              <p className="mb-0 text-secondary">
                {t("scheme.proTipText")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SchemeFinder;
