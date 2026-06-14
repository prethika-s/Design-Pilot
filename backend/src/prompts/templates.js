export const discoveryPrompt = (idea) => `
You are an expert product manager. Analyze the following rough product idea and generate 5 to 10 clarification questions to help define the product requirements and technical architecture.
Respond ONLY with a valid JSON object matching this schema:
{
  "questions": [
    "Question 1...",
    "Question 2..."
  ]
}

Product Idea: "${idea}"
JSON response:`;

export const requirementsPrompt = (idea, qas) => `
You are an expert product manager. Based on the initial idea and answers to the clarification questions, generate a structured requirements document.
Categorize each requirement into one of the following priorities: "Must Have", "Should Have", "Nice To Have", "Out Of Scope".
Respond ONLY with a valid JSON object matching this schema:
{
  "requirements": [
    {
      "title": "Requirement Title",
      "description": "Requirement Description",
      "priority": "Must Have"
    }
  ]
}

Initial Idea: "${idea}"
Clarifying Q&A:
${qas.map((qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`).join('\n')}

JSON response:`;

export const architecturePrompt = (idea, requirements) => `
You are a Staff Software Architect. Based on the product idea and structured requirements, generate three architectural recommendations:
1. "MERN Monolith"
2. "Microservices"
3. "Serverless"

Recommend exactly one option by setting "recommended" to true and the others to false.
Provide realistic rationale, team fit, and scalability descriptions for each.
Respond ONLY with a valid JSON object matching this schema:
{
  "options": [
    {
      "type": "MERN Monolith",
      "rationale": "Detailed rationale here...",
      "pros": ["Pro 1", "Pro 2"],
      "cons": ["Con 1", "Con 2"],
      "teamFit": "Description of why it fits the team...",
      "scalability": "Description of how it scales...",
      "recommended": true
    },
    ... (exactly 3 objects, one for each type)
  ]
}

Product Idea: "${idea}"
Requirements:
${requirements.map((r) => `- [${r.priority}] ${r.title}: ${r.description}`).join('\n')}

JSON response:`;

export const tradeoffPrompt = (idea, requirements) => `
You are a Technical Principal Engineer. Compare the following technology choices for the given project idea:
1. MongoDB vs PostgreSQL
2. REST vs GraphQL
3. AWS vs Vercel

For each comparison, provide scores (1-5, where 5 is best/easiest/highest scoring), recommendation, and reasoning.
Respond ONLY with a valid JSON object matching this schema:
{
  "comparison": [
    {
      "technology": "MongoDB vs PostgreSQL",
      "costScore": 4,
      "scalabilityScore": 5,
      "complexityScore": 3,
      "performanceScore": 4,
      "recommendation": "MongoDB",
      "reasoning": "Reasoning for MongoDB vs PostgreSQL..."
    },
    ... (exactly 3 objects, one for each pair)
  ]
}

Product Idea: "${idea}"
Requirements:
${requirements.map((r) => `- ${r.title}`).join('\n')}

JSON response:`;
