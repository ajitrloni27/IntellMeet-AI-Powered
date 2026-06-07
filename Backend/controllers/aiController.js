const fs = require("fs");

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "mock") {
    return null;
  }
  
  try {
    const { OpenAI } = require("openai");
    return new OpenAI({ apiKey });
  } catch (err) {
    console.log("Could not require openai library, falling back to mock mode.");
    return null;
  }
};

exports.transcribe = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No audio file uploaded" });
    }

    const openai = getOpenAIClient();
    if (!openai) {
      console.log("OpenAI: running in MOCK mode for transcription.");
      const mockTranscripts = [
        "Welcome everyone to our weekly sync. Today we'll align on engineering goals.",
        "Ajit will implement the signaling server. Let's make sure it's fully tested.",
        "Jordan will finalize the front-end layout and wire it to the API.",
        "Let's target shipping the release on Friday afternoon.",
        "That's all for today. Let's start coding."
      ];
      
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.json({
        text: mockTranscripts.join(" ")
      });
    }

    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: "whisper-1"
    });

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.json({
      text: response.text
    });
  } catch (error) {
    console.error("Transcription error:", error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: "Transcription failed", error: error.message });
  }
};

exports.generateSummary = async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript) {
      return res.status(400).json({ message: "Transcript text is required" });
    }

    const openai = getOpenAIClient();
    if (!openai) {
      console.log("OpenAI: running in MOCK mode for summary.");
      const mockSummary = {
        summary: "The team aligned on the engineering sprint plan. Ajit is tasked with deploying the signaling server, and Jordan is responsible for finalizing the frontend wiring. The goal is to ship by Friday afternoon.",
        actionItems: [
          { task: "Implement and deploy the signaling server", owner: "Ajit", priority: "High", dueDate: "2026-06-05" },
          { task: "Finalize frontend meeting layouts and wire to API", owner: "Jordan", priority: "Medium", dueDate: "2026-06-05" },
          { task: "Prepare release notes and run regression test suites", owner: "Team", priority: "Low", dueDate: "2026-06-06" }
        ],
        confidenceScore: 0.95
      };
      return res.json(mockSummary);
    }

    const prompt = `
      Analyze the following meeting transcript. Provide:
      1. A short, professional summary.
      2. A list of action items, specifying the task, assignee/owner (or "Unassigned" if not mentioned), priority (High, Medium, Low), and an estimated due date (YYYY-MM-DD).
      
      Format the response as a JSON object matching this structure:
      {
        "summary": "...",
        "actionItems": [
          { "task": "...", "owner": "...", "priority": "...", "dueDate": "..." }
        ],
        "confidenceScore": 0.98
      }
      
      Transcript:
      "${transcript}"
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    res.json(result);
  } catch (error) {
    console.error("Summary generation error:", error);
    res.status(500).json({ message: "Summary generation failed", error: error.message });
  }
};
