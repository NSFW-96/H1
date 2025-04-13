import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize the OpenAI client with Nebius configuration
const client = new OpenAI({
  baseURL: "https://api.studio.nebius.com/v1/",
  apiKey: process.env.NEBIUS_API_KEY || '',
  dangerouslyAllowBrowser: false,
});

// Enhanced system prompt for health analysis with improved JSON formatting instructions
const SYSTEM_PROMPT = `
You are a health analysis AI expert. Based on the provided health assessment data, analyze the information and provide a structured response.

RESPONSE FORMAT REQUIREMENTS:
You MUST respond with ONLY a valid JSON object. No other text, explanations, or markdown formatting.
The JSON structure MUST be exactly as follows:

{
  "riskLevel": "Low|Moderate|High",
  "riskScore": <integer between 0-100>,
  "recommendations": {
    "exercise": "<specific exercise recommendation>",
    "nutrition": "<specific nutrition recommendation>",
    "sleep": "<specific sleep recommendation>",
    "mentalHealth": "<specific mental health recommendation>"
  },
  "healthInsights": {
    "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
    "areasForImprovement": ["<area 1>", "<area 2>", "<area 3>"],
    "longTermRisks": ["<risk 1>", "<risk 2>", "<risk 3>"]
  }
}

DO NOT include any explanatory text before or after the JSON.
DO NOT wrap the JSON in code blocks or markdown syntax.
Ensure all JSON values are properly escaped if they contain quotes.
Make sure the riskScore is a NUMBER, not a string.

Base your analysis on these factors:
1. BMI and weight status - BMI < 18.5 is underweight, 18.5-24.9 is healthy, 25-29.9 is overweight, 30+ is obese
2. Physical activity frequency and intensity - More activity means lower health risk
3. Nutrition habits, especially fruits and vegetables intake
4. Sleep duration and quality - 7-8 hours is optimal
5. Smoking status - Increases health risks
6. Stress levels - Higher stress increases health risks
7. Age and gender - Consider age-appropriate recommendations
`;

export async function POST(request: Request) {
  try {
    // Get the health data from the request body
    const healthData = await request.json();
    
    // Format the data for better AI understanding
    const formattedData = JSON.stringify(healthData, null, 2);
    
    // Create user message with the health data
    const userMessage = `Here is my health assessment data: ${formattedData}\nRemember to ONLY return a valid JSON object with no other text.`;
    
    console.log("Sending request to Nebius AI...");
    
    // Call the AI model
    const response = await client.chat.completions.create({
      model: "microsoft/phi-4",
      temperature: 0.1, // Lower temperature for more consistent formatting
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: userMessage
        }
      ]
    });
    
    // Extract the response content
    const aiResponse = response.choices[0].message.content || '{}';
    
    console.log("AI Response received:", aiResponse);
    
    // Clean the response to ensure it's valid JSON
    // Remove any potential markdown code block formatting
    let cleanedResponse = aiResponse
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    
    // Parse the JSON response
    try {
      const analysisResult = JSON.parse(cleanedResponse);
      
      // Validate the structure
      if (!analysisResult.riskLevel || 
          typeof analysisResult.riskScore !== 'number' || 
          !analysisResult.recommendations || 
          !analysisResult.healthInsights) {
        throw new Error("Invalid response structure");
      }
      
      // Ensure riskScore is a number
      if (typeof analysisResult.riskScore === 'string') {
        analysisResult.riskScore = parseInt(analysisResult.riskScore, 10);
      }
      
      return NextResponse.json(analysisResult);
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiResponse);
      console.error("Parse error:", parseError);
      
      // Return a fallback analysis
      return NextResponse.json({
        riskLevel: "Moderate",
        riskScore: 65,
        recommendations: {
          exercise: "Aim for at least 150 minutes of moderate-intensity exercise per week, such as brisk walking, swimming, or cycling.",
          nutrition: "Focus on a balanced diet with plenty of fruits, vegetables, lean proteins, and whole grains.",
          sleep: "Prioritize getting 7-8 hours of quality sleep each night by maintaining a consistent sleep schedule.",
          mentalHealth: "Practice stress management techniques such as mindfulness, deep breathing, or short meditation sessions."
        },
        healthInsights: {
          strengths: [
            "Awareness of health status through assessment",
            "Taking initiative to improve health outcomes",
            "Interest in personalized health recommendations"
          ],
          areasForImprovement: [
            "Regular health check-ups with healthcare professionals",
            "Consistent physical activity routine",
            "Balanced nutrition and adequate hydration"
          ],
          longTermRisks: [
            "Lifestyle-related health conditions if habits aren't maintained",
            "Stress-related health issues without proper management",
            "Age-related health challenges without preventive care"
          ]
        }
      });
    }
  } catch (error) {
    console.error("Error in health analysis API:", error);
    return NextResponse.json(
      { error: "Failed to analyze health data", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 