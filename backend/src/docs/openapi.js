const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Yurist AI API",
    version: "1.2.0",
    description: "O'zbekiston qonunchiligi bo'yicha lokal AI yordamchi API. Tizim tashqi AI API ishlatmaydi; lokal qonun bazasi va rasmiy ochiq manbalar bilan ishlaydi."
  },
  servers: [
    { url: "http://127.0.0.1:5050", description: "Local development" }
  ],
  tags: [
    { name: "System", description: "Health, status and OpenAPI" },
    { name: "Auth", description: "Ro'yxatdan o'tish, kirish va profil" },
    { name: "Legal AI", description: "Huquqiy savol-javob va qidiruv" },
    { name: "Image Case", description: "Rasm asosida sug'urta/shikast holatini dastlabki tahlil qilish" },
    { name: "Agencies", description: "Eng yaqin davlat xizmatlari markazini topish" },
    { name: "News", description: "Lex.uz qonunchilik yangiliklari" },
    { name: "Feedback", description: "Javob sifatini baholash" }
  ],
  components: {
    securitySchemes: {
      sessionCookie: {
        type: "apiKey",
        in: "cookie",
        name: "yurist_ai_session"
      }
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
          requestId: { type: "string" }
        }
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          avatarData: { type: "string", nullable: true }
        }
      },
      Source: {
        type: "object",
        properties: {
          id: { type: "string", example: "L1" },
          type: { type: "string", enum: ["local", "online"] },
          title: { type: "string" },
          url: { type: "string", nullable: true },
          detail: { type: "string" }
        }
      },
      ChatRequest: {
        type: "object",
        required: ["question"],
        properties: {
          question: { type: "string", minLength: 3, maxLength: 6000 },
          personType: { type: "string", enum: ["individual", "legal"], default: "individual" },
          language: { type: "string", enum: ["uz-latn", "uz-cyrl", "ru"], default: "uz-latn" },
          online: { type: "boolean", default: true },
          history: { type: "array", items: { type: "object" } }
        }
      },
      ChatResponse: {
        type: "object",
        properties: {
          answerId: { type: "string" },
          answer: { type: "string" },
          domain: { type: "string" },
          sources: { type: "array", items: { $ref: "#/components/schemas/Source" } },
          confidence: { type: "string", enum: ["low", "medium", "high"] },
          confidenceScore: { type: "integer", minimum: 0, maximum: 100 },
          confidenceReasons: { type: "array", items: { type: "string" } },
          suggestedAuthority: { type: "object" },
          missingFacts: { type: "array", items: { type: "string" } },
          riskFlags: { type: "array", items: { type: "object" } },
          checkedAt: { type: "string", format: "date-time" }
        }
      }
    }
  },
  paths: {
    "/api/health": {
      get: {
        tags: ["System"],
        summary: "Service health",
        responses: {
          200: { description: "Service is alive" }
        }
      }
    },
    "/api/status": {
      get: {
        tags: ["System"],
        summary: "Knowledge base and official search status",
        responses: { 200: { description: "Status" } }
      }
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Current authenticated user",
        responses: { 200: { description: "Current user" } }
      }
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Registered" },
          400: { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
        }
      }
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" }
                }
              }
            }
          }
        },
        responses: { 200: { description: "Logged in" }, 401: { description: "Invalid credentials" } }
      }
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout",
        responses: { 200: { description: "Logged out" } }
      }
    },
    "/api/auth/profile": {
      put: {
        tags: ["Auth"],
        security: [{ sessionCookie: [] }],
        summary: "Update profile",
        responses: { 200: { description: "Profile updated" }, 401: { description: "Unauthorized" } }
      }
    },
    "/api/auth/account": {
      delete: {
        tags: ["Auth"],
        security: [{ sessionCookie: [] }],
        summary: "Delete own account",
        responses: { 200: { description: "Account deleted" }, 401: { description: "Unauthorized" } }
      }
    },
    "/api/chat": {
      post: {
        tags: ["Legal AI"],
        security: [{ sessionCookie: [] }],
        summary: "Generate legal answer",
        description: "Savolga lokal qonun bazasi, rasmiy manbalar va legal reasoner asosida javob beradi.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ChatRequest" } } }
        },
        responses: {
          200: { description: "AI answer", content: { "application/json": { schema: { $ref: "#/components/schemas/ChatResponse" } } } },
          401: { description: "Unauthorized" },
          429: { description: "Rate limited" }
        }
      }
    },
    "/api/search": {
      post: {
        tags: ["Legal AI"],
        security: [{ sessionCookie: [] }],
        summary: "Search local and official sources",
        responses: { 200: { description: "Search results" } }
      }
    },
    "/api/image-case": {
      post: {
        tags: ["Image Case"],
        security: [{ sessionCookie: [] }],
        summary: "Analyze image case",
        description: "Base64 image + izoh asosida sug'urta/shikast holatini dastlabki baholaydi.",
        responses: { 200: { description: "Image analysis answer" }, 400: { description: "Invalid image" } }
      }
    },
    "/api/agencies/nearest": {
      post: {
        tags: ["Agencies"],
        security: [{ sessionCookie: [] }],
        summary: "Find nearest public service offices",
        responses: { 200: { description: "Nearest offices" }, 400: { description: "Invalid coordinates" } }
      }
    },
    "/api/legal-news": {
      get: {
        tags: ["News"],
        summary: "Latest official legal news",
        responses: { 200: { description: "Lex.uz news" }, 502: { description: "Unable to fetch news" } }
      }
    },
    "/api/feedback": {
      post: {
        tags: ["Feedback"],
        summary: "Submit answer feedback",
        responses: { 201: { description: "Feedback saved" } }
      }
    },
    "/api/openapi.json": {
      get: {
        tags: ["System"],
        summary: "OpenAPI specification",
        responses: { 200: { description: "OpenAPI JSON" } }
      }
    }
  }
};

module.exports = { openapiSpec };
