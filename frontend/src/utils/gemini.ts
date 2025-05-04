
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_PUBLIC_GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction:`
        You are a data validation assistant.
        You will receive a bank account entry. The desired format of the account is 
        {
            accountNumber: string | number (hashed for security purposes) but when suggesting the solution, you need to suggest an account in number format;
            accountHolderName: string;
            bankName: string;
            bankCode: string;
            status: string (Can be Valid, Invalid, Post no credit, Dormant);
        }

        Your task is to flag why the account status is not valid based on the data you received:

        Detect formatting issues or missing values.

        Optionally suggest corrections if common mistakes are found.

        For each entry, return a comprehensive answer to guide the user to properly name the account valid:
    `
});


export const createPrompt = async (input: string): Promise<string> => {
    const result = await model.generateContent(input);
    return result.response.text()
}
