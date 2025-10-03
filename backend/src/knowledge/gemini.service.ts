import { Injectable } from '@nestjs/common';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";

@Injectable()
export class GeminiService {
  private chat: ChatGoogleGenerativeAI;

    constructor() {
      this.chat = new ChatGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_API_KEY,
        model: "gemini-2.0-flash-lite",
        maxOutputTokens: 2048,
      });
      
    }
    async generateResponse(prompt: string): Promise<string> {
        console.log("Generating response for prompt:", prompt);
        console.log("Using model:", this.chat.model);
      const response = await this.chat.invoke([
        new HumanMessage(prompt),
      ]);
      return response.text;
    }

}
