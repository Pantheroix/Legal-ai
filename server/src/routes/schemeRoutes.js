import { Router } from "express";

import { getGovernmentSchemes } from "../services/geminiService.js";

const schemeRouter = Router();

const fallbackSchemes = [
  {
    id: 1,
    name: "National Food Security Act",
    ministry: "Ministry of Consumer Affairs, Food and Public Distribution",
    category: "Food",
    description:
      "Provides subsidized food grains to eligible households through the public distribution system.",
    eligibility: [
      "Priority households identified by the state government",
      "Antyodaya Anna Yojana households",
      "Valid ration card or eligible household documentation",
    ],
    benefits: [
      "Subsidized rice, wheat, or coarse grains",
      "Monthly food grain entitlement",
    ],
    how_to_apply:
      "Apply through the state food and civil supplies department or local ration office.",
    official_url: "https://nfsa.gov.in/",
    languages: ["English", "Hindi"],
  },
  {
    id: 2,
    name: "Pradhan Mantri Kisan Samman Nidhi",
    ministry: "Ministry of Agriculture and Farmers Welfare",
    category: "Agriculture",
    description:
      "Income support scheme for eligible farmer families across India.",
    eligibility: [
      "Eligible landholding farmer families",
      "Valid Aadhaar and bank account details",
      "Exclusions apply for higher-income categories",
    ],
    benefits: ["Up to Rs 6,000 per year in installments"],
    how_to_apply:
      "Register through the PM-KISAN portal, Common Service Centre, or local agriculture office.",
    official_url: "https://pmkisan.gov.in/",
    languages: ["English", "Hindi"],
  },
  {
    id: 3,
    name: "National Scholarship Portal",
    ministry: "Ministry of Electronics and Information Technology",
    category: "Education",
    description:
      "Single digital platform for central and state scholarship schemes for students.",
    eligibility: [
      "Student eligibility depends on the selected scholarship",
      "Income certificate may be required",
      "Educational institution verification is usually required",
    ],
    benefits: ["Tuition support", "Maintenance allowance where applicable"],
    how_to_apply:
      "Create an account on the National Scholarship Portal and apply for eligible schemes.",
    official_url: "https://scholarships.gov.in/",
    languages: ["English", "Hindi"],
  },
];

function getFallbackSchemes({ prompt, category }) {
  const searchText = `${prompt} ${category}`.toLowerCase();
  const matches = fallbackSchemes.filter((scheme) => {
    return (
      scheme.name.toLowerCase().includes(searchText) ||
      scheme.category.toLowerCase().includes(searchText) ||
      searchText.includes(scheme.category.toLowerCase())
    );
  });

  return matches.length > 0 ? matches : fallbackSchemes;
}

schemeRouter.post("/schemes/search", async (req, res) => {
  try {
    const prompt = String(req.body?.prompt || "").trim();
    const state = String(req.body?.state || "").trim();
    const category = String(req.body?.category || "").trim();
    const language = String(req.body?.language || "English").trim();

    if (!prompt && !state && !category) {
      res.status(400).json({
        error: "Search text, state, or category is required.",
      });
      return;
    }

    const schemes = await getGovernmentSchemes({
      prompt,
      state,
      category,
      language,
    });

    res.json({ schemes });
  } catch (error) {
    console.error("[scheme-search]", error.message);
    res.json({
      schemes: getFallbackSchemes({
        prompt: String(req.body?.prompt || ""),
        category: String(req.body?.category || ""),
      }),
      warning:
        error.message ||
        "Gemini was unavailable, so fallback schemes were returned.",
    });
  }
});

export default schemeRouter;
