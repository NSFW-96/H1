import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Nebius AI Client Configuration
const client = new OpenAI({
  baseURL: 'https://api.studio.nebius.com/v1/',
  apiKey: process.env.NEBIUS_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { systemPrompt, userPrompt } = await request.json();

    // Make the actual API call to Nebius AI
    try {
      const response = await client.chat.completions.create({
        model: "microsoft/phi-4",
        temperature: 0,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ]
      });

      // Parse the JSON response from the AI
      const aiResponseText = response.choices[0].message.content;
      console.log("Raw AI response:", aiResponseText);
      
      // Clean the response - handle the case when the model returns markdown code blocks
      let cleanedResponse = aiResponseText;
      
      // Check if the response contains a markdown JSON code block
      const jsonRegex = /```(?:json)?\s*({[\s\S]*?})\s*```/;
      const match = aiResponseText.match(jsonRegex);
      
      if (match && match[1]) {
        // Extract the JSON from inside the code block
        cleanedResponse = match[1];
      }
      
      let aiResponseData;
      
      try {
        // Parse the JSON returned from the AI
        aiResponseData = JSON.parse(cleanedResponse);
        
        // Validate the structure of the response
        if (!aiResponseData.riskLevel || !aiResponseData.recommendations || !aiResponseData.healthInsights) {
          throw new Error("Invalid response structure from AI");
        }
        
        console.log("Successfully parsed AI response");
        return NextResponse.json(aiResponseData);
      } catch (parseError) {
        console.error("Failed to parse AI response as JSON:", parseError);
        console.error("Cleaned AI response:", cleanedResponse);
        
        // Fallback to mock response if AI response cannot be parsed
        return NextResponse.json(getMockResponse(userPrompt));
      }
    } catch (aiError) {
      console.error("Error calling Nebius AI:", aiError);
      
      // Fallback to mock response if AI service is not available
      return NextResponse.json(getMockResponse(userPrompt));
    }
  } catch (error) {
    console.error('Error in health AI analysis:', error);
    return NextResponse.json(
      { error: 'Failed to process health analysis' },
      { status: 500 }
    );
  }
}

// Fallback mock response function
function getMockResponse(userPrompt: string) {
  return {
    "riskLevel": userPrompt.includes('BMI Category: Obese') || userPrompt.includes('Smoking status: yes') ? 
      "High" : userPrompt.includes('BMI Category: Overweight') ? "Moderate" : "Low",
    "riskScore": userPrompt.includes('BMI Category: Obese') ? 
      75 : userPrompt.includes('BMI Category: Overweight') ? 55 : 30,
    "recommendations": {
      "exercise": userPrompt.includes('activity days per week: 0-1') ? 
        "Start with gentle walks for 10 minutes daily, gradually increasing to 30 minutes three times per week." : 
        "Continue your current exercise routine, but add variety with strength training twice weekly.",
      "nutrition": userPrompt.includes('Fruits and vegetables intake: 0-1') ? 
        "Focus on adding one fruit at breakfast and vegetables with lunch and dinner daily." : 
        "Maintain your balanced diet, but consider adding more plant-based proteins and reducing processed foods.",
      "sleep": userPrompt.includes('Sleep duration: less-than-5') ? 
        "Prioritize getting at least 6 hours of sleep by establishing a regular sleep schedule and bedtime routine." : 
        "Your sleep duration is good; focus on improving quality by limiting screen time before bed.",
      "mentalHealth": userPrompt.includes('Stress level: high') ? 
        "Practice 5-minute deep breathing exercises twice daily and consider a 10-minute daily meditation practice." : 
        "Continue your good stress management practices and add outdoor activities to further boost mood."
    },
    "healthInsights": {
      "strengths": [
        userPrompt.includes('BMI Category: Healthy Weight') ? 
          "Maintaining a healthy weight range" : "Taking initiative for health improvement",
        userPrompt.includes('activity days per week: 4-5') || userPrompt.includes('activity days per week: 6-7') ? 
          "Consistent physical activity routine" : "Awareness of personal health metrics",
        userPrompt.includes('Sleep duration: 7-8') ? 
          "Prioritizing adequate sleep" : "Engaging with health assessment tools"
      ],
      "areasForImprovement": [
        userPrompt.includes('Water intake: 0-2') ? 
          "Increasing daily water intake to at least 2 liters" : "Maintaining hydration throughout the day",
        userPrompt.includes('Fruits and vegetables intake: 0-1') || userPrompt.includes('Fruits and vegetables intake: 2-3') ? 
          "Adding more fruits and vegetables to your diet" : "Varying your nutritional sources",
        userPrompt.includes('Activity level: sedentary') || userPrompt.includes('Activity level: light') ? 
          "Increasing overall physical activity level" : "Adding variety to exercise routine"
      ],
      "longTermRisks": [
        userPrompt.includes('BMI: 3') ? 
          "Increased risk of cardiovascular issues if weight remains elevated" : "Monitor cholesterol levels regularly as you age",
        userPrompt.includes('Smoking status: yes') ? 
          "High risk of respiratory and cardiovascular disease due to smoking" : "Watch for signs of joint issues as you maintain your exercise routine",
        userPrompt.includes('Sleep duration: less-than-5') ? 
          "Increased risk of cognitive decline with chronic sleep deprivation" : "Pay attention to stress management as life demands change"
      ]
    }
  };
} 