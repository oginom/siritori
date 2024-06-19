import OpenAI from "openai";
import { NextResponse } from "next/server";

const configuration = {
  apiKey: process.env.OPENAI_API_KEY,
};
const openai = new OpenAI(configuration);

export async function POST(request: Request) {
  const { prompt, image } = await request.json();

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
        {
            role: "user",
            content: [
                {type: "text", text: prompt},
                {type: "image_url", image_url: {
                    url: image,
                }},
            ]
        },
    ],
  });

  return NextResponse.json({ result: response.choices[0].message.content });
}
